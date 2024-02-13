import { assert, expect } from "chai";
import { SmartContractTransactionsFactory } from "./smartContractTransactionsFactory";
import { Address } from "../address";
import { Code } from "../smartcontracts/code";
import { AbiRegistry } from "../smartcontracts/typesystem/abiRegistry";
import { U32Value } from "../smartcontracts";
import { CONTRACT_DEPLOY_ADDRESS } from "../constants";
import { loadContractCode, loadAbiRegistry } from "../testutils/utils";
import { Err } from "../errors";
import { TransactionsFactoryConfig } from "./transactionsFactoryConfig";
import BigNumber from "bignumber.js";
import { Token, NextTokenTransfer, TokenComputer } from "../tokens";

describe("test smart contract transactions factory", function () {
    const config = new TransactionsFactoryConfig("D");
    let smartContractFactory: SmartContractTransactionsFactory;
    let abiAwareFactory: SmartContractTransactionsFactory;
    let adderByteCode: Code;
    let abiRegistry: AbiRegistry;

    before(async function () {
        smartContractFactory = new SmartContractTransactionsFactory({
            config: config,
            tokenComputer: new TokenComputer(),
        });

        adderByteCode = await loadContractCode("src/testdata/adder.wasm");
        abiRegistry = await loadAbiRegistry("src/testdata/adder.abi.json");

        abiAwareFactory = new SmartContractTransactionsFactory({
            config: config,
            abi: abiRegistry,
            tokenComputer: new TokenComputer(),
        });
    });

    it("should throw error when args are not of type 'TypedValue'", async function () {
        const sender = Address.fromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        const gasLimit = 6000000;
        const args = [0];

        assert.throws(
            () =>
                smartContractFactory.createTransactionForDeploy({
                    sender: sender,
                    bytecode: adderByteCode.valueOf(),
                    gasLimit: gasLimit,
                    args: args,
                }),
            Err,
            "Can't convert args to TypedValues",
        );
    });

    it("should create 'TransactionNext' for deploy", async function () {
        const sender = Address.fromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        const gasLimit = 6000000;
        const args = [new U32Value(0)];

        const transaction = smartContractFactory.createTransactionForDeploy({
            sender: sender,
            bytecode: adderByteCode.valueOf(),
            gasLimit: gasLimit,
            args: args,
        });
        const abiDeployNext = abiAwareFactory.createTransactionForDeploy({
            sender: sender,
            bytecode: adderByteCode.valueOf(),
            gasLimit: gasLimit,
            args: args,
        });

        assert.equal(transaction.sender, "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        assert.equal(transaction.receiver, CONTRACT_DEPLOY_ADDRESS);
        expect(transaction.data.length).to.be.greaterThan(0);
        assert.equal(transaction.gasLimit.valueOf(), gasLimit);
        assert.equal(transaction.value, 0);

        assert.deepEqual(transaction, abiDeployNext);
    });

    it("should create 'TransactionNext' for execute without transfer", async function () {
        const sender = Address.fromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        const contract = Address.fromBech32("erd1qqqqqqqqqqqqqpgqhy6nl6zq07rnzry8uyh6rtyq0uzgtk3e69fqgtz9l4");
        const func = "add";
        const gasLimit = 6000000;
        const args = [new U32Value(7)];

        const transaction = smartContractFactory.createTransactionForExecute({
            sender: sender,
            contract: contract,
            functionName: func,
            gasLimit: gasLimit,
            args: args,
        });
        const abiExecuteNext = abiAwareFactory.createTransactionForExecute({
            sender: sender,
            contract: contract,
            functionName: func,
            gasLimit: gasLimit,
            args: args,
        });

        assert.equal(transaction.sender, "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        assert.equal(transaction.receiver, "erd1qqqqqqqqqqqqqpgqhy6nl6zq07rnzry8uyh6rtyq0uzgtk3e69fqgtz9l4");
        assert.deepEqual(transaction.data, Buffer.from("add@07"));
        assert.equal(transaction.gasLimit.valueOf(), gasLimit);
        assert.equal(transaction.value, 0);

        assert.deepEqual(transaction, abiExecuteNext);
    });

    it("should create 'TransactionNext' for execute and transfer native token", async function () {
        const sender = Address.fromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        const contract = Address.fromBech32("erd1qqqqqqqqqqqqqpgqhy6nl6zq07rnzry8uyh6rtyq0uzgtk3e69fqgtz9l4");
        const func = "add";
        const gasLimit = 6000000;
        const egldAmount = new BigNumber("1000000000000000000");

        const transaction = smartContractFactory.createTransactionForExecute({
            sender: sender,
            contract: contract,
            functionName: func,
            gasLimit: gasLimit,
            args: [new U32Value(7)],
            nativeTransferAmount: egldAmount,
        });
        const abiExecuteNext = abiAwareFactory.createTransactionForExecute({
            sender: sender,
            contract: contract,
            functionName: func,
            gasLimit: gasLimit,
            args: [7],
            nativeTransferAmount: egldAmount,
        });

        assert.equal(transaction.sender, "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        assert.equal(transaction.receiver, "erd1qqqqqqqqqqqqqpgqhy6nl6zq07rnzry8uyh6rtyq0uzgtk3e69fqgtz9l4");
        assert.deepEqual(transaction.data, Buffer.from("add@07"));
        assert.equal(transaction.gasLimit.valueOf(), gasLimit);
        assert.equal(transaction.value.valueOf(), "1000000000000000000");

        assert.deepEqual(transaction, abiExecuteNext);
    });

    it("should create 'TransactionNext' for execute and transfer single esdt", async function () {
        const sender = Address.fromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        const contract = Address.fromBech32("erd1qqqqqqqqqqqqqpgqhy6nl6zq07rnzry8uyh6rtyq0uzgtk3e69fqgtz9l4");
        const func = "add";
        const gasLimit = 6000000;
        const args = [new U32Value(7)];
        const token = new Token("FOO-6ce17b", 0);
        const transfer = new NextTokenTransfer(token, 10);

        const transaction = smartContractFactory.createTransactionForExecute({
            sender: sender,
            contract: contract,
            functionName: func,
            gasLimit: gasLimit,
            args: args,
            tokenTransfers: [transfer],
        });
        const abiExecuteNext = abiAwareFactory.createTransactionForExecute({
            sender: sender,
            contract: contract,
            functionName: func,
            gasLimit: gasLimit,
            args: args,
            tokenTransfers: [transfer],
        });

        assert.equal(transaction.sender, "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        assert.equal(transaction.receiver, "erd1qqqqqqqqqqqqqpgqhy6nl6zq07rnzry8uyh6rtyq0uzgtk3e69fqgtz9l4");
        assert.deepEqual(transaction.data, Buffer.from("ESDTTransfer@464f4f2d366365313762@0a@616464@07"));
        assert.equal(transaction.gasLimit.valueOf(), gasLimit);
        assert.equal(transaction.value.valueOf(), "0");

        assert.deepEqual(transaction, abiExecuteNext);
    });

    it("should create 'TransactionNext' for execute and transfer multiple esdts", async function () {
        const sender = Address.fromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        const contract = Address.fromBech32("erd1qqqqqqqqqqqqqpgqak8zt22wl2ph4tswtyc39namqx6ysa2sd8ss4xmlj3");
        const func = "add";
        const gasLimit = 6000000;
        const args = [new U32Value(7)];

        const fooToken = new Token("FOO-6ce17b", 0);
        const fooTransfer = new NextTokenTransfer(fooToken, 10);
        const barToken = new Token("BAR-5bc08f", 0);
        const barTransfer = new NextTokenTransfer(barToken, 3140);

        const transaction = smartContractFactory.createTransactionForExecute({
            sender: sender,
            contract: contract,
            functionName: func,
            gasLimit: gasLimit,
            args: args,
            tokenTransfers: [fooTransfer, barTransfer],
        });
        const abiExecuteNext = abiAwareFactory.createTransactionForExecute({
            sender: sender,
            contract: contract,
            functionName: func,
            gasLimit: gasLimit,
            args: args,
            tokenTransfers: [fooTransfer, barTransfer],
        });

        assert.equal(transaction.sender, "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        assert.equal(transaction.receiver, "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");

        assert.deepEqual(
            transaction.data,
            Buffer.from(
                "MultiESDTNFTTransfer@00000000000000000500ed8e25a94efa837aae0e593112cfbb01b448755069e1@02@464f4f2d366365313762@00@0a@4241522d356263303866@00@0c44@616464@07",
            ),
        );

        assert.equal(transaction.gasLimit.valueOf(), gasLimit);
        assert.equal(transaction.value.valueOf(), "0");

        assert.deepEqual(transaction, abiExecuteNext);
    });

    it("should create 'TransactionNext' for execute and transfer single nft", async function () {
        const sender = Address.fromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        const contract = Address.fromBech32("erd1qqqqqqqqqqqqqpgqhy6nl6zq07rnzry8uyh6rtyq0uzgtk3e69fqgtz9l4");
        const func = "add";
        const gasLimit = 6000000;
        const args = [new U32Value(7)];

        const token = new Token("NFT-123456", 1);
        const transfer = new NextTokenTransfer(token, 1);

        const transaction = smartContractFactory.createTransactionForExecute({
            sender: sender,
            contract: contract,
            functionName: func,
            gasLimit: gasLimit,
            args: args,
            tokenTransfers: [transfer],
        });
        const abiExecuteNext = abiAwareFactory.createTransactionForExecute({
            sender: sender,
            contract: contract,
            functionName: func,
            gasLimit: gasLimit,
            args: args,
            tokenTransfers: [transfer],
        });

        assert.equal(transaction.sender, "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        assert.equal(transaction.receiver, "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");

        assert.isDefined(transaction.data);
        assert.deepEqual(
            transaction.data,
            Buffer.from(
                "ESDTNFTTransfer@4e46542d313233343536@01@01@00000000000000000500b9353fe8407f87310c87e12fa1ac807f0485da39d152@616464@07",
            ),
        );

        assert.equal(transaction.gasLimit.valueOf(), gasLimit);
        assert.equal(transaction.value.valueOf(), "0");

        assert.deepEqual(transaction, abiExecuteNext);
    });

    it("should create 'TransactionNext' for execute and transfer multiple nfts", async function () {
        const sender = Address.fromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        const contract = Address.fromBech32("erd1qqqqqqqqqqqqqpgqhy6nl6zq07rnzry8uyh6rtyq0uzgtk3e69fqgtz9l4");
        const func = "add";
        const gasLimit = 6000000;
        const args = [new U32Value(7)];

        const firstToken = new Token("NFT-123456", 1);
        const firstTransfer = new NextTokenTransfer(firstToken, 1);
        const secondToken = new Token("NFT-123456", 42);
        const secondTransfer = new NextTokenTransfer(secondToken, 1);

        const transaction = smartContractFactory.createTransactionForExecute({
            sender: sender,
            contract: contract,
            functionName: func,
            gasLimit: gasLimit,
            args: args,
            tokenTransfers: [firstTransfer, secondTransfer],
        });
        const abiExecuteNext = abiAwareFactory.createTransactionForExecute({
            sender: sender,
            contract: contract,
            functionName: func,
            gasLimit: gasLimit,
            args: args,
            tokenTransfers: [firstTransfer, secondTransfer],
        });

        assert.equal(transaction.sender, "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        assert.equal(transaction.receiver, "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");

        assert.isDefined(transaction.data);
        assert.deepEqual(
            transaction.data,
            Buffer.from(
                "MultiESDTNFTTransfer@00000000000000000500b9353fe8407f87310c87e12fa1ac807f0485da39d152@02@4e46542d313233343536@01@01@4e46542d313233343536@2a@01@616464@07",
            ),
        );

        assert.equal(transaction.gasLimit.valueOf(), gasLimit);
        assert.equal(transaction.value.valueOf(), "0");

        assert.deepEqual(transaction, abiExecuteNext);
    });

    it("should create 'TransactionNext' for upgrade", async function () {
        const sender = Address.fromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        const contract = Address.fromBech32("erd1qqqqqqqqqqqqqpgqhy6nl6zq07rnzry8uyh6rtyq0uzgtk3e69fqgtz9l4");
        const gasLimit = 6000000;
        const args = [new U32Value(0)];

        const transaction = smartContractFactory.createTransactionForUpgrade({
            sender: sender,
            contract: contract,
            bytecode: adderByteCode.valueOf(),
            gasLimit: gasLimit,
            args: args,
        });

        const abiUpgradeNext = abiAwareFactory.createTransactionForUpgrade({
            sender: sender,
            contract: contract,
            bytecode: adderByteCode.valueOf(),
            gasLimit: gasLimit,
            args: args,
        });

        assert.equal(transaction.sender, "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        assert.equal(transaction.receiver, "erd1qqqqqqqqqqqqqpgqhy6nl6zq07rnzry8uyh6rtyq0uzgtk3e69fqgtz9l4");
        assert.isTrue(Buffer.from(transaction.data!).toString().startsWith("upgradeContract@"));
        assert.equal(transaction.gasLimit.valueOf(), gasLimit);
        assert.equal(transaction.value, 0);

        assert.deepEqual(transaction, abiUpgradeNext);
    });
});
