import BigNumber from "bignumber.js";
import { assert } from "chai";
import { loadAbiRegistry, loadTestWallets, prepareDeployment, TestWallet } from "../testutils";
import { ContractController } from "../testutils/contractController";
import { createLocalnetProvider } from "../testutils/networkProviders";
import { Transaction } from "../transaction";
import { TransactionComputer } from "../transactionComputer";
import { Interaction } from "./interaction";
import { ReturnCode } from "./returnCode";
import { SmartContract } from "./smartContract";
import { TransactionsFactoryConfig } from "../transactionsFactories/transactionsFactoryConfig";
import { SmartContractTransactionsFactory } from "../transactionsFactories/smartContractTransactionsFactory";
import { promises } from "fs";
import { ResultsParser } from "./resultsParser";
import { TransactionWatcher } from "../transactionWatcher";
import { SmartContractQueriesController } from "../smartContractQueriesController";
import { QueryRunnerAdapter } from "../adapters/queryRunnerAdapter";
import { ManagedDecimalSignedValue, ManagedDecimalValue } from "./typesystem";

describe("test smart contract interactor", function () {
    let provider = createLocalnetProvider();
    let alice: TestWallet;
    let resultsParser: ResultsParser;

    before(async function () {
        ({ alice } = await loadTestWallets());
        resultsParser = new ResultsParser();
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

        const transactionCompletionAwaiter = new TransactionWatcher({
            getTransaction: async (hash: string) => {
                return await provider.getTransaction(hash, true);
            },
        });

        const deployTxHash = await provider.sendTransaction(deployTransaction);
        let transactionOnNetwork = await transactionCompletionAwaiter.awaitCompleted(deployTxHash);
        const untypedBundle = resultsParser.parseUntypedOutcome(transactionOnNetwork);
        assert.isTrue(untypedBundle.returnCode.isSuccess());

        const queryRunner = new QueryRunnerAdapter({ networkProvider: provider });
        const queryController = new SmartContractQueriesController({ abi: abiRegistry, queryRunner: queryRunner });

        const query = queryController.createQuery({
            contract: contractAddress.bech32(),
            caller: alice.address.bech32(),
            function: "getUltimateAnswer",
            arguments: [],
        });

        const queryResponse = await queryController.runQuery(query);
        const parsed = queryController.parseQueryResponse(queryResponse);
        assert.lengthOf(parsed, 1);
        assert.deepEqual(parsed[0], new BigNumber(42));

        // Query
        let transaction = factory.createTransactionForExecute({
            sender: alice.address,
            contract: contractAddress,
            function: "getUltimateAnswer",
            gasLimit: 3000000n,
        });
        transaction.nonce = BigInt(alice.account.nonce.valueOf());
        transaction.signature = await alice.signer.sign(
            Buffer.from(transactionComputer.computeBytesForSigning(transaction)),
        );

        alice.account.incrementNonce();

        await provider.sendTransaction(transaction);

        // Execute, and wait for execution
        transaction = factory.createTransactionForExecute({
            sender: alice.address,
            contract: contractAddress,
            function: "getUltimateAnswer",
            gasLimit: 3000000n,
        });
        transaction.nonce = BigInt(alice.account.nonce.valueOf());
        transaction.signature = await alice.signer.sign(
            Buffer.from(transactionComputer.computeBytesForSigning(transaction)),
        );

        alice.account.incrementNonce();

        const executeTxHash = await provider.sendTransaction(transaction);
        transactionOnNetwork = await transactionCompletionAwaiter.awaitCompleted(executeTxHash);
        const typedBundle = resultsParser.parseOutcome(
            transactionOnNetwork,
            abiRegistry.getEndpoint("getUltimateAnswer"),
        );

        assert.lengthOf(typedBundle.values, 1);
        assert.deepEqual(typedBundle.firstValue!.valueOf(), new BigNumber(42));
        assert.isTrue(typedBundle.returnCode.equals(ReturnCode.Ok));
    });

    it("should interact with 'basic-features' (local testnet) using the SmartContractTransactionsFactory", async function () {
        this.timeout(140000);

        let abiRegistry = await loadAbiRegistry("src/testdata/basic-features.abi.json");
        let contract = new SmartContract({ abi: abiRegistry });
        let controller = new ContractController(provider);

        let network = await provider.getNetworkConfig();
        await alice.sync(provider);

        // Deploy the contract
        let deployTransaction = await prepareDeployment({
            contract: contract,
            deployer: alice,
            codePath: "src/testdata/basic-features.wasm",
            gasLimit: 600000000,
            initArguments: [],
            chainID: network.ChainID,
        });

        let {
            bundle: { returnCode },
        } = await controller.deploy(deployTransaction);
        assert.isTrue(returnCode.isSuccess());

        let returnEgldInteraction = <Interaction>(
            contract.methods
                .returns_egld_decimal([])
                .withGasLimit(10000000)
                .withChainID(network.ChainID)
                .withSender(alice.address)
                .withValue(1)
        );

        // returnEgld()
        let returnEgldTransaction = returnEgldInteraction
            .withSender(alice.address)
            .useThenIncrementNonceOf(alice.account)
            .buildTransaction();

        let additionInteraction = <Interaction>contract.methods
            .managed_decimal_addition([new ManagedDecimalValue(2, 2), new ManagedDecimalValue(3, 2)])
            .withGasLimit(10000000)
            .withChainID(network.ChainID)
            .withSender(alice.address)
            .withValue(0);

        // addition()
        let additionTransaction = additionInteraction
            .withSender(alice.address)
            .useThenIncrementNonceOf(alice.account)
            .buildTransaction();

        // log
        let mdLnInteraction = <Interaction>contract.methods
            .managed_decimal_ln([new ManagedDecimalValue(23000000000, 9)])
            .withGasLimit(10000000)
            .withChainID(network.ChainID)
            .withSender(alice.address)
            .withValue(0);

        // mdLn()
        let mdLnTransaction = mdLnInteraction
            .withSender(alice.address)
            .useThenIncrementNonceOf(alice.account)
            .buildTransaction();

        let additionVarInteraction = <Interaction>contract.methods
            .managed_decimal_addition_var([
                new ManagedDecimalValue(378298000000, 9, true),
                new ManagedDecimalValue(378298000000, 9, true),
            ])
            .withGasLimit(50000000)
            .withChainID(network.ChainID)
            .withSender(alice.address)
            .withValue(0);

        // addition()
        let additionVarTransaction = additionVarInteraction
            .withSender(alice.address)
            .useThenIncrementNonceOf(alice.account)
            .buildTransaction();

        // returnEgld()
        await signTransaction({ transaction: returnEgldTransaction, wallet: alice });
        let { bundle: bundleEgld } = await controller.execute(returnEgldInteraction, returnEgldTransaction);
        assert.isTrue(bundleEgld.returnCode.equals(ReturnCode.Ok));
        assert.lengthOf(bundleEgld.values, 1);
        assert.deepEqual(bundleEgld.values[0], new ManagedDecimalValue(1, 18));

        // addition with const decimals()
        await signTransaction({ transaction: additionTransaction, wallet: alice });
        let { bundle: bundleAdditionConst } = await controller.execute(additionInteraction, additionTransaction);
        assert.isTrue(bundleAdditionConst.returnCode.equals(ReturnCode.Ok));
        assert.lengthOf(bundleAdditionConst.values, 1);
        assert.deepEqual(bundleAdditionConst.values[0], new ManagedDecimalValue(5, 2));

        // log
        await signTransaction({ transaction: mdLnTransaction, wallet: alice });
        let { bundle: bundleMDLn } = await controller.execute(mdLnInteraction, mdLnTransaction);
        assert.isTrue(bundleMDLn.returnCode.equals(ReturnCode.Ok));
        assert.lengthOf(bundleMDLn.values, 1);
        assert.deepEqual(bundleMDLn.values[0], new ManagedDecimalSignedValue(3135553845, 9));

        // addition with var decimals
        await signTransaction({ transaction: additionVarTransaction, wallet: alice });
        let { bundle: bundleAddition } = await controller.execute(additionVarInteraction, additionVarTransaction);
        assert.isTrue(bundleAddition.returnCode.equals(ReturnCode.Ok));
        assert.lengthOf(bundleAddition.values, 1);
        assert.deepEqual(bundleAddition.values[0], new ManagedDecimalValue(new BigNumber(6254154138880), 9));
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

        const transactionCompletionAwaiter = new TransactionWatcher({
            getTransaction: async (hash: string) => {
                return await provider.getTransaction(hash, true);
            },
        });

        const deployTxHash = await provider.sendTransaction(deployTransaction);
        let transactionOnNetwork = await transactionCompletionAwaiter.awaitCompleted(deployTxHash);
        const untypedBundle = resultsParser.parseUntypedOutcome(transactionOnNetwork);
        assert.isTrue(untypedBundle.returnCode.isSuccess());

        const queryRunner = new QueryRunnerAdapter({ networkProvider: provider });
        const queryController = new SmartContractQueriesController({ abi: abiRegistry, queryRunner: queryRunner });

        let incrementTransaction = factory.createTransactionForExecute({
            sender: alice.address,
            contract: contractAddress,
            function: "increment",
            gasLimit: 3000000n,
        });
        incrementTransaction.nonce = BigInt(alice.account.nonce.valueOf());

        incrementTransaction.signature = await alice.signer.sign(
            Buffer.from(transactionComputer.computeBytesForSigning(incrementTransaction)),
        );

        alice.account.incrementNonce();

        // Query "get()"
        const query = queryController.createQuery({
            contract: contractAddress.bech32(),
            function: "get",
            arguments: [],
        });
        const queryResponse = await queryController.runQuery(query);
        const parsed = queryController.parseQueryResponse(queryResponse);
        assert.deepEqual(parsed[0], new BigNumber(1));

        const incrementTxHash = await provider.sendTransaction(incrementTransaction);
        transactionOnNetwork = await transactionCompletionAwaiter.awaitCompleted(incrementTxHash);
        let typedBundle = resultsParser.parseOutcome(transactionOnNetwork, abiRegistry.getEndpoint("increment"));
        assert.deepEqual(typedBundle.firstValue!.valueOf(), new BigNumber(2));

        let decrementTransaction = factory.createTransactionForExecute({
            sender: alice.address,
            contract: contractAddress,
            function: "decrement",
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

        const decrementTxHash = await provider.sendTransaction(decrementTransaction);
        transactionOnNetwork = await transactionCompletionAwaiter.awaitCompleted(decrementTxHash);
        typedBundle = resultsParser.parseOutcome(transactionOnNetwork, abiRegistry.getEndpoint("decrement"));
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

        let network = await provider.getNetworkConfig();
        await alice.sync(provider);

        const config = new TransactionsFactoryConfig({ chainID: network.ChainID });
        const factory = new SmartContractTransactionsFactory({
            config: config,
            abi: abiRegistry,
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

        const transactionCompletionAwaiter = new TransactionWatcher({
            getTransaction: async (hash: string) => {
                return await provider.getTransaction(hash, true);
            },
        });

        const deployTxHash = await provider.sendTransaction(deployTransaction);
        let transactionOnNetwork = await transactionCompletionAwaiter.awaitCompleted(deployTxHash);
        const untypedBundle = resultsParser.parseUntypedOutcome(transactionOnNetwork);
        assert.isTrue(untypedBundle.returnCode.isSuccess());

        // start()
        let startTransaction = factory.createTransactionForExecute({
            sender: alice.address,
            contract: contractAddress,
            function: "start",
            arguments: ["lucky", "EGLD", 1, null, null, 1, null, null],
            gasLimit: 30000000n,
        });
        startTransaction.nonce = BigInt(alice.account.nonce.valueOf());
        startTransaction.signature = await alice.signer.sign(
            Buffer.from(transactionComputer.computeBytesForSigning(startTransaction)),
        );

        alice.account.incrementNonce();

        const startTxHash = await provider.sendTransaction(startTransaction);
        transactionOnNetwork = await transactionCompletionAwaiter.awaitCompleted(startTxHash);
        let typedBundle = resultsParser.parseOutcome(transactionOnNetwork, abiRegistry.getEndpoint("start"));
        assert.equal(typedBundle.returnCode.valueOf(), "ok");
        assert.lengthOf(typedBundle.values, 0);

        // status()
        let lotteryStatusTransaction = factory.createTransactionForExecute({
            sender: alice.address,
            contract: contractAddress,
            function: "status",
            arguments: ["lucky"],
            gasLimit: 5000000n,
        });
        lotteryStatusTransaction.nonce = BigInt(alice.account.nonce.valueOf());
        lotteryStatusTransaction.signature = await alice.signer.sign(
            Buffer.from(transactionComputer.computeBytesForSigning(lotteryStatusTransaction)),
        );

        alice.account.incrementNonce();

        const statusTxHash = await provider.sendTransaction(lotteryStatusTransaction);
        transactionOnNetwork = await transactionCompletionAwaiter.awaitCompleted(statusTxHash);
        typedBundle = resultsParser.parseOutcome(transactionOnNetwork, abiRegistry.getEndpoint("status"));
        assert.equal(typedBundle.returnCode.valueOf(), "ok");
        assert.lengthOf(typedBundle.values, 1);
        assert.equal(typedBundle.firstValue!.valueOf().name, "Running");

        // getlotteryInfo() (this is a view function, but for the sake of the test, we'll execute it)
        let lotteryInfoTransaction = factory.createTransactionForExecute({
            sender: alice.address,
            contract: contractAddress,
            function: "getLotteryInfo",
            arguments: ["lucky"],
            gasLimit: 5000000n,
        });
        lotteryInfoTransaction.nonce = BigInt(alice.account.nonce.valueOf());
        lotteryInfoTransaction.signature = await alice.signer.sign(
            Buffer.from(transactionComputer.computeBytesForSigning(lotteryInfoTransaction)),
        );

        alice.account.incrementNonce();

        const infoTxHash = await provider.sendTransaction(lotteryInfoTransaction);
        transactionOnNetwork = await transactionCompletionAwaiter.awaitCompleted(infoTxHash);
        typedBundle = resultsParser.parseOutcome(transactionOnNetwork, abiRegistry.getEndpoint("getLotteryInfo"));
        assert.equal(typedBundle.returnCode.valueOf(), "ok");
        assert.lengthOf(typedBundle.values, 1);

        // Ignore "deadline" field in our test
        let info = typedBundle.firstValue!.valueOf();
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
