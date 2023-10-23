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

    it("should create draft transaction for execute", async function () {
        const sender = Address.fromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        const contract = Address.fromBech32("erd1qqqqqqqqqqqqqpgqhy6nl6zq07rnzry8uyh6rtyq0uzgtk3e69fqgtz9l4");
        const func = "add";
        const gasLimit = 6000000;
        const args = [new U32Value(7)];

        const executeDraft = factory.createTransactionForExecute({
            sender: sender,
            contractAddress: contract,
            functionName: func,
            gasLimit: gasLimit,
            args: args
        });
        const abiExecuteDraft = abiAwareFactory.createTransactionForExecute({
            sender: sender,
            contractAddress: contract,
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
