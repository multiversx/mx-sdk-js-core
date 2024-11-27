import BigNumber from "bignumber.js";
import { assert } from "chai";
import { promises } from "fs";
import { SmartContractQueryInput } from "../smartContractQuery";
import {
    SmartContractController,
    SmartContractTransactionsFactory,
    SmartContractTransactionsOutcomeParser,
} from "../smartContracts";
import { loadAbiRegistry, loadTestWallets, prepareDeployment, TestWallet } from "../testutils";
import { createLocalnetProvider } from "../testutils/networkProviders";
import { Transaction } from "../transaction";
import { TransactionComputer } from "../transactionComputer";
import { TransactionsFactoryConfig } from "../transactionsFactoryConfig";
import { TransactionWatcher } from "../transactionWatcher";
import { Interaction } from "./interaction";
import { SmartContract } from "./smartContract";
import { ManagedDecimalSignedValue, ManagedDecimalValue } from "./typesystem";

describe.only("test smart contract interactor", function () {
    let provider = createLocalnetProvider();
    let alice: TestWallet;

    before(async function () {
        ({ alice } = await loadTestWallets());
    });

    it("should interact with 'answer' (local testnet)", async function () {
        this.timeout(80000);

        let abiRegistry = await loadAbiRegistry("src/testdata/answer.abi.json");
        let contract = new SmartContract({ abi: abiRegistry });
        let controller = new SmartContractController({
            chainID: "localnet",
            networkProvider: provider,
            abi: abiRegistry,
        });

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

        let deployTxHash = await provider.sendTransaction(deployTransaction);
        let deployResponse = await controller.awaitCompletedDeploy(deployTxHash);
        assert.isTrue(deployResponse.returnCode == "ok");

        const interaction = <Interaction>(
            contract.methods
                .getUltimateAnswer()
                .withGasLimit(3000000)
                .withChainID(network.ChainID)
                .withSender(alice.address)
        );
        const interactionQuery = interaction.buildQuery();

        // Query
        const queryResponse = await controller.query(
            new SmartContractQueryInput({
                contract: interactionQuery.address,
                arguments: interactionQuery.getEncodedArguments(),
                function: interactionQuery.func.toString(),
                caller: interactionQuery.caller,
                value: BigInt(interactionQuery.value.toString()),
            }),
        );
        assert.lengthOf(queryResponse, 1);
        assert.deepEqual(queryResponse[0]!.valueOf(), new BigNumber(42));

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
        let txHash = await provider.sendTransaction(transaction);
        let response = await controller.awaitCompletedExecute(txHash);
        assert.isTrue(response.returnCode == "ok");
        assert.lengthOf(response.values, 1);
        assert.deepEqual(response.values[0], new BigNumber(42));
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

        const deployTransaction = factory.createTransactionForDeploy(alice.address, {
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
                return await provider.getTransaction(hash);
            },
        });

        const deployTxHash = await provider.sendTransaction(deployTransaction);

        const queryController = new SmartContractController({
            chainID: "localnet",
            networkProvider: provider,
            abi: abiRegistry,
        });

        let transactionOnNetwork = await transactionCompletionAwaiter.awaitCompleted(deployTxHash);
        let response = queryController.parseExecute(transactionOnNetwork);
        assert.isTrue(response.returnCode == "ok");

        const query = queryController.createQuery({
            contract: contractAddress,
            caller: alice.address,
            function: "getUltimateAnswer",
            arguments: [],
        });

        const queryResponse = await queryController.runQuery(query);
        const parsed = queryController.parseQueryResponse(queryResponse);
        assert.lengthOf(parsed, 1);
        assert.deepEqual(parsed[0], new BigNumber(42));

        // Query
        let transaction = factory.createTransactionForExecute(alice.address, {
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
        transaction = factory.createTransactionForExecute(alice.address, {
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
        response = queryController.parseExecute(transactionOnNetwork);

        assert.isTrue(response.values.length == 1);
        assert.deepEqual(response.values[0], new BigNumber(42));
        assert.isTrue(response.returnCode == "ok");
    });

    it("should interact with 'basic-features' (local testnet)", async function () {
        this.timeout(140000);

        let abiRegistry = await loadAbiRegistry("src/testdata/basic-features.abi.json");
        let contract = new SmartContract({ abi: abiRegistry });
        let controller = new SmartContractController({
            chainID: "localnet",
            networkProvider: provider,
            abi: abiRegistry,
        });

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
        let deployTxHash = await provider.sendTransaction(deployTransaction);
        let deployResponse = await controller.awaitCompletedDeploy(deployTxHash);
        assert.isTrue(deployResponse.returnCode == "ok");

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
            .managed_decimal_addition([new ManagedDecimalValue("2.5", 2), new ManagedDecimalValue("2.7", 2)])
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
            .managed_decimal_ln([new ManagedDecimalValue("23", 9)])
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
                new ManagedDecimalValue("4", 2, true),
                new ManagedDecimalValue("5", 2, true),
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

        let lnVarInteraction = <Interaction>contract.methods
            .managed_decimal_ln_var([new ManagedDecimalValue("23", 9, true)])
            .withGasLimit(50000000)
            .withChainID(network.ChainID)
            .withSender(alice.address)
            .withValue(0);

        // managed_decimal_ln_var()
        let lnVarTransaction = lnVarInteraction
            .withSender(alice.address)
            .useThenIncrementNonceOf(alice.account)
            .buildTransaction();

        // returnEgld()
        await signTransaction({ transaction: returnEgldTransaction, wallet: alice });
        let txHash = await provider.sendTransaction(returnEgldTransaction);
        let response = await controller.awaitCompletedExecute(txHash);
        assert.isTrue(response.returnCode == "ok");
        assert.lengthOf(response.values, 1);
        assert.deepEqual(response.values[0], new ManagedDecimalValue("0.000000000000000001", 18));

        // addition with const decimals()
        await signTransaction({ transaction: additionTransaction, wallet: alice });
        txHash = await provider.sendTransaction(additionTransaction);
        response = await controller.awaitCompletedExecute(txHash);
        assert.isTrue(response.returnCode == "ok");
        assert.lengthOf(response.values, 1);
        assert.deepEqual(response.values[0], new ManagedDecimalValue("5.2", 2));

        // log
        await signTransaction({ transaction: mdLnTransaction, wallet: alice });
        txHash = await provider.sendTransaction(mdLnTransaction);
        response = await controller.awaitCompletedExecute(txHash);

        assert.isTrue(response.returnCode == "ok");
        assert.lengthOf(response.values, 1);
        assert.deepEqual(response.values[0], new ManagedDecimalSignedValue("3.135553845", 9));

        // addition with var decimals
        await signTransaction({ transaction: additionVarTransaction, wallet: alice });
        txHash = await provider.sendTransaction(additionVarTransaction);
        response = await controller.awaitCompletedExecute(txHash);
        assert.isTrue(response.returnCode == "ok");
        assert.lengthOf(response.values, 1);
        assert.deepEqual(response.values[0], new ManagedDecimalValue("9", 2));

        // log
        await signTransaction({ transaction: lnVarTransaction, wallet: alice });
        txHash = await provider.sendTransaction(lnVarTransaction);
        response = await controller.awaitCompletedExecute(txHash);
        assert.isTrue(response.returnCode == "ok");
        assert.lengthOf(response.values, 1);
        assert.deepEqual(response.values[0], new ManagedDecimalSignedValue("3.135553845", 9));
    });

    it("should interact with 'counter' (local testnet)", async function () {
        this.timeout(120000);

        let abiRegistry = await loadAbiRegistry("src/testdata/counter.abi.json");
        let contract = new SmartContract({ abi: abiRegistry });
        let controller = new SmartContractController({
            chainID: "localnet",
            networkProvider: provider,
            abi: abiRegistry,
        });

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

        await provider.sendTransaction(deployTransaction);
        let hash = await provider.sendTransaction(deployTransaction);
        let responseExecute = await controller.awaitCompletedExecute(hash);
        assert.isTrue(responseExecute.returnCode == "ok");

        let incrementInteraction = (<Interaction>contract.methods.increment())
            .withGasLimit(3000000)
            .withChainID(network.ChainID)
            .withSender(alice.address);
        let decrementInteraction = (<Interaction>contract.methods.decrement())
            .withGasLimit(3000000)
            .withChainID(network.ChainID)
            .withSender(alice.address);

        // Query "get()"

        let interactionQuery = incrementInteraction.buildQuery();
        let response = await controller.query(
            new SmartContractQueryInput({
                contract: interactionQuery.address,
                arguments: interactionQuery.getEncodedArguments(),
                function: interactionQuery.func.toString(),
                caller: interactionQuery.caller,
                value: BigInt(interactionQuery.value.toString()),
            }),
        );
        assert.deepEqual(response[0]!.valueOf(), new BigNumber(1));

        // Increment, wait for execution.
        let incrementTransaction = incrementInteraction.useThenIncrementNonceOf(alice.account).buildTransaction();
        await signTransaction({ transaction: incrementTransaction, wallet: alice });

        hash = await provider.sendTransaction(incrementTransaction);
        responseExecute = await controller.awaitCompletedExecute(hash);
        assert.isTrue(responseExecute.returnCode == "ok");
        assert.deepEqual(responseExecute.values[0], new BigNumber(2));

        // Decrement twice. Wait for execution of the second transaction.
        let decrementTransaction = decrementInteraction.useThenIncrementNonceOf(alice.account).buildTransaction();
        await signTransaction({ transaction: decrementTransaction, wallet: alice });
        await provider.sendTransaction(decrementTransaction);

        decrementTransaction = decrementInteraction.useThenIncrementNonceOf(alice.account).buildTransaction();

        await signTransaction({ transaction: decrementTransaction, wallet: alice });
        hash = await provider.sendTransaction(decrementTransaction);
        responseExecute = await controller.awaitCompletedExecute(hash);
        assert.isTrue(responseExecute.returnCode == "ok");
        assert.deepEqual(responseExecute.values[0], new BigNumber(0));
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
        const parser = new SmartContractTransactionsOutcomeParser();

        const bytecode = await promises.readFile("src/testdata/counter.wasm");

        const deployTransaction = factory.createTransactionForDeploy(alice.address, {
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
                return await provider.getTransaction(hash);
            },
        });

        const deployTxHash = await provider.sendTransaction(deployTransaction);
        let transactionOnNetwork = await transactionCompletionAwaiter.awaitCompleted(deployTxHash);
        let response = parser.parseExecute({ transactionOnNetwork });
        assert.isTrue(response.returnCode == "ok");

        const queryController = new SmartContractController({
            chainID: "localnet",
            networkProvider: provider,
            abi: abiRegistry,
        });

        let incrementTransaction = factory.createTransactionForExecute(alice.address, {
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
            contract: contractAddress,
            function: "get",
            arguments: [],
        });
        const queryResponse = await queryController.runQuery(query);
        const parsed = queryController.parseQueryResponse(queryResponse);
        assert.deepEqual(parsed[0], new BigNumber(1));

        const incrementTxHash = await provider.sendTransaction(incrementTransaction);
        transactionOnNetwork = await transactionCompletionAwaiter.awaitCompleted(incrementTxHash);

        response = parser.parseExecute({ transactionOnNetwork });
        assert.deepEqual(response.values[0], new BigNumber(2));

        let decrementTransaction = factory.createTransactionForExecute(alice.address, {
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
        response = parser.parseExecute({ transactionOnNetwork });
    });

    it("should interact with 'lottery-esdt' (local testnet)", async function () {
        this.timeout(140000);

        let abiRegistry = await loadAbiRegistry("src/testdata/lottery-esdt.abi.json");
        let contract = new SmartContract({ abi: abiRegistry });
        let controller = new SmartContractController({
            chainID: "localnet",
            networkProvider: provider,
            abi: abiRegistry,
        });

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

        const deployTxHash = await provider.sendTransaction(deployTransaction);
        let parsedResponse = await controller.awaitCompletedDeploy(deployTxHash);

        assert.isTrue(parsedResponse.returnCode == "ok");

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
        const startTxHash = await provider.sendTransaction(startTransaction);
        let response = await controller.awaitCompletedExecute(startTxHash);
        assert.isTrue(response.returnCode == "ok");
        assert.lengthOf(response.values, 0);

        // status()
        let lotteryStatusTransaction = lotteryStatusInteraction
            .withSender(alice.address)
            .useThenIncrementNonceOf(alice.account)
            .buildTransaction();

        await signTransaction({ transaction: lotteryStatusTransaction, wallet: alice });
        const lotteryStatusTxHash = await provider.sendTransaction(lotteryStatusTransaction);
        response = await controller.awaitCompletedExecute(lotteryStatusTxHash);
        assert.isTrue(response.returnCode == "ok");
        assert.lengthOf(response.values, 1);
        assert.equal(response.values[0].name, "Running");

        // lotteryInfo() (this is a view function, but for the sake of the test, we'll execute it)
        let lotteryInfoTransaction = getLotteryInfoInteraction
            .withSender(alice.address)
            .useThenIncrementNonceOf(alice.account)
            .buildTransaction();

        await signTransaction({ transaction: lotteryInfoTransaction, wallet: alice });
        const lotteryInfoTxHash = await provider.sendTransaction(lotteryInfoTransaction);
        response = await controller.awaitCompletedExecute(lotteryInfoTxHash);
        assert.isTrue(response.returnCode == "ok");
        assert.lengthOf(response.values, 1);

        // Ignore "deadline" field in our test
        let info = response.values[0].valueOf();
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
        let parser = new SmartContractTransactionsOutcomeParser();

        let network = await provider.getNetworkConfig();
        await alice.sync(provider);

        const config = new TransactionsFactoryConfig({ chainID: network.ChainID });
        const factory = new SmartContractTransactionsFactory({
            config: config,
            abi: abiRegistry,
        });

        const bytecode = await promises.readFile("src/testdata/lottery-esdt.wasm");

        // Deploy the contract
        const deployTransaction = factory.createTransactionForDeploy(alice.address, {
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
                return await provider.getTransaction(hash);
            },
        });

        const deployTxHash = await provider.sendTransaction(deployTransaction);
        let transactionOnNetwork = await transactionCompletionAwaiter.awaitCompleted(deployTxHash);
        const deployResponse = parser.parseDeploy({ transactionOnNetwork });
        assert.isTrue(deployResponse.returnCode == "ok");

        // start()
        let startTransaction = factory.createTransactionForExecute(alice.address, {
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
        let response = parser.parseExecute({ transactionOnNetwork });
        assert.isTrue(response.returnCode == "ok");
        assert.lengthOf(response.values, 0);

        // status()
        let lotteryStatusTransaction = factory.createTransactionForExecute(alice.address, {
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
        response = parser.parseExecute({ transactionOnNetwork });
        assert.isTrue(response.returnCode == "ok");
        assert.lengthOf(response.values, 0);
        assert.equal(response.values[0].name, "Running");

        // getlotteryInfo() (this is a view function, but for the sake of the test, we'll execute it)
        let lotteryInfoTransaction = factory.createTransactionForExecute(alice.address, {
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
        response = parser.parseExecute({ transactionOnNetwork });
        assert.isTrue(response.returnCode == "ok");
        assert.lengthOf(response.values, 0);

        // Ignore "deadline" field in our test
        let info = response.values[0]!.valueOf();
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
