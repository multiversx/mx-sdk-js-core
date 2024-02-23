import BigNumber from "bignumber.js";
import { assert } from "chai";
import { loadAbiRegistry, loadTestWallets, prepareDeployment, TestWallet } from "../testutils";
import { ContractController } from "../testutils/contractController";
import { createLocalnetProvider } from "../testutils/networkProviders";
import { Transaction, TransactionComputer } from "../transaction";
import { Interaction } from "./interaction";
import { ReturnCode } from "./returnCode";
import { SmartContract } from "./smartContract";
import { TransactionsFactoryConfig } from "../transactionsFactories/transactionsFactoryConfig";
import { SmartContractTransactionsFactory } from "../transactionsFactories/smartContractTransactionsFactory";
import { TokenComputer } from "../tokens";
import { promises } from "fs";

describe("test smart contract interactor", function () {
    let provider = createLocalnetProvider();
    let alice: TestWallet;

    before(async function () {
        ({ alice } = await loadTestWallets());
    });

    it("should interact with 'answer' (local testnet)", async function () {
        this.timeout(80000);

        let abiRegistry = await loadAbiRegistry("src/testdata/answer.abi.json");
        let contract = new SmartContract({ abi: abiRegistry });
        let controller = new ContractController(provider);

        let network = await provider.getNetworkConfig();
        await alice.sync(provider);

        // Deploy the contract
        let deployTransaction = await prepareDeployment({
            contract: contract,
            deployer: alice,
            codePath: "src/testdata/answer.wasm",
            gasLimit: 3000000,
            initArguments: [],
            chainID: network.ChainID,
        });

        let {
            bundle: { returnCode },
        } = await controller.deploy(deployTransaction);
        assert.isTrue(returnCode.isSuccess());

        const interaction = <Interaction>(
            contract.methods
                .getUltimateAnswer()
                .withGasLimit(3000000)
                .withChainID(network.ChainID)
                .withSender(alice.address)
        );

        // Query
        let queryResponseBundle = await controller.query(interaction);
        assert.lengthOf(queryResponseBundle.values, 1);
        assert.deepEqual(queryResponseBundle.firstValue!.valueOf(), new BigNumber(42));
        assert.isTrue(queryResponseBundle.returnCode.equals(ReturnCode.Ok));

        // Execute, do not wait for execution
        let transaction = interaction
            .withSender(alice.address)
            .useThenIncrementNonceOf(alice.account)
            .buildTransaction();

        await signTransaction({ transaction: transaction, wallet: alice });
        await provider.sendTransaction(transaction);

        // Execute, and wait for execution
        transaction = interaction.withSender(alice.address).useThenIncrementNonceOf(alice.account).buildTransaction();

        await signTransaction({ transaction: transaction, wallet: alice });
        let { bundle: executionResultsBundle } = await controller.execute(interaction, transaction);

        assert.lengthOf(executionResultsBundle.values, 1);
        assert.deepEqual(executionResultsBundle.firstValue!.valueOf(), new BigNumber(42));
        assert.isTrue(executionResultsBundle.returnCode.equals(ReturnCode.Ok));
    });

    it("should interact with 'answer' (local testnet) using the SmartContractTransactionsFactory", async function () {
        this.timeout(80000);

        let abiRegistry = await loadAbiRegistry("src/testdata/answer.abi.json");

        let network = await provider.getNetworkConfig();
        await alice.sync(provider);

        const config = new TransactionsFactoryConfig({ chainID: network.ChainID });
        const factory = new SmartContractTransactionsFactory({
            config: config,
            abi: abiRegistry,
            tokenComputer: new TokenComputer(),
        });

        const bytecode = await promises.readFile("src/testdata/answer.wasm");

        const deployTransaction = factory.createTransactionForDeploy({
            sender: alice.address,
            bytecode: bytecode,
            gasLimit: 3000000n,
        });
        deployTransaction.nonce = BigInt(alice.account.nonce.valueOf());

        const transactionComputer = new TransactionComputer();
        deployTransaction.signature = await alice.signer.sign(
            Buffer.from(transactionComputer.computeBytesForSigning(deployTransaction)),
        );

        const contractAddress = SmartContract.computeAddress(alice.address, alice.account.nonce);
        alice.account.incrementNonce();

        let contract = new SmartContract({ abi: abiRegistry, address: contractAddress });
        let controller = new ContractController(provider);

        let {
            bundle: { returnCode },
        } = await controller.deploy(deployTransaction);
        assert.isTrue(returnCode.isSuccess());

        const interaction = <Interaction>(
            contract.methods
                .getUltimateAnswer()
                .withGasLimit(3000000)
                .withChainID(network.ChainID)
                .withSender(alice.address)
        );

        // Query
        let queryResponseBundle = await controller.query(interaction);
        assert.lengthOf(queryResponseBundle.values, 1);
        assert.deepEqual(queryResponseBundle.firstValue!.valueOf(), new BigNumber(42));
        assert.isTrue(queryResponseBundle.returnCode.equals(ReturnCode.Ok));

        let transaction = factory.createTransactionForExecute({
            sender: alice.address,
            contract: contractAddress,
            functionName: "getUltimateAnswer",
            gasLimit: 3000000n,
        });
        transaction.nonce = BigInt(alice.account.nonce.valueOf());

        transaction.signature = await alice.signer.sign(
            Buffer.from(transactionComputer.computeBytesForSigning(transaction)),
        );

        alice.account.incrementNonce();

        // await signTransaction({ transaction: transaction, wallet: alice });
        await provider.sendTransaction(transaction);

        // Execute, and wait for execution
        transaction = factory.createTransactionForExecute({
            sender: alice.address,
            contract: contractAddress,
            functionName: "getUltimateAnswer",
            gasLimit: 3000000n,
        });
        transaction.nonce = BigInt(alice.account.nonce.valueOf());

        transaction.signature = await alice.signer.sign(
            Buffer.from(transactionComputer.computeBytesForSigning(transaction)),
        );

        alice.account.incrementNonce();

        let { bundle: executionResultsBundle } = await controller.execute(interaction, transaction);

        assert.lengthOf(executionResultsBundle.values, 1);
        assert.deepEqual(executionResultsBundle.firstValue!.valueOf(), new BigNumber(42));
        assert.isTrue(executionResultsBundle.returnCode.equals(ReturnCode.Ok));
    });

    it("should interact with 'counter' (local testnet)", async function () {
        this.timeout(120000);

        let abiRegistry = await loadAbiRegistry("src/testdata/counter.abi.json");
        let contract = new SmartContract({ abi: abiRegistry });
        let controller = new ContractController(provider);

        let network = await provider.getNetworkConfig();
        await alice.sync(provider);

        // Deploy the contract
        let deployTransaction = await prepareDeployment({
            contract: contract,
            deployer: alice,
            codePath: "src/testdata/counter.wasm",
            gasLimit: 3000000,
            initArguments: [],
            chainID: network.ChainID,
        });

        let {
            bundle: { returnCode },
        } = await controller.deploy(deployTransaction);
        assert.isTrue(returnCode.isSuccess());

        let getInteraction = <Interaction>contract.methods.get();
        let incrementInteraction = (<Interaction>contract.methods.increment())
            .withGasLimit(3000000)
            .withChainID(network.ChainID)
            .withSender(alice.address);
        let decrementInteraction = (<Interaction>contract.methods.decrement())
            .withGasLimit(3000000)
            .withChainID(network.ChainID)
            .withSender(alice.address);

        // Query "get()"
        let { firstValue: counterValue } = await controller.query(getInteraction);
        assert.deepEqual(counterValue!.valueOf(), new BigNumber(1));

        // Increment, wait for execution.
        let incrementTransaction = incrementInteraction.useThenIncrementNonceOf(alice.account).buildTransaction();
        await signTransaction({ transaction: incrementTransaction, wallet: alice });
        let {
            bundle: { firstValue: valueAfterIncrement },
        } = await controller.execute(incrementInteraction, incrementTransaction);
        assert.deepEqual(valueAfterIncrement!.valueOf(), new BigNumber(2));

        // Decrement twice. Wait for execution of the second transaction.
        let decrementTransaction = decrementInteraction.useThenIncrementNonceOf(alice.account).buildTransaction();
        await signTransaction({ transaction: decrementTransaction, wallet: alice });
        await provider.sendTransaction(decrementTransaction);

        decrementTransaction = decrementInteraction.useThenIncrementNonceOf(alice.account).buildTransaction();
        await signTransaction({ transaction: decrementTransaction, wallet: alice });
        let {
            bundle: { firstValue: valueAfterDecrement },
        } = await controller.execute(decrementInteraction, decrementTransaction);
        assert.deepEqual(valueAfterDecrement!.valueOf(), new BigNumber(0));
    });

    it("should interact with 'counter' (local testnet) using the SmartContractTransactionsFactory", async function () {
        this.timeout(120000);

        let abiRegistry = await loadAbiRegistry("src/testdata/counter.abi.json");

        let network = await provider.getNetworkConfig();
        await alice.sync(provider);

        const config = new TransactionsFactoryConfig({ chainID: network.ChainID });
        const factory = new SmartContractTransactionsFactory({
            config: config,
            abi: abiRegistry,
            tokenComputer: new TokenComputer(),
        });

        const bytecode = await promises.readFile("src/testdata/counter.wasm");

        const deployTransaction = factory.createTransactionForDeploy({
            sender: alice.address,
            bytecode: bytecode,
            gasLimit: 3000000n,
        });
        deployTransaction.nonce = BigInt(alice.account.nonce.valueOf());

        const transactionComputer = new TransactionComputer();
        deployTransaction.signature = await alice.signer.sign(
            Buffer.from(transactionComputer.computeBytesForSigning(deployTransaction)),
        );

        const contractAddress = SmartContract.computeAddress(alice.address, alice.account.nonce);
        alice.account.incrementNonce();

        let contract = new SmartContract({ abi: abiRegistry, address: contractAddress });
        let controller = new ContractController(provider);

        let {
            bundle: { returnCode },
        } = await controller.deploy(deployTransaction);
        assert.isTrue(returnCode.isSuccess());

        let getInteraction = <Interaction>contract.methods.get();

        let incrementInteraction = (<Interaction>contract.methods.increment())
            .withGasLimit(3000000)
            .withChainID(network.ChainID)
            .withSender(alice.address);
        let decrementInteraction = (<Interaction>contract.methods.decrement())
            .withGasLimit(3000000)
            .withChainID(network.ChainID)
            .withSender(alice.address);

        let incrementTransaction = factory.createTransactionForExecute({
            sender: alice.address,
            contract: contractAddress,
            functionName: "increment",
            gasLimit: 3000000n,
        });
        incrementTransaction.nonce = BigInt(alice.account.nonce.valueOf());

        incrementTransaction.signature = await alice.signer.sign(
            Buffer.from(transactionComputer.computeBytesForSigning(incrementTransaction)),
        );

        alice.account.incrementNonce();

        // Query "get()"
        let { firstValue: counterValue } = await controller.query(getInteraction);
        assert.deepEqual(counterValue!.valueOf(), new BigNumber(1));

        let {
            bundle: { firstValue: valueAfterIncrement },
        } = await controller.execute(incrementInteraction, incrementTransaction);
        assert.deepEqual(valueAfterIncrement!.valueOf(), new BigNumber(2));

        let decrementTransaction = factory.createTransactionForExecute({
            sender: alice.address,
            contract: contractAddress,
            functionName: "decrement",
            gasLimit: 3000000n,
        });
        decrementTransaction.nonce = BigInt(alice.account.nonce.valueOf());

        decrementTransaction.signature = await alice.signer.sign(
            Buffer.from(transactionComputer.computeBytesForSigning(decrementTransaction)),
        );

        alice.account.incrementNonce();

        await provider.sendTransaction(decrementTransaction);

        decrementTransaction.nonce = BigInt(alice.account.nonce.valueOf());

        decrementTransaction.signature = await alice.signer.sign(
            Buffer.from(transactionComputer.computeBytesForSigning(decrementTransaction)),
        );

        let {
            bundle: { firstValue: valueAfterDecrement },
        } = await controller.execute(decrementInteraction, decrementTransaction);
        assert.deepEqual(valueAfterDecrement!.valueOf(), new BigNumber(0));
    });

    it("should interact with 'lottery-esdt' (local testnet)", async function () {
        this.timeout(140000);

        let abiRegistry = await loadAbiRegistry("src/testdata/lottery-esdt.abi.json");
        let contract = new SmartContract({ abi: abiRegistry });
        let controller = new ContractController(provider);

        let network = await provider.getNetworkConfig();
        await alice.sync(provider);

        // Deploy the contract
        let deployTransaction = await prepareDeployment({
            contract: contract,
            deployer: alice,
            codePath: "src/testdata/lottery-esdt.wasm",
            gasLimit: 100000000,
            initArguments: [],
            chainID: network.ChainID,
        });

        let {
            bundle: { returnCode },
        } = await controller.deploy(deployTransaction);
        assert.isTrue(returnCode.isSuccess());

        let startInteraction = <Interaction>(
            contract.methods
                .start(["lucky", "EGLD", 1, null, null, 1, null, null])
                .withGasLimit(30000000)
                .withChainID(network.ChainID)
                .withSender(alice.address)
        );

        let lotteryStatusInteraction = <Interaction>(
            contract.methods
                .status(["lucky"])
                .withGasLimit(5000000)
                .withChainID(network.ChainID)
                .withSender(alice.address)
        );

        let getLotteryInfoInteraction = <Interaction>(
            contract.methods
                .getLotteryInfo(["lucky"])
                .withGasLimit(5000000)
                .withChainID(network.ChainID)
                .withSender(alice.address)
        );

        // start()
        let startTransaction = startInteraction
            .withSender(alice.address)
            .useThenIncrementNonceOf(alice.account)
            .buildTransaction();

        await signTransaction({ transaction: startTransaction, wallet: alice });
        let { bundle: bundleStart } = await controller.execute(startInteraction, startTransaction);
        assert.isTrue(bundleStart.returnCode.equals(ReturnCode.Ok));
        assert.lengthOf(bundleStart.values, 0);

        // status()
        let lotteryStatusTransaction = lotteryStatusInteraction
            .withSender(alice.address)
            .useThenIncrementNonceOf(alice.account)
            .buildTransaction();

        await signTransaction({ transaction: lotteryStatusTransaction, wallet: alice });
        let { bundle: bundleStatus } = await controller.execute(lotteryStatusInteraction, lotteryStatusTransaction);
        assert.isTrue(bundleStatus.returnCode.equals(ReturnCode.Ok));
        assert.lengthOf(bundleStatus.values, 1);
        assert.equal(bundleStatus.firstValue!.valueOf().name, "Running");

        // lotteryInfo() (this is a view function, but for the sake of the test, we'll execute it)
        let lotteryInfoTransaction = getLotteryInfoInteraction
            .withSender(alice.address)
            .useThenIncrementNonceOf(alice.account)
            .buildTransaction();

        await signTransaction({ transaction: lotteryInfoTransaction, wallet: alice });
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
            prize_pool: new BigNumber("0"),
        });
    });

    it("should interact with 'lottery-esdt' (local testnet) using the SmartContractTransactionsFactory", async function () {
        this.timeout(140000);

        let abiRegistry = await loadAbiRegistry("src/testdata/lottery-esdt.abi.json");
        let contract = new SmartContract({ abi: abiRegistry });
        let controller = new ContractController(provider);

        let network = await provider.getNetworkConfig();
        await alice.sync(provider);

        const config = new TransactionsFactoryConfig({ chainID: network.ChainID });
        const factory = new SmartContractTransactionsFactory({
            config: config,
            abi: abiRegistry,
            tokenComputer: new TokenComputer(),
        });

        const bytecode = await promises.readFile("src/testdata/lottery-esdt.wasm");

        // Deploy the contract
        const deployTransaction = factory.createTransactionForDeploy({
            sender: alice.address,
            bytecode: bytecode,
            gasLimit: 100000000n,
        });
        deployTransaction.nonce = BigInt(alice.account.nonce.valueOf());

        const transactionComputer = new TransactionComputer();
        deployTransaction.signature = await alice.signer.sign(
            Buffer.from(transactionComputer.computeBytesForSigning(deployTransaction)),
        );

        const contractAddress = SmartContract.computeAddress(alice.address, alice.account.nonce);
        alice.account.incrementNonce();

        let {
            bundle: { returnCode },
        } = await controller.deploy(deployTransaction);
        assert.isTrue(returnCode.isSuccess());

        let startInteraction = <Interaction>(
            contract.methods
                .start(["lucky", "EGLD", 1, null, null, 1, null, null])
                .withGasLimit(30000000)
                .withChainID(network.ChainID)
                .withSender(alice.address)
        );

        let lotteryStatusInteraction = <Interaction>(
            contract.methods
                .status(["lucky"])
                .withGasLimit(5000000)
                .withChainID(network.ChainID)
                .withSender(alice.address)
        );

        let getLotteryInfoInteraction = <Interaction>(
            contract.methods
                .getLotteryInfo(["lucky"])
                .withGasLimit(5000000)
                .withChainID(network.ChainID)
                .withSender(alice.address)
        );

        // start()
        let startTransaction = factory.createTransactionForExecute({
            sender: alice.address,
            contract: contractAddress,
            functionName: "start",
            args: ["lucky", "EGLD", 1, null, null, 1, null, null],
            gasLimit: 30000000n,
        });
        startTransaction.nonce = BigInt(alice.account.nonce.valueOf());

        startTransaction.signature = await alice.signer.sign(
            Buffer.from(transactionComputer.computeBytesForSigning(startTransaction)),
        );

        alice.account.incrementNonce();

        let { bundle: bundleStart } = await controller.execute(startInteraction, startTransaction);
        assert.isTrue(bundleStart.returnCode.equals(ReturnCode.Ok));
        assert.lengthOf(bundleStart.values, 0);

        // status()
        let lotteryStatusTransaction = factory.createTransactionForExecute({
            sender: alice.address,
            contract: contractAddress,
            functionName: "status",
            args: ["lucky"],
            gasLimit: 5000000n,
        });
        lotteryStatusTransaction.nonce = BigInt(alice.account.nonce.valueOf());

        lotteryStatusTransaction.signature = await alice.signer.sign(
            Buffer.from(transactionComputer.computeBytesForSigning(lotteryStatusTransaction)),
        );

        alice.account.incrementNonce();

        let { bundle: bundleStatus } = await controller.execute(lotteryStatusInteraction, lotteryStatusTransaction);
        assert.isTrue(bundleStatus.returnCode.equals(ReturnCode.Ok));
        assert.lengthOf(bundleStatus.values, 1);
        assert.equal(bundleStatus.firstValue!.valueOf().name, "Running");

        // lotteryInfo() (this is a view function, but for the sake of the test, we'll execute it)
        let lotteryInfoTransaction = factory.createTransactionForExecute({
            sender: alice.address,
            contract: contractAddress,
            functionName: "getLotteryInfo",
            args: ["lucky"],
            gasLimit: 5000000n,
        });
        lotteryInfoTransaction.nonce = BigInt(alice.account.nonce.valueOf());

        lotteryInfoTransaction.signature = await alice.signer.sign(
            Buffer.from(transactionComputer.computeBytesForSigning(lotteryInfoTransaction)),
        );

        alice.account.incrementNonce();

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
            prize_pool: new BigNumber("0"),
        });
    });

    async function signTransaction(options: { transaction: Transaction; wallet: TestWallet }) {
        const transaction = options.transaction;
        const wallet = options.wallet;

        const serialized = transaction.serializeForSigning();
        const signature = await wallet.signer.sign(serialized);
        transaction.applySignature(signature);
    }
});
