import BigNumber from "bignumber.js";
import { assert } from "chai";
import { promises } from "fs";
import { Account } from "../accounts";
import { Transaction } from "../core/transaction";
import { TransactionsFactoryConfig } from "../core/transactionsFactoryConfig";
import { TransactionWatcher } from "../core/transactionWatcher";
import {
    SmartContractController,
    SmartContractTransactionsFactory,
    SmartContractTransactionsOutcomeParser,
} from "../smartContracts";
import { loadAbiRegistry, prepareDeployment } from "../testutils";
import { createLocalnetProvider } from "../testutils/networkProviders";
import { getTestWalletsPath } from "../testutils/utils";
import { Interaction } from "./interaction";
import { SmartContract } from "./smartContract";
import { ManagedDecimalValue } from "./typesystem";
describe("test smart contract interactor", function () {
    let provider = createLocalnetProvider();
    let alice: Account;

    before(async function () {
        alice = await Account.newFromPem(`${getTestWalletsPath()}/alice.pem`);
    });

    it("should interact with 'answer' (local testnet) using the SmartContractTransactionsFactory", async function () {
        this.timeout(80000);

        let abi = await loadAbiRegistry("src/testdata/answer.abi.json");

        let network = await provider.getNetworkConfig();

        const config = new TransactionsFactoryConfig({ chainID: network.chainID });
        const factory = new SmartContractTransactionsFactory({
            config: config,
            abi: abi,
        });

        const bytecode = await promises.readFile("src/testdata/answer.wasm");
        alice.nonce = (await provider.getAccount(alice.address)).nonce;

        const deployTransaction = factory.createTransactionForDeploy(alice.address, {
            bytecode: bytecode,
            gasLimit: 3000000n,
        });
        deployTransaction.nonce = alice.nonce;

        deployTransaction.signature = await alice.signTransaction(deployTransaction);

        const contractAddress = SmartContract.computeAddress(alice.address, alice.nonce);

        const transactionCompletionAwaiter = new TransactionWatcher({
            getTransaction: async (hash: string) => {
                return await provider.getTransaction(hash);
            },
        });

        const deployTxHash = await provider.sendTransaction(deployTransaction);
        alice.incrementNonce();

        const queryController = new SmartContractController({
            chainID: "localnet",
            networkProvider: provider,
            abi: abi,
        });
        let transactionOnNetwork = await transactionCompletionAwaiter.awaitCompleted(deployTxHash);
        let response = queryController.parseDeploy(transactionOnNetwork);
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
        transaction.nonce = alice.getNonceThenIncrement();
        transaction.signature = await alice.signTransaction(transaction);

        await provider.sendTransaction(transaction);

        // Execute, and wait for execution
        transaction = factory.createTransactionForExecute(alice.address, {
            contract: contractAddress,
            function: "getUltimateAnswer",
            gasLimit: 3000000n,
        });
        transaction.nonce = alice.getNonceThenIncrement();
        transaction.signature = await alice.signTransaction(transaction);

        const executeTxHash = await provider.sendTransaction(transaction);
        transactionOnNetwork = await transactionCompletionAwaiter.awaitCompleted(executeTxHash);
        const executeResponse = queryController.parseExecute(transactionOnNetwork);

        assert.isTrue(executeResponse.values.length == 1);
        assert.deepEqual(executeResponse.values[0], new BigNumber(42));
        assert.isTrue(executeResponse.returnCode == "ok");
    });

    it("should interact with 'basic-features' (local testnet)", async function () {
        this.timeout(140000);

        let abi = await loadAbiRegistry("src/testdata/basic-features.abi.json");
        let contract = new SmartContract({ abi: abi });
        let controller = new SmartContractController({
            chainID: "localnet",
            networkProvider: provider,
            abi: abi,
        });

        let network = await provider.getNetworkConfig();
        alice.nonce = (await provider.getAccount(alice.address)).nonce;
        // Deploy the contract
        let deployTransaction = await prepareDeployment({
            contract: contract,
            deployer: alice,
            codePath: "src/testdata/basic-features.wasm",
            gasLimit: 600000000n,
            initArguments: [],
            chainID: network.chainID,
        });
        let deployTxHash = await provider.sendTransaction(deployTransaction);
        let deployResponse = await controller.awaitCompletedDeploy(deployTxHash);
        assert.isTrue(deployResponse.returnCode == "ok");

        let returnEgldInteraction = <Interaction>(
            contract.methods
                .returns_egld_decimal([])
                .withGasLimit(10000000n)
                .withChainID(network.chainID)
                .withSender(alice.address)
                .withValue(1n)
        );

        // returnEgld()
        let returnEgldTransaction = returnEgldInteraction
            .withSender(alice.address)
            .useThenIncrementNonceOf(alice)
            .buildTransaction();

        let additionInteraction = <Interaction>contract.methods
            .managed_decimal_addition([new ManagedDecimalValue("2.5", 2), new ManagedDecimalValue("2.7", 2)])
            .withGasLimit(10000000n)
            .withChainID(network.chainID)
            .withSender(alice.address)
            .withValue(0n);

        // addition()
        let additionTransaction = additionInteraction
            .withSender(alice.address)
            .useThenIncrementNonceOf(alice)
            .buildTransaction();

        // log
        let mdLnInteraction = <Interaction>contract.methods
            .managed_decimal_ln([new ManagedDecimalValue("23", 9)])
            .withGasLimit(10000000n)
            .withChainID(network.chainID)
            .withSender(alice.address)
            .withValue(0n);

        // mdLn()
        let mdLnTransaction = mdLnInteraction
            .withSender(alice.address)
            .useThenIncrementNonceOf(alice)
            .buildTransaction();

        let additionVarInteraction = <Interaction>contract.methods
            .managed_decimal_addition_var([
                new ManagedDecimalValue("4", 2, true),
                new ManagedDecimalValue("5", 2, true),
            ])
            .withGasLimit(50000000n)
            .withChainID(network.chainID)
            .withSender(alice.address)
            .withValue(0n);

        // addition()
        let additionVarTransaction = additionVarInteraction
            .withSender(alice.address)
            .useThenIncrementNonceOf(alice)
            .buildTransaction();

        let lnVarInteraction = <Interaction>contract.methods
            .managed_decimal_ln_var([new ManagedDecimalValue("23", 9, true)])
            .withGasLimit(50000000n)
            .withChainID(network.chainID)
            .withSender(alice.address)
            .withValue(0n);

        // managed_decimal_ln_var()
        let lnVarTransaction = lnVarInteraction
            .withSender(alice.address)
            .useThenIncrementNonceOf(alice)
            .buildTransaction();

        // returnEgld()
        await signTransaction({ transaction: returnEgldTransaction, wallet: alice });
        let txHash = await provider.sendTransaction(returnEgldTransaction);
        let response = await controller.awaitCompletedExecute(txHash);
        assert.isTrue(response.returnCode == "ok");
        assert.lengthOf(response.values, 1);
        assert.deepEqual(response.values[0], new BigNumber("0.000000000000000001"));

        // addition with const decimals()
        await signTransaction({ transaction: additionTransaction, wallet: alice });
        txHash = await provider.sendTransaction(additionTransaction);
        response = await controller.awaitCompletedExecute(txHash);
        assert.isTrue(response.returnCode == "ok");
        assert.lengthOf(response.values, 1);
        assert.deepEqual(response.values[0], new BigNumber("5.2"));

        // log
        await signTransaction({ transaction: mdLnTransaction, wallet: alice });
        txHash = await provider.sendTransaction(mdLnTransaction);
        response = await controller.awaitCompletedExecute(txHash);

        assert.isTrue(response.returnCode == "ok");
        assert.lengthOf(response.values, 1);
        assert.deepEqual(response.values[0], new BigNumber("3.135553845"));

        // addition with var decimals
        await signTransaction({ transaction: additionVarTransaction, wallet: alice });
        txHash = await provider.sendTransaction(additionVarTransaction);
        response = await controller.awaitCompletedExecute(txHash);
        assert.isTrue(response.returnCode == "ok");
        assert.lengthOf(response.values, 1);
        assert.deepEqual(response.values[0], new BigNumber("9"));

        // log
        await signTransaction({ transaction: lnVarTransaction, wallet: alice });
        txHash = await provider.sendTransaction(lnVarTransaction);
        response = await controller.awaitCompletedExecute(txHash);
        assert.isTrue(response.returnCode == "ok");
        assert.lengthOf(response.values, 1);
        assert.deepEqual(response.values[0], new BigNumber("3.135553845"));
    });

    it("should interact with 'counter' (local testnet) using the SmartContractTransactionsFactory", async function () {
        this.timeout(120000);

        let abi = await loadAbiRegistry("src/testdata/counter.abi.json");

        let network = await provider.getNetworkConfig();

        const config = new TransactionsFactoryConfig({ chainID: network.chainID });
        const factory = new SmartContractTransactionsFactory({
            config: config,
            abi: abi,
        });
        const parser = new SmartContractTransactionsOutcomeParser({ abi: abi });

        const bytecode = await promises.readFile("src/testdata/counter.wasm");
        alice.nonce = (await provider.getAccount(alice.address)).nonce;

        const deployTransaction = factory.createTransactionForDeploy(alice.address, {
            bytecode: bytecode,
            gasLimit: 3000000n,
        });
        deployTransaction.nonce = alice.nonce;

        deployTransaction.signature = await alice.signTransaction(deployTransaction);

        const contractAddress = SmartContract.computeAddress(alice.address, alice.nonce);

        const transactionCompletionAwaiter = new TransactionWatcher({
            getTransaction: async (hash: string) => {
                return await provider.getTransaction(hash);
            },
        });

        const deployTxHash = await provider.sendTransaction(deployTransaction);
        alice.incrementNonce();
        let transactionOnNetwork = await transactionCompletionAwaiter.awaitCompleted(deployTxHash);
        const deployResponse = parser.parseDeploy({ transactionOnNetwork });
        assert.isTrue(deployResponse.returnCode == "ok");

        const queryController = new SmartContractController({
            chainID: "localnet",
            networkProvider: provider,
            abi: abi,
        });

        let incrementTransaction = factory.createTransactionForExecute(alice.address, {
            contract: contractAddress,
            function: "increment",
            gasLimit: 3000000n,
        });
        incrementTransaction.nonce = alice.getNonceThenIncrement();

        incrementTransaction.signature = await alice.signTransaction(incrementTransaction);

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

        let response = parser.parseExecute({ transactionOnNetwork });
        assert.deepEqual(response.values[0], new BigNumber(2));

        let decrementTransaction = factory.createTransactionForExecute(alice.address, {
            contract: contractAddress,
            function: "decrement",
            gasLimit: 3000000n,
        });
        decrementTransaction.nonce = alice.getNonceThenIncrement();
        decrementTransaction.signature = await alice.signTransaction(decrementTransaction);

        await provider.sendTransaction(decrementTransaction);

        decrementTransaction.nonce = alice.nonce;
        decrementTransaction.signature = await alice.signTransaction(decrementTransaction);

        const decrementTxHash = await provider.sendTransaction(decrementTransaction);
        transactionOnNetwork = await transactionCompletionAwaiter.awaitCompleted(decrementTxHash);
        response = parser.parseExecute({ transactionOnNetwork });
    });

    it("should interact with 'lottery-esdt' (local testnet) using the SmartContractTransactionsFactory", async function () {
        this.timeout(140000);

        let abi = await loadAbiRegistry("src/testdata/lottery-esdt.abi.json");
        let parser = new SmartContractTransactionsOutcomeParser({ abi: abi });
        alice.nonce = (await provider.getAccount(alice.address)).nonce;

        let network = await provider.getNetworkConfig();

        const config = new TransactionsFactoryConfig({ chainID: network.chainID });
        const factory = new SmartContractTransactionsFactory({
            config: config,
            abi: abi,
        });

        const bytecode = await promises.readFile("src/testdata/lottery-esdt.wasm");

        // Deploy the contract
        const deployTransaction = factory.createTransactionForDeploy(alice.address, {
            bytecode: bytecode,
            gasLimit: 100000000n,
        });
        deployTransaction.nonce = alice.nonce;

        deployTransaction.signature = await alice.signTransaction(deployTransaction);

        const contractAddress = SmartContract.computeAddress(alice.address, alice.nonce);

        const transactionCompletionAwaiter = new TransactionWatcher({
            getTransaction: async (hash: string) => {
                return await provider.getTransaction(hash);
            },
        });

        const deployTxHash = await provider.sendTransaction(deployTransaction);
        alice.incrementNonce();
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
        startTransaction.nonce = alice.getNonceThenIncrement();
        startTransaction.signature = await alice.signTransaction(startTransaction);

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
        lotteryStatusTransaction.nonce = alice.getNonceThenIncrement();
        lotteryStatusTransaction.signature = await alice.signTransaction(lotteryStatusTransaction);

        const statusTxHash = await provider.sendTransaction(lotteryStatusTransaction);
        transactionOnNetwork = await transactionCompletionAwaiter.awaitCompleted(statusTxHash);
        response = parser.parseExecute({ transactionOnNetwork });
        assert.isTrue(response.returnCode == "ok");
        assert.lengthOf(response.values, 1);
        assert.equal(response.values[0].name, "Running");

        // getlotteryInfo() (this is a view function, but for the sake of the test, we'll execute it)
        let lotteryInfoTransaction = factory.createTransactionForExecute(alice.address, {
            contract: contractAddress,
            function: "getLotteryInfo",
            arguments: ["lucky"],
            gasLimit: 5000000n,
        });
        lotteryInfoTransaction.nonce = alice.getNonceThenIncrement();
        lotteryInfoTransaction.signature = await alice.signTransaction(lotteryInfoTransaction);

        const infoTxHash = await provider.sendTransaction(lotteryInfoTransaction);
        transactionOnNetwork = await transactionCompletionAwaiter.awaitCompleted(infoTxHash);
        response = parser.parseExecute({ transactionOnNetwork });
        assert.isTrue(response.returnCode == "ok");
        assert.lengthOf(response.values, 1);

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

    async function signTransaction(options: { transaction: Transaction; wallet: Account }) {
        const transaction = options.transaction;
        const wallet = options.wallet;

        transaction.signature = await wallet.signTransaction(transaction);
    }
});
