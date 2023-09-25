import { assert, expect } from "chai";
import { SmartContractTransactionIntentsFactory } from "./smartContractTransactionIntentsFactory";
import { Address } from "../address";
import { Code } from "../smartcontracts/code";
import { AbiRegistry } from "../smartcontracts/typesystem/abiRegistry";
import { U32Value } from "../smartcontracts";
import { CONTRACT_DEPLOY_ADDRESS } from "../constants";
import { loadContractCode, loadAbiRegistry } from "../testutils/utils";
import { Err } from "../errors";
import { TransactionIntentsFactoryConfig } from "./transactionIntentsFactoryConfig";

describe("test smart contract intents factory", function () {
    const config = new TransactionIntentsFactoryConfig("D");
    let factory: SmartContractTransactionIntentsFactory;
    let abiAwareFactory: SmartContractTransactionIntentsFactory;
    let adderByteCode: Code;
    let abiRegistry: AbiRegistry;

    before(async function () {
        factory = new SmartContractTransactionIntentsFactory({
            config: config
        });

        adderByteCode = await loadContractCode("src/testdata/adder.wasm");
        abiRegistry = await loadAbiRegistry("src/testdata/adder.abi.json");

        abiAwareFactory = new SmartContractTransactionIntentsFactory({
            config: config,
            abi: abiRegistry
        },
        );
    });

    it("should throw error when args are not of type 'TypedValue'", async function () {
        const sender = Address.fromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        const gasLimit = 6000000;
        const args = [0];

        assert.throws(() => factory.createTransactionIntentForDeploy({
            sender: sender,
            bytecode: adderByteCode.valueOf(),
            gasLimit: gasLimit,
            args: args
        }), Err, "Can't convert args to TypedValues");
    });

    it("should create intent for deploy", async function () {
        const sender = Address.fromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        const gasLimit = 6000000;
        const args = [new U32Value(0)];

        const deployIntent = factory.createTransactionIntentForDeploy({
            sender: sender,
            bytecode: adderByteCode.valueOf(),
            gasLimit: gasLimit,
            args: args
        });
        const abiDeployIntent = abiAwareFactory.createTransactionIntentForDeploy({
            sender: sender,
            bytecode: adderByteCode.valueOf(),
            gasLimit: gasLimit,
            args: args
        });

        assert.equal(deployIntent.sender, "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        assert.equal(deployIntent.receiver, CONTRACT_DEPLOY_ADDRESS);
        assert.isDefined(deployIntent.data);
        expect(deployIntent.data!.length).to.be.greaterThan(0);

        assert.equal(deployIntent.gasLimit.valueOf(), gasLimit);
        assert.equal(deployIntent.value, 0);

        assert.deepEqual(deployIntent, abiDeployIntent);
    });

    it("should create intent for execute", async function () {
        const sender = Address.fromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        const contract = Address.fromBech32("erd1qqqqqqqqqqqqqpgqhy6nl6zq07rnzry8uyh6rtyq0uzgtk3e69fqgtz9l4");
        const func = "add";
        const gasLimit = 6000000;
        const args = [new U32Value(7)];

        const deployIntent = factory.createTransactionIntentForExecute({
            sender: sender,
            contractAddress: contract,
            functionName: func,
            gasLimit: gasLimit,
            args: args
        });
        const abiDeployIntent = abiAwareFactory.createTransactionIntentForExecute({
            sender: sender,
            contractAddress: contract,
            functionName: func,
            gasLimit: gasLimit,
            args: args
        });

        assert.equal(deployIntent.sender, "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        assert.equal(deployIntent.receiver, "erd1qqqqqqqqqqqqqpgqhy6nl6zq07rnzry8uyh6rtyq0uzgtk3e69fqgtz9l4");

        assert.isDefined(deployIntent.data);
        assert.deepEqual(deployIntent.data, Buffer.from("add@07"));

        assert.equal(deployIntent.gasLimit.valueOf(), gasLimit);
        assert.equal(deployIntent.value, 0);

        assert.deepEqual(deployIntent, abiDeployIntent);
    });

    it("should create intent for upgrade", async function () {
        const sender = Address.fromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        const contract = Address.fromBech32("erd1qqqqqqqqqqqqqpgqhy6nl6zq07rnzry8uyh6rtyq0uzgtk3e69fqgtz9l4");
        const gasLimit = 6000000;
        const args = [new U32Value(0)];

        const deployIntent = factory.createTransactionIntentForUpgrade({
            sender: sender,
            contract: contract,
            bytecode: adderByteCode.valueOf(),
            gasLimit: gasLimit,
            args: args
        });

        const abiDeployIntent = abiAwareFactory.createTransactionIntentForUpgrade({
            sender: sender,
            contract: contract,
            bytecode: adderByteCode.valueOf(),
            gasLimit: gasLimit,
            args: args
        });

        assert.equal(deployIntent.sender, "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        assert.equal(deployIntent.receiver, "erd1qqqqqqqqqqqqqpgqhy6nl6zq07rnzry8uyh6rtyq0uzgtk3e69fqgtz9l4");
        assert.isDefined(deployIntent.data);
        assert.isTrue(Buffer.from(deployIntent.data!).toString().startsWith("upgradeContract@"));

        assert.equal(deployIntent.gasLimit.valueOf(), gasLimit);
        assert.equal(deployIntent.value, 0);

        assert.deepEqual(deployIntent, abiDeployIntent);
    });
});
