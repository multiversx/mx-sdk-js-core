import { assert, expect } from "chai";
import { Address } from "../address";
import { CONTRACT_DEPLOY_ADDRESS } from "../constants";
import { Err } from "../errors";
import { U32Value } from "../smartcontracts";
import { Code } from "../smartcontracts/code";
import { AbiRegistry } from "../smartcontracts/typesystem/abiRegistry";
import { loadAbiRegistry, loadContractCode } from "../testutils/utils";
import { NextTokenTransfer, Token, TokenComputer } from "../tokens";
import { SmartContractTransactionsFactory } from "./smartContractTransactionsFactory";
import { TransactionsFactoryConfig } from "./transactionsFactoryConfig";

describe("test smart contract transactions factory", function () {
    const config = new TransactionsFactoryConfig({ chainID: "D" });
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
        const gasLimit = 6000000n;
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

    it("should create 'Transaction' for deploy", async function () {
        const sender = Address.fromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        const gasLimit = 6000000n;
        const args = [new U32Value(0)];

        const transaction = smartContractFactory.createTransactionForDeploy({
            sender: sender,
            bytecode: adderByteCode.valueOf(),
            gasLimit: gasLimit,
            args: args,
        });

        const transactionAbiAware = abiAwareFactory.createTransactionForDeploy({
            sender: sender,
            bytecode: adderByteCode.valueOf(),
            gasLimit: gasLimit,
            args: args,
        });

        assert.equal(transaction.sender, "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        assert.equal(transaction.receiver, CONTRACT_DEPLOY_ADDRESS);
        expect(transaction.data.length).to.be.greaterThan(0);
        assert.equal(transaction.gasLimit.valueOf(), gasLimit);
        assert.equal(transaction.value, 0n);

        assert.deepEqual(transaction, transactionAbiAware);
    });

    it("should create 'Transaction' for execute without transfer", async function () {
        const sender = Address.fromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        const contract = Address.fromBech32("erd1qqqqqqqqqqqqqpgqhy6nl6zq07rnzry8uyh6rtyq0uzgtk3e69fqgtz9l4");
        const func = "add";
        const gasLimit = 6000000n;
        const args = [new U32Value(7)];

        const transaction = smartContractFactory.createTransactionForExecute({
            sender: sender,
            contract: contract,
            functionName: func,
            gasLimit: gasLimit,
            args: args,
        });

        const transactionAbiAware = abiAwareFactory.createTransactionForExecute({
            sender: sender,
            contract: contract,
            functionName: func,
            gasLimit: gasLimit,
            args: args,
        });

        assert.equal(transaction.sender, "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        assert.equal(transaction.receiver, "erd1qqqqqqqqqqqqqpgqhy6nl6zq07rnzry8uyh6rtyq0uzgtk3e69fqgtz9l4");
        assert.deepEqual(transaction.data, Buffer.from("add@07"));
        assert.equal(transaction.gasLimit, gasLimit);
        assert.equal(transaction.value, 0n);

        assert.deepEqual(transaction, transactionAbiAware);
    });

    it("should create 'Transaction' for execute and transfer native token", async function () {
        const sender = Address.fromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        const contract = Address.fromBech32("erd1qqqqqqqqqqqqqpgqhy6nl6zq07rnzry8uyh6rtyq0uzgtk3e69fqgtz9l4");
        const func = "add";
        const gasLimit = 6000000n;
        const egldAmount = 1000000000000000000n;

        const transaction = smartContractFactory.createTransactionForExecute({
            sender: sender,
            contract: contract,
            functionName: func,
            gasLimit: gasLimit,
            args: [new U32Value(7)],
            nativeTransferAmount: egldAmount,
        });

        const transactionAbiAware = abiAwareFactory.createTransactionForExecute({
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
        assert.equal(transaction.gasLimit, gasLimit);
        assert.equal(transaction.value, 1000000000000000000n);

        assert.deepEqual(transaction, transactionAbiAware);
    });

    it("should create 'Transaction' for execute and transfer single esdt", async function () {
        const sender = Address.fromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        const contract = Address.fromBech32("erd1qqqqqqqqqqqqqpgqhy6nl6zq07rnzry8uyh6rtyq0uzgtk3e69fqgtz9l4");
        const func = "add";
        const gasLimit = 6000000n;
        const args = [new U32Value(7)];
        const token = new Token({ identifier: "FOO-6ce17b", nonce: 0n });
        const transfer = new NextTokenTransfer({ token, amount: 10n });

        const transaction = smartContractFactory.createTransactionForExecute({
            sender: sender,
            contract: contract,
            functionName: func,
            gasLimit: gasLimit,
            args: args,
            tokenTransfers: [transfer],
        });

        const transactionAbiAware = abiAwareFactory.createTransactionForExecute({
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
        assert.equal(transaction.gasLimit, gasLimit);
        assert.equal(transaction.value, 0n);

        assert.deepEqual(transaction, transactionAbiAware);
    });

    it("should create 'Transaction' for execute and transfer multiple esdts", async function () {
        const sender = Address.fromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        const contract = Address.fromBech32("erd1qqqqqqqqqqqqqpgqak8zt22wl2ph4tswtyc39namqx6ysa2sd8ss4xmlj3");
        const func = "add";
        const gasLimit = 6000000n;
        const args = [new U32Value(7)];

        const fooToken = new Token({ identifier: "FOO-6ce17b", nonce: 0n });
        const fooTransfer = new NextTokenTransfer({ token: fooToken, amount: 10n });
        const barToken = new Token({ identifier: "BAR-5bc08f", nonce: 0n });
        const barTransfer = new NextTokenTransfer({ token: barToken, amount: 3140n });

        const transaction = smartContractFactory.createTransactionForExecute({
            sender: sender,
            contract: contract,
            functionName: func,
            gasLimit: gasLimit,
            args: args,
            tokenTransfers: [fooTransfer, barTransfer],
        });

        const transactionAbiAware = abiAwareFactory.createTransactionForExecute({
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

        assert.equal(transaction.gasLimit, gasLimit);
        assert.equal(transaction.value, 0n);

        assert.deepEqual(transaction, transactionAbiAware);
    });

    it("should create 'Transaction' for execute and transfer single nft", async function () {
        const sender = Address.fromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        const contract = Address.fromBech32("erd1qqqqqqqqqqqqqpgqhy6nl6zq07rnzry8uyh6rtyq0uzgtk3e69fqgtz9l4");
        const func = "add";
        const gasLimit = 6000000n;
        const args = [new U32Value(7)];

        const token = new Token({ identifier: "NFT-123456", nonce: 1n });
        const transfer = new NextTokenTransfer({ token, amount: 1n });

        const transaction = smartContractFactory.createTransactionForExecute({
            sender: sender,
            contract: contract,
            functionName: func,
            gasLimit: gasLimit,
            args: args,
            tokenTransfers: [transfer],
        });

        const transactionAbiAware = abiAwareFactory.createTransactionForExecute({
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

        assert.equal(transaction.gasLimit, gasLimit);
        assert.equal(transaction.value, 0n);

        assert.deepEqual(transaction, transactionAbiAware);
    });

    it("should create 'Transaction' for execute and transfer multiple nfts", async function () {
        const sender = Address.fromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        const contract = Address.fromBech32("erd1qqqqqqqqqqqqqpgqhy6nl6zq07rnzry8uyh6rtyq0uzgtk3e69fqgtz9l4");
        const func = "add";
        const gasLimit = 6000000n;
        const args = [new U32Value(7)];

        const firstToken = new Token({ identifier: "NFT-123456", nonce: 1n });
        const firstTransfer = new NextTokenTransfer({ token: firstToken, amount: 1n });
        const secondToken = new Token({ identifier: "NFT-123456", nonce: 42n });
        const secondTransfer = new NextTokenTransfer({ token: secondToken, amount: 1n });

        const transaction = smartContractFactory.createTransactionForExecute({
            sender: sender,
            contract: contract,
            functionName: func,
            gasLimit: gasLimit,
            args: args,
            tokenTransfers: [firstTransfer, secondTransfer],
        });

        const transactionAbiAware = abiAwareFactory.createTransactionForExecute({
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

        assert.equal(transaction.gasLimit, gasLimit);
        assert.equal(transaction.value, 0n);

        assert.deepEqual(transaction, transactionAbiAware);
    });

    it("should create 'Transaction' for upgrade", async function () {
        const sender = Address.fromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        const contract = Address.fromBech32("erd1qqqqqqqqqqqqqpgqhy6nl6zq07rnzry8uyh6rtyq0uzgtk3e69fqgtz9l4");
        const gasLimit = 6000000n;
        const args = [new U32Value(0)];

        const transaction = smartContractFactory.createTransactionForUpgrade({
            sender: sender,
            contract: contract,
            bytecode: adderByteCode.valueOf(),
            gasLimit: gasLimit,
            args: args,
        });

        const transactionAbiAware = abiAwareFactory.createTransactionForUpgrade({
            sender: sender,
            contract: contract,
            bytecode: adderByteCode.valueOf(),
            gasLimit: gasLimit,
            args: args,
        });

        assert.equal(transaction.sender, "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        assert.equal(transaction.receiver, "erd1qqqqqqqqqqqqqpgqhy6nl6zq07rnzry8uyh6rtyq0uzgtk3e69fqgtz9l4");
        assert.isTrue(Buffer.from(transaction.data!).toString().startsWith("upgradeContract@"));
        assert.equal(transaction.gasLimit, gasLimit);
        assert.equal(transaction.value, 0n);

        assert.deepEqual(transaction, transactionAbiAware);
    });
});
