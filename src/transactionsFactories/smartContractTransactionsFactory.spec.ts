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
import { Token, TokenTransfer } from "../tokens";

describe("test smart contract transactions factory", function () {
    const config = new TransactionsFactoryConfig("D");
    let factory: SmartContractTransactionsFactory;
    let abiAwareFactory: SmartContractTransactionsFactory;
    let adderByteCode: Code;
    let abiRegistry: AbiRegistry;

    before(async function () {
        factory = new SmartContractTransactionsFactory({
            config: config
        });

        adderByteCode = await loadContractCode("src/testdata/adder.wasm");
        abiRegistry = await loadAbiRegistry("src/testdata/adder.abi.json");

        abiAwareFactory = new SmartContractTransactionsFactory({
            config: config,
            abi: abiRegistry
        },
        );
    });

    it("should throw error when args are not of type 'TypedValue'", async function () {
        const sender = Address.fromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        const gasLimit = 6000000;
        const args = [0];

        assert.throws(() => factory.createTransactionForDeploy({
            sender: sender,
            bytecode: adderByteCode.valueOf(),
            gasLimit: gasLimit,
            args: args
        }), Err, "Can't convert args to TypedValues");
    });

    it("should create draft transaction for deploy", async function () {
        const sender = Address.fromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        const gasLimit = 6000000;
        const args = [new U32Value(0)];

        const deployDraft = factory.createTransactionForDeploy({
            sender: sender,
            bytecode: adderByteCode.valueOf(),
            gasLimit: gasLimit,
            args: args
        });
        const abiDeployDraft = abiAwareFactory.createTransactionForDeploy({
            sender: sender,
            bytecode: adderByteCode.valueOf(),
            gasLimit: gasLimit,
            args: args
        });

        assert.equal(deployDraft.sender, "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        assert.equal(deployDraft.receiver, CONTRACT_DEPLOY_ADDRESS);
        assert.isDefined(deployDraft.data);
        expect(deployDraft.data!.length).to.be.greaterThan(0);

        assert.equal(deployDraft.gasLimit.valueOf(), gasLimit);
        assert.equal(deployDraft.value, 0);

        assert.deepEqual(deployDraft, abiDeployDraft);
    });

    it("should create draft transaction for execute without transfer", async function () {
        const sender = Address.fromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        const contract = Address.fromBech32("erd1qqqqqqqqqqqqqpgqhy6nl6zq07rnzry8uyh6rtyq0uzgtk3e69fqgtz9l4");
        const func = "add";
        const gasLimit = 6000000;
        const args = [new U32Value(7)];

        const executeDraft = factory.createTransactionForExecute({
            sender: sender,
            contract: contract,
            functionName: func,
            gasLimit: gasLimit,
            args: args
        });
        const abiExecuteDraft = abiAwareFactory.createTransactionForExecute({
            sender: sender,
            contract: contract,
            functionName: func,
            gasLimit: gasLimit,
            args: args
        });

        assert.equal(executeDraft.sender, "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        assert.equal(executeDraft.receiver, "erd1qqqqqqqqqqqqqpgqhy6nl6zq07rnzry8uyh6rtyq0uzgtk3e69fqgtz9l4");

        assert.isDefined(executeDraft.data);
        assert.deepEqual(executeDraft.data, Buffer.from("add@07"));

        assert.equal(executeDraft.gasLimit.valueOf(), gasLimit);
        assert.equal(executeDraft.value, 0);

        assert.deepEqual(executeDraft, abiExecuteDraft);
    });

    it("should create draft transaction for execute and transfer native token", async function () {
        const sender = Address.fromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        const contract = Address.fromBech32("erd1qqqqqqqqqqqqqpgqhy6nl6zq07rnzry8uyh6rtyq0uzgtk3e69fqgtz9l4");
        const func = "add";
        const gasLimit = 6000000;
        const args = [new U32Value(7)];
        const egldAmount = new BigNumber("1000000000000000000");

        const executeDraft = factory.createTransactionForExecute({
            sender: sender,
            contract: contract,
            functionName: func,
            gasLimit: gasLimit,
            args: args,
            nativeTransferAmount: egldAmount
        });
        const abiExecuteDraft = abiAwareFactory.createTransactionForExecute({
            sender: sender,
            contract: contract,
            functionName: func,
            gasLimit: gasLimit,
            args: args,
            nativeTransferAmount: egldAmount
        });

        assert.equal(executeDraft.sender, "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        assert.equal(executeDraft.receiver, "erd1qqqqqqqqqqqqqpgqhy6nl6zq07rnzry8uyh6rtyq0uzgtk3e69fqgtz9l4");

        assert.isDefined(executeDraft.data);
        assert.deepEqual(executeDraft.data, Buffer.from("add@07"));

        assert.equal(executeDraft.gasLimit.valueOf(), gasLimit);
        assert.equal(executeDraft.value.valueOf(), "1000000000000000000");

        assert.deepEqual(executeDraft, abiExecuteDraft);
    });

    it("should create draft transaction for execute and transfer single esdt", async function () {
        const sender = Address.fromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        const contract = Address.fromBech32("erd1qqqqqqqqqqqqqpgqhy6nl6zq07rnzry8uyh6rtyq0uzgtk3e69fqgtz9l4");
        const func = "add";
        const gasLimit = 6000000;
        const args = [new U32Value(7)];
        const token = new Token("FOO-6ce17b", 0);
        const transfer = new TokenTransfer(token, 10);

        const executeDraft = factory.createTransactionForExecute({
            sender: sender,
            contract: contract,
            functionName: func,
            gasLimit: gasLimit,
            args: args,
            tokenTransfers: [transfer]
        });
        const abiExecuteDraft = abiAwareFactory.createTransactionForExecute({
            sender: sender,
            contract: contract,
            functionName: func,
            gasLimit: gasLimit,
            args: args,
            tokenTransfers: [transfer]
        });

        assert.equal(executeDraft.sender, "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        assert.equal(executeDraft.receiver, "erd1qqqqqqqqqqqqqpgqhy6nl6zq07rnzry8uyh6rtyq0uzgtk3e69fqgtz9l4");

        assert.isDefined(executeDraft.data);
        assert.deepEqual(executeDraft.data, Buffer.from("ESDTTransfer@464f4f2d366365313762@0a@616464@07"));

        assert.equal(executeDraft.gasLimit.valueOf(), gasLimit);
        assert.equal(executeDraft.value.valueOf(), "0");

        assert.deepEqual(executeDraft, abiExecuteDraft);
    });

    it("should create draft transaction for execute and transfer multiple esdts", async function () {
        const sender = Address.fromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        const contract = Address.fromBech32("erd1qqqqqqqqqqqqqpgqak8zt22wl2ph4tswtyc39namqx6ysa2sd8ss4xmlj3");
        const func = "add";
        const gasLimit = 6000000;
        const args = [new U32Value(7)];

        const fooToken = new Token("FOO-6ce17b", 0);
        const fooTransfer = new TokenTransfer(fooToken, 10);
        const barToken = new Token("BAR-5bc08f", 0);
        const barTransfer = new TokenTransfer(barToken, 3140);

        const executeDraft = factory.createTransactionForExecute({
            sender: sender,
            contract: contract,
            functionName: func,
            gasLimit: gasLimit,
            args: args,
            tokenTransfers: [fooTransfer, barTransfer]
        });
        const abiExecuteDraft = abiAwareFactory.createTransactionForExecute({
            sender: sender,
            contract: contract,
            functionName: func,
            gasLimit: gasLimit,
            args: args,
            tokenTransfers: [fooTransfer, barTransfer]
        });

        assert.equal(executeDraft.sender, "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        assert.equal(executeDraft.receiver, "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");

        assert.isDefined(executeDraft.data);
        assert.deepEqual(executeDraft.data, Buffer.from("MultiESDTNFTTransfer@00000000000000000500ed8e25a94efa837aae0e593112cfbb01b448755069e1@02@464f4f2d366365313762@00@0a@4241522d356263303866@00@0c44@616464@07"));

        assert.equal(executeDraft.gasLimit.valueOf(), gasLimit);
        assert.equal(executeDraft.value.valueOf(), "0");

        assert.deepEqual(executeDraft, abiExecuteDraft);
    });

    it("should create draft transaction for execute and transfer single nft", async function () {
        const sender = Address.fromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        const contract = Address.fromBech32("erd1qqqqqqqqqqqqqpgqhy6nl6zq07rnzry8uyh6rtyq0uzgtk3e69fqgtz9l4");
        const func = "add";
        const gasLimit = 6000000;
        const args = [new U32Value(7)];

        const token = new Token("NFT-123456", 1);
        const transfer = new TokenTransfer(token, 1);

        const executeDraft = factory.createTransactionForExecute({
            sender: sender,
            contract: contract,
            functionName: func,
            gasLimit: gasLimit,
            args: args,
            tokenTransfers: [transfer]
        });
        const abiExecuteDraft = abiAwareFactory.createTransactionForExecute({
            sender: sender,
            contract: contract,
            functionName: func,
            gasLimit: gasLimit,
            args: args,
            tokenTransfers: [transfer]
        });

        assert.equal(executeDraft.sender, "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        assert.equal(executeDraft.receiver, "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");

        assert.isDefined(executeDraft.data);
        assert.deepEqual(executeDraft.data, Buffer.from("ESDTNFTTransfer@4e46542d313233343536@01@01@00000000000000000500b9353fe8407f87310c87e12fa1ac807f0485da39d152@616464@07"));

        assert.equal(executeDraft.gasLimit.valueOf(), gasLimit);
        assert.equal(executeDraft.value.valueOf(), "0");

        assert.deepEqual(executeDraft, abiExecuteDraft);
    });

    it("should create draft transaction for execute and transfer multiple nfts", async function () {
        const sender = Address.fromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        const contract = Address.fromBech32("erd1qqqqqqqqqqqqqpgqhy6nl6zq07rnzry8uyh6rtyq0uzgtk3e69fqgtz9l4");
        const func = "add";
        const gasLimit = 6000000;
        const args = [new U32Value(7)];

        const firstToken = new Token("NFT-123456", 1);
        const firstTransfer = new TokenTransfer(firstToken, 1);
        const secondToken = new Token("NFT-123456", 42);
        const secondTransfer = new TokenTransfer(secondToken, 1);

        const executeDraft = factory.createTransactionForExecute({
            sender: sender,
            contract: contract,
            functionName: func,
            gasLimit: gasLimit,
            args: args,
            tokenTransfers: [firstTransfer, secondTransfer]
        });
        const abiExecuteDraft = abiAwareFactory.createTransactionForExecute({
            sender: sender,
            contract: contract,
            functionName: func,
            gasLimit: gasLimit,
            args: args,
            tokenTransfers: [firstTransfer, secondTransfer]
        });

        assert.equal(executeDraft.sender, "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        assert.equal(executeDraft.receiver, "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");

        assert.isDefined(executeDraft.data);
        assert.deepEqual(executeDraft.data, Buffer.from("MultiESDTNFTTransfer@00000000000000000500b9353fe8407f87310c87e12fa1ac807f0485da39d152@02@4e46542d313233343536@01@01@4e46542d313233343536@2a@01@616464@07"));

        assert.equal(executeDraft.gasLimit.valueOf(), gasLimit);
        assert.equal(executeDraft.value.valueOf(), "0");

        assert.deepEqual(executeDraft, abiExecuteDraft);
    });

    it("should create draft transaction for upgrade", async function () {
        const sender = Address.fromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        const contract = Address.fromBech32("erd1qqqqqqqqqqqqqpgqhy6nl6zq07rnzry8uyh6rtyq0uzgtk3e69fqgtz9l4");
        const gasLimit = 6000000;
        const args = [new U32Value(0)];

        const upgradeDraft = factory.createTransactionForUpgrade({
            sender: sender,
            contract: contract,
            bytecode: adderByteCode.valueOf(),
            gasLimit: gasLimit,
            args: args
        });

        const abiUpgradeDraft = abiAwareFactory.createTransactionForUpgrade({
            sender: sender,
            contract: contract,
            bytecode: adderByteCode.valueOf(),
            gasLimit: gasLimit,
            args: args
        });

        assert.equal(upgradeDraft.sender, "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        assert.equal(upgradeDraft.receiver, "erd1qqqqqqqqqqqqqpgqhy6nl6zq07rnzry8uyh6rtyq0uzgtk3e69fqgtz9l4");
        assert.isDefined(upgradeDraft.data);
        assert.isTrue(Buffer.from(upgradeDraft.data!).toString().startsWith("upgradeContract@"));

        assert.equal(upgradeDraft.gasLimit.valueOf(), gasLimit);
        assert.equal(upgradeDraft.value, 0);

        assert.deepEqual(upgradeDraft, abiUpgradeDraft);
    });
});
