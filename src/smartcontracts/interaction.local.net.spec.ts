import { StrictChecker } from "./strictChecker";
import { DefaultInteractionRunner } from "./defaultRunner";
import { SmartContract } from "./smartContract";
import { BigUIntValue, OptionValue, TypedValue, U32Value } from "./typesystem";
import { loadAbiRegistry, loadContractCode, loadTestWallets, TestWallet } from "../testutils";
import { SmartContractAbi } from "./abi";
import { assert } from "chai";
import { Interaction } from "./interaction";
import { GasLimit } from "../networkParams";
import { ReturnCode } from "./returnCode";
import { Balance } from "../balance";
import BigNumber from "bignumber.js";
import { NetworkConfig } from "../networkConfig";
import { BytesValue } from "./typesystem/bytes";
import { chooseProxyProvider } from "../interactive";


describe("test smart contract interactor", function () {
    let provider = chooseProxyProvider("local-testnet");
    let alice: TestWallet;
    let runner: DefaultInteractionRunner;
    before(async function () {
        ({ alice } = await loadTestWallets());
        runner = new DefaultInteractionRunner(provider);
    });

    it("should interact with 'answer' (local testnet)", async function () {
        this.timeout(60000);

        let abiRegistry = await loadAbiRegistry(["src/testdata/answer.abi.json"]);
        let abi = new SmartContractAbi(abiRegistry, ["answer"]);
        let contract = new SmartContract({ abi: abi });

        // Currently, this has to be called before creating any Interaction objects, 
        // because the Transaction objects created under the hood point to the "default" NetworkConfig.
        await NetworkConfig.getDefault().sync(provider);
        await alice.sync(provider);
        await deploy(contract, "src/testdata/answer.wasm", new GasLimit(3000000), []);

        let interaction = <Interaction>contract.methods.getUltimateAnswer().withGasLimit(new GasLimit(3000000));

        // Query
        let queryResponseBundle = await runner.runQuery(interaction);
        assert.lengthOf(queryResponseBundle.values, 1);
        assert.deepEqual(queryResponseBundle.firstValue.valueOf(), new BigNumber(42));
        assert.isTrue(queryResponseBundle.returnCode.equals(ReturnCode.Ok));

        // Execute, do not wait for execution
        let transaction = interaction.useThenIncrementNonceOf(alice.account).buildTransaction();
        await alice.signer.sign(transaction);
        await transaction.send(provider);
        // Execute, and wait for execution
        transaction = interaction.useThenIncrementNonceOf(alice.account).buildTransaction();
        await alice.signer.sign(transaction);
        let executionResultsBundle = await runner.run(transaction, interaction);

        assert.lengthOf(executionResultsBundle.values, 1);
        assert.deepEqual(executionResultsBundle.firstValue.valueOf(), new BigNumber(42));
        assert.isTrue(executionResultsBundle.returnCode.equals(ReturnCode.Ok));
    });

    it("should interact with 'counter' (local testnet)", async function () {
        this.timeout(120000);

        let abiRegistry = await loadAbiRegistry(["src/testdata/counter.abi.json"]);
        let abi = new SmartContractAbi(abiRegistry, ["counter"]);
        let contract = new SmartContract({ abi: abi });

        // Currently, this has to be called before creating any Interaction objects, 
        // because the Transaction objects created under the hood point to the "default" NetworkConfig.
        await NetworkConfig.getDefault().sync(provider);
        await alice.sync(provider);
        await deploy(contract, "src/testdata/counter.wasm", new GasLimit(3000000), []);

        let getInteraction = <Interaction>contract.methods.get();
        let incrementInteraction = (<Interaction>contract.methods.increment()).withGasLimit(new GasLimit(3000000));
        let decrementInteraction = (<Interaction>contract.methods.decrement()).withGasLimit(new GasLimit(3000000));

        // Query "get()"
        let { firstValue: counterValue } = await runner.runQuery(getInteraction);
        assert.deepEqual(counterValue.valueOf(), new BigNumber(1));

        // Increment, wait for execution.
        let incrementTransaction = incrementInteraction.useThenIncrementNonceOf(alice.account).buildTransaction();
        await alice.signer.sign(incrementTransaction);
        let { firstValue: valueAfterIncrement } = await runner.run(incrementTransaction, incrementInteraction);
        assert.deepEqual(valueAfterIncrement.valueOf(), new BigNumber(2));

        // Decrement twice. Wait for execution of the second transaction.
        let decrementTransaction = decrementInteraction.useThenIncrementNonceOf(alice.account).buildTransaction();
        await alice.signer.sign(decrementTransaction);
        await decrementTransaction.send(provider);

        decrementTransaction = decrementInteraction.useThenIncrementNonceOf(alice.account).buildTransaction();
        await alice.signer.sign(decrementTransaction);
        let { firstValue: valueAfterDecrement } = await runner.run(decrementTransaction, decrementInteraction);
        assert.deepEqual(valueAfterDecrement.valueOf(), new BigNumber(0));
    });

    it("should interact with 'lottery_egld' (local testnet)", async function () {
        this.timeout(120000);

        let abiRegistry = await loadAbiRegistry(["src/testdata/lottery_egld.abi.json"]);
        let abi = new SmartContractAbi(abiRegistry, ["Lottery"]);
        let contract = new SmartContract({ abi: abi });

        // Currently, this has to be called before creating any Interaction objects, 
        // because the Transaction objects created under the hood point to the "default" NetworkConfig.
        await NetworkConfig.getDefault().sync(provider);
        await alice.sync(provider);
        await deploy(contract, "src/testdata/lottery_egld.wasm", new GasLimit(100000000), []);

        let startInteraction = <Interaction>contract.methods.start([
            BytesValue.fromUTF8("lucky"),
            new BigUIntValue(Balance.egld(1).valueOf()),
            OptionValue.newMissing(),
            OptionValue.newMissing(),
            OptionValue.newProvided(new U32Value(1)),
            OptionValue.newMissing(),
            OptionValue.newMissing(),
        ]).withGasLimit(new GasLimit(15000000));

        let lotteryStatusInteraction = <Interaction>contract.methods.status([
            BytesValue.fromUTF8("lucky")
        ]).withGasLimit(new GasLimit(15000000));

        let getLotteryInfoInteraction = <Interaction>contract.methods.lotteryInfo([
            BytesValue.fromUTF8("lucky")
        ]).withGasLimit(new GasLimit(15000000));

        // start()
        let startTransaction = startInteraction.useThenIncrementNonceOf(alice.account).buildTransaction();
        await alice.signer.sign(startTransaction);
        let { returnCode: startReturnCode, values: startReturnvalues } = await runner.run(startTransaction, startInteraction);
        assert.isTrue(startReturnCode.equals(ReturnCode.Ok));
        assert.lengthOf(startReturnvalues, 0);

        // status()
        let statusTransaction = lotteryStatusInteraction.useThenIncrementNonceOf(alice.account).buildTransaction();
        await alice.signer.sign(statusTransaction);
        let { returnCode: statusReturnCode, values: statusReturnValues, firstValue: statusFirstValue } = await runner.run(statusTransaction, lotteryStatusInteraction);
        assert.isTrue(statusReturnCode.equals(ReturnCode.Ok));
        assert.lengthOf(statusReturnValues, 1);
        assert.equal(statusFirstValue.valueOf().name, "Running");

        // lotteryInfo() (this is a view function, but for the sake of the test, we'll execute it)
        let lotteryInfoTransaction = getLotteryInfoInteraction.useThenIncrementNonceOf(alice.account).buildTransaction();
        await alice.signer.sign(lotteryInfoTransaction);
        let { returnCode: infoReturnCode, values: infoReturnValues, firstValue: infoFirstValue } = await runner.run(lotteryInfoTransaction, getLotteryInfoInteraction);
        assert.isTrue(infoReturnCode.equals(ReturnCode.Ok));
        assert.lengthOf(infoReturnValues, 1);

        // Ignore "deadline" field in our test
        let info = infoFirstValue.valueOf();
        delete info.deadline;

        assert.deepEqual(info, {
            ticket_price: new BigNumber("1000000000000000000"),
            tickets_left: new BigNumber(800),
            max_entries_per_user: new BigNumber(1),
            prize_distribution: Buffer.from([0x64]),
            whitelist: [],
            current_ticket_number: new BigNumber(0),
            prize_pool: new BigNumber("0")
        });
    });

    /**
     * Deploy is not currently supported by interactors yet.
     * We will deploy the contracts using the existing approach.
     */
    async function deploy(contract: SmartContract, path: string, gasLimit: GasLimit, initArguments: TypedValue[]): Promise<void> {
        let transactionDeploy = contract.deploy({
            code: await loadContractCode(path),
            gasLimit: gasLimit,
            initArguments: initArguments
        });

        // In these tests, all contracts are deployed by Alice.
        transactionDeploy.setNonce(alice.account.getNonceThenIncrement());
        await alice.signer.sign(transactionDeploy);
        await transactionDeploy.send(provider);
        await transactionDeploy.awaitExecuted(provider);
    }
});
