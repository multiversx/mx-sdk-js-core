import { DefaultSmartContractController } from "./smartContractController";
import { SmartContract } from "./smartContract";
import { loadAbiRegistry, loadContractCode, loadTestWallets, TestWallet } from "../testutils";
import { SmartContractAbi } from "./abi";
import { assert } from "chai";
import { Interaction } from "./interaction";
import { GasLimit } from "../networkParams";
import { ReturnCode } from "./returnCode";
import BigNumber from "bignumber.js";
import { createLocalnetProvider } from "../testutils/networkProviders";


describe("test smart contract interactor", function () {
    let provider = createLocalnetProvider();
    let alice: TestWallet;
    
    before(async function () {
        ({ alice } = await loadTestWallets());
    });

    it("should interact with 'answer' (local testnet)", async function () {
        this.timeout(80000);

        let abiRegistry = await loadAbiRegistry(["src/testdata/answer.abi.json"]);
        let abi = new SmartContractAbi(abiRegistry, ["answer"]);
        let contract = new SmartContract({ abi: abi });
        let controller = new DefaultSmartContractController(provider);

        let network = await provider.getNetworkConfig();
        await alice.sync(provider);

        // Deploy the contract
        let deployTransaction = contract.deploy({
            code: await loadContractCode("src/testdata/answer.wasm"),
            gasLimit: new GasLimit(3000000),
            initArguments: [],
            chainID: network.ChainID
        });

        deployTransaction.setNonce(alice.account.getNonceThenIncrement());
        await alice.signer.sign(deployTransaction);
        let { bundle: { returnCode } } = await controller.deploy(deployTransaction);
        assert.isTrue(returnCode.isSuccess());

        let interaction = <Interaction>contract.methods.getUltimateAnswer()
            .withGasLimit(new GasLimit(3000000))
            .withChainID(network.ChainID);

        // Query
        let queryResponseBundle = await controller.query(interaction);
        assert.lengthOf(queryResponseBundle.values, 1);
        assert.deepEqual(queryResponseBundle.firstValue!.valueOf(), new BigNumber(42));
        assert.isTrue(queryResponseBundle.returnCode.equals(ReturnCode.Ok));

        // Execute, do not wait for execution
        let transaction = interaction.useThenIncrementNonceOf(alice.account).buildTransaction();
        await alice.signer.sign(transaction);
        await provider.sendTransaction(transaction);
        // Execute, and wait for execution
        transaction = interaction.useThenIncrementNonceOf(alice.account).buildTransaction();
        await alice.signer.sign(transaction);
        let { bundle: executionResultsBundle } = await controller.execute(interaction, transaction);

        assert.lengthOf(executionResultsBundle.values, 1);
        assert.deepEqual(executionResultsBundle.firstValue!.valueOf(), new BigNumber(42));
        assert.isTrue(executionResultsBundle.returnCode.equals(ReturnCode.Ok));
    });

    it("should interact with 'counter' (local testnet)", async function () {
        this.timeout(120000);

        let abiRegistry = await loadAbiRegistry(["src/testdata/counter.abi.json"]);
        let abi = new SmartContractAbi(abiRegistry, ["counter"]);
        let contract = new SmartContract({ abi: abi });
        let controller = new DefaultSmartContractController(provider);

        let network = await provider.getNetworkConfig();
        await alice.sync(provider);

        // Deploy the contract
        let deployTransaction = contract.deploy({
            code: await loadContractCode("src/testdata/counter.wasm"),
            gasLimit: new GasLimit(3000000),
            initArguments: [],
            chainID: network.ChainID
        });

        deployTransaction.setNonce(alice.account.getNonceThenIncrement());
        await alice.signer.sign(deployTransaction);
        let { bundle: { returnCode } } = await controller.deploy(deployTransaction);
        assert.isTrue(returnCode.isSuccess());

        let getInteraction = <Interaction>contract.methods.get();
        let incrementInteraction = (<Interaction>contract.methods.increment())
            .withGasLimit(new GasLimit(3000000))
            .withChainID(network.ChainID);
        let decrementInteraction = (<Interaction>contract.methods.decrement())
            .withGasLimit(new GasLimit(3000000))
            .withChainID(network.ChainID);

        // Query "get()"
        let { firstValue: counterValue } = await controller.query(getInteraction);
        assert.deepEqual(counterValue!.valueOf(), new BigNumber(1));

        // Increment, wait for execution.
        let incrementTransaction = incrementInteraction.useThenIncrementNonceOf(alice.account).buildTransaction();
        await alice.signer.sign(incrementTransaction);
        let { bundle: { firstValue: valueAfterIncrement } } = await controller.execute(incrementInteraction, incrementTransaction);
        assert.deepEqual(valueAfterIncrement!.valueOf(), new BigNumber(2));

        // Decrement twice. Wait for execution of the second transaction.
        let decrementTransaction = decrementInteraction.useThenIncrementNonceOf(alice.account).buildTransaction();
        await alice.signer.sign(decrementTransaction);
        await provider.sendTransaction(decrementTransaction);

        decrementTransaction = decrementInteraction.useThenIncrementNonceOf(alice.account).buildTransaction();
        await alice.signer.sign(decrementTransaction);
        let { bundle: { firstValue: valueAfterDecrement } } = await controller.execute(decrementInteraction, decrementTransaction);
        assert.deepEqual(valueAfterDecrement!.valueOf(), new BigNumber(0));
    });

    it("should interact with 'lottery-esdt' (local testnet)", async function () {
        this.timeout(140000);

        let abiRegistry = await loadAbiRegistry(["src/testdata/lottery-esdt.abi.json"]);
        let abi = new SmartContractAbi(abiRegistry, ["Lottery"]);
        let contract = new SmartContract({ abi: abi });
        let controller = new DefaultSmartContractController(provider);

        let network = await provider.getNetworkConfig();
        await alice.sync(provider);

        // Deploy the contract
        let deployTransaction = contract.deploy({
            code: await loadContractCode("src/testdata/lottery-esdt.wasm"),
            gasLimit: new GasLimit(100000000),
            initArguments: [],
            chainID: network.ChainID
        });

        deployTransaction.setNonce(alice.account.getNonceThenIncrement());
        await alice.signer.sign(deployTransaction);
        let { bundle: { returnCode } } = await controller.deploy(deployTransaction);
        assert.isTrue(returnCode.isSuccess());

        let startInteraction = <Interaction>contract.methods.start([
            "lucky",
            "EGLD",
            1,
            null,
            null,
            1,
            null,
            null
        ])
        .withGasLimit(new GasLimit(30000000))
        .withChainID(network.ChainID);

        let lotteryStatusInteraction = <Interaction>contract.methods.status(["lucky"])
        .withGasLimit(new GasLimit(5000000))
        .withChainID(network.ChainID);

        let getLotteryInfoInteraction = <Interaction>contract.methods.getLotteryInfo(["lucky"])
        .withGasLimit(new GasLimit(5000000))
        .withChainID(network.ChainID);

        // start()
        let startTransaction = startInteraction.useThenIncrementNonceOf(alice.account).buildTransaction();
        await alice.signer.sign(startTransaction);
        let { bundle: bundleStart } = await controller.execute(startInteraction, startTransaction);
        assert.isTrue(bundleStart.returnCode.equals(ReturnCode.Ok));
        assert.lengthOf(bundleStart.values, 0);

        // status()
        let lotteryStatusTransaction = lotteryStatusInteraction.useThenIncrementNonceOf(alice.account).buildTransaction();
        await alice.signer.sign(lotteryStatusTransaction);
        let { bundle: bundleStatus } = await controller.execute(lotteryStatusInteraction, lotteryStatusTransaction);
        assert.isTrue(bundleStatus.returnCode.equals(ReturnCode.Ok));
        assert.lengthOf(bundleStatus.values, 1);
        assert.equal(bundleStatus.firstValue!.valueOf().name, "Running");

        // lotteryInfo() (this is a view function, but for the sake of the test, we'll execute it)
        let lotteryInfoTransaction = getLotteryInfoInteraction.useThenIncrementNonceOf(alice.account).buildTransaction();
        await alice.signer.sign(lotteryInfoTransaction);
        let { bundle: bundleLotteryInfo } = await controller.execute(getLotteryInfoInteraction, lotteryInfoTransaction);
        assert.isTrue(bundleLotteryInfo.returnCode.equals(ReturnCode.Ok));
        assert.lengthOf(bundleLotteryInfo.values, 1);

        // Ignore "deadline" field in our test
        let info = bundleLotteryInfo.firstValue!.valueOf();
        delete info.deadline;

        assert.deepEqual(info, {
            token_identifier: "EGLD",
            ticket_price: new BigNumber("1"),
            tickets_left: new BigNumber(800),
            max_entries_per_user: new BigNumber(1),
            prize_distribution: Buffer.from([0x64]),
            prize_pool: new BigNumber("0")
        });
    });
});
