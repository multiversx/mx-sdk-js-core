import { assert } from "chai";
import { promises } from "fs";
import { QueryRunnerAdapter } from "../adapters/queryRunnerAdapter";
import { Logger } from "../logger";
import { SmartContractQueriesController } from "../smartContractQueriesController";
import { prepareDeployment } from "../testutils";
import { createLocalnetProvider } from "../testutils/networkProviders";
import { loadTestWallets, TestWallet } from "../testutils/wallets";
import { TransactionComputer } from "../transactionComputer";
import { SmartContractTransactionsFactory } from "../transactionsFactories/smartContractTransactionsFactory";
import { TransactionsFactoryConfig } from "../transactionsFactories/transactionsFactoryConfig";
import { TransactionWatcher } from "../transactionWatcher";
import { decodeUnsignedNumber } from "./codec";
import { ContractFunction } from "./function";
import { ResultsParser } from "./resultsParser";
import { SmartContract } from "./smartContract";
import { AddressValue, BigUIntValue, OptionalValue, OptionValue, TokenIdentifierValue, U32Value } from "./typesystem";
import { BytesValue } from "./typesystem/bytes";

describe("test on local testnet", function () {
    let alice: TestWallet, bob: TestWallet, carol: TestWallet;
    let provider = createLocalnetProvider();
    let watcher: TransactionWatcher;
    let resultsParser = new ResultsParser();

    before(async function () {
        ({ alice, bob, carol } = await loadTestWallets());

        watcher = new TransactionWatcher({
            getTransaction: async (hash: string) => {
                return await provider.getTransaction(hash, true);
            },
        });
    });

    it("counter: should deploy, then simulate transactions", async function () {
        this.timeout(60000);

        TransactionWatcher.DefaultPollingInterval = 5000;
        TransactionWatcher.DefaultTimeout = 50000;

        let network = await provider.getNetworkConfig();
        await alice.sync(provider);

        // Deploy
        let contract = new SmartContract({});

        let transactionDeploy = await prepareDeployment({
            contract: contract,
            deployer: alice,
            codePath: "src/testdata/counter.wasm",
            gasLimit: 3000000,
            initArguments: [],
            chainID: network.ChainID,
        });

        // ++
        let transactionIncrement = contract.call({
            func: new ContractFunction("increment"),
            gasLimit: 3000000,
            chainID: network.ChainID,
            caller: alice.address,
        });
        transactionIncrement.setNonce(alice.account.nonce);
        transactionIncrement.applySignature(await alice.signer.sign(transactionIncrement.serializeForSigning()));

        alice.account.incrementNonce();

        // Now, let's build a few transactions, to be simulated
        let simulateOne = contract.call({
            func: new ContractFunction("increment"),
            gasLimit: 100000,
            chainID: network.ChainID,
            caller: alice.address,
        });
        simulateOne.setSender(alice.address);

        let simulateTwo = contract.call({
            func: new ContractFunction("foobar"),
            gasLimit: 500000,
            chainID: network.ChainID,
            caller: alice.address,
        });
        simulateTwo.setSender(alice.address);

        simulateOne.setNonce(alice.account.nonce);
        simulateTwo.setNonce(alice.account.nonce);

        simulateOne.applySignature(await alice.signer.sign(simulateOne.serializeForSigning()));
        simulateTwo.applySignature(await alice.signer.sign(simulateTwo.serializeForSigning()));

        // Broadcast & execute
        const txHashDeploy = await provider.sendTransaction(transactionDeploy);
        const txHashIncrement = await provider.sendTransaction(transactionIncrement);

        await watcher.awaitCompleted(txHashDeploy);
        let transactionOnNetwork = await provider.getTransaction(txHashDeploy);
        let bundle = resultsParser.parseUntypedOutcome(transactionOnNetwork);
        assert.isTrue(bundle.returnCode.isSuccess());

        await watcher.awaitCompleted(txHashIncrement);
        transactionOnNetwork = await provider.getTransaction(txHashIncrement);
        bundle = resultsParser.parseUntypedOutcome(transactionOnNetwork);
        assert.isTrue(bundle.returnCode.isSuccess());

        // Simulate
        Logger.trace(JSON.stringify(await provider.simulateTransaction(simulateOne), null, 4));
        Logger.trace(JSON.stringify(await provider.simulateTransaction(simulateTwo), null, 4));
    });

    it("counter: should deploy, then simulate transactions using SmartContractTransactionsFactory", async function () {
        this.timeout(60000);

        TransactionWatcher.DefaultPollingInterval = 5000;
        TransactionWatcher.DefaultTimeout = 50000;

        let network = await provider.getNetworkConfig();
        await alice.sync(provider);

        const config = new TransactionsFactoryConfig({ chainID: network.ChainID });
        const factory = new SmartContractTransactionsFactory({ config: config });

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

        const smartContractCallTransaction = factory.createTransactionForExecute({
            sender: alice.address,
            contract: contractAddress,
            function: "increment",
            gasLimit: 3000000n,
        });
        smartContractCallTransaction.nonce = BigInt(alice.account.nonce.valueOf());
        smartContractCallTransaction.signature = await alice.signer.sign(
            Buffer.from(transactionComputer.computeBytesForSigning(smartContractCallTransaction)),
        );

        alice.account.incrementNonce();

        const simulateOne = factory.createTransactionForExecute({
            sender: alice.address,
            function: "increment",
            contract: contractAddress,
            gasLimit: 100000n,
        });

        simulateOne.nonce = BigInt(alice.account.nonce.valueOf());
        simulateOne.signature = await alice.signer.sign(
            Buffer.from(transactionComputer.computeBytesForSigning(simulateOne)),
        );

        alice.account.incrementNonce();

        const simulateTwo = factory.createTransactionForExecute({
            sender: alice.address,
            function: "foobar",
            contract: contractAddress,
            gasLimit: 500000n,
        });

        simulateTwo.nonce = BigInt(alice.account.nonce.valueOf());
        simulateTwo.signature = await alice.signer.sign(
            Buffer.from(transactionComputer.computeBytesForSigning(simulateTwo)),
        );

        alice.account.incrementNonce();

        // Broadcast & execute
        const deployTxHash = await provider.sendTransaction(deployTransaction);
        const callTxHash = await provider.sendTransaction(smartContractCallTransaction);

        await watcher.awaitCompleted(deployTxHash);
        let transactionOnNetwork = await provider.getTransaction(deployTxHash);
        let bundle = resultsParser.parseUntypedOutcome(transactionOnNetwork);
        assert.isTrue(bundle.returnCode.isSuccess());

        await watcher.awaitCompleted(callTxHash);
        transactionOnNetwork = await provider.getTransaction(callTxHash);
        bundle = resultsParser.parseUntypedOutcome(transactionOnNetwork);
        assert.isTrue(bundle.returnCode.isSuccess());

        // Simulate
        Logger.trace(JSON.stringify(await provider.simulateTransaction(simulateOne), null, 4));
        Logger.trace(JSON.stringify(await provider.simulateTransaction(simulateTwo), null, 4));
    });

    it("counter: should deploy, call and query contract", async function () {
        this.timeout(80000);

        TransactionWatcher.DefaultPollingInterval = 5000;
        TransactionWatcher.DefaultTimeout = 50000;

        let network = await provider.getNetworkConfig();
        await alice.sync(provider);

        // Deploy
        let contract = new SmartContract({});

        let transactionDeploy = await prepareDeployment({
            contract: contract,
            deployer: alice,
            codePath: "src/testdata/counter.wasm",
            gasLimit: 3000000,
            initArguments: [],
            chainID: network.ChainID,
        });

        // ++
        let transactionIncrementFirst = contract.call({
            func: new ContractFunction("increment"),
            gasLimit: 2000000,
            chainID: network.ChainID,
            caller: alice.address,
        });
        transactionIncrementFirst.setNonce(alice.account.nonce);
        transactionIncrementFirst.applySignature(
            await alice.signer.sign(transactionIncrementFirst.serializeForSigning()),
        );

        alice.account.incrementNonce();

        // ++
        let transactionIncrementSecond = contract.call({
            func: new ContractFunction("increment"),
            gasLimit: 2000000,
            chainID: network.ChainID,
            caller: alice.address,
        });
        transactionIncrementSecond.setNonce(alice.account.nonce);
        transactionIncrementSecond.applySignature(
            await alice.signer.sign(transactionIncrementSecond.serializeForSigning()),
        );

        alice.account.incrementNonce();

        // Broadcast & execute
        await provider.sendTransaction(transactionDeploy);
        await provider.sendTransaction(transactionIncrementFirst);
        await provider.sendTransaction(transactionIncrementSecond);

        await watcher.awaitCompleted(transactionDeploy.getHash().hex());
        await watcher.awaitCompleted(transactionIncrementFirst.getHash().hex());
        await watcher.awaitCompleted(transactionIncrementSecond.getHash().hex());

        // Check counter
        let query = contract.createQuery({ func: new ContractFunction("get") });
        let queryResponse = await provider.queryContract(query);
        assert.lengthOf(queryResponse.getReturnDataParts(), 1);
        assert.equal(3, decodeUnsignedNumber(queryResponse.getReturnDataParts()[0]));
    });

    it("counter: should deploy, call and query contract using SmartContractTransactionsFactory", async function () {
        this.timeout(80000);

        TransactionWatcher.DefaultPollingInterval = 5000;
        TransactionWatcher.DefaultTimeout = 50000;

        let network = await provider.getNetworkConfig();
        await alice.sync(provider);

        const config = new TransactionsFactoryConfig({ chainID: network.ChainID });
        const factory = new SmartContractTransactionsFactory({ config: config });

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

        const firstScCallTransaction = factory.createTransactionForExecute({
            sender: alice.address,
            contract: contractAddress,
            function: "increment",
            gasLimit: 3000000n,
        });
        firstScCallTransaction.nonce = BigInt(alice.account.nonce.valueOf());
        firstScCallTransaction.signature = await alice.signer.sign(
            Buffer.from(transactionComputer.computeBytesForSigning(firstScCallTransaction)),
        );

        alice.account.incrementNonce();

        const secondScCallTransaction = factory.createTransactionForExecute({
            sender: alice.address,
            contract: contractAddress,
            function: "increment",
            gasLimit: 3000000n,
        });
        secondScCallTransaction.nonce = BigInt(alice.account.nonce.valueOf());
        secondScCallTransaction.signature = await alice.signer.sign(
            Buffer.from(transactionComputer.computeBytesForSigning(secondScCallTransaction)),
        );

        alice.account.incrementNonce();

        // Broadcast & execute
        const deployTxHash = await provider.sendTransaction(deployTransaction);
        const firstScCallHash = await provider.sendTransaction(firstScCallTransaction);
        const secondScCallHash = await provider.sendTransaction(secondScCallTransaction);

        await watcher.awaitCompleted(deployTxHash);
        await watcher.awaitCompleted(firstScCallHash);
        await watcher.awaitCompleted(secondScCallHash);

        // Check counter
        const queryRunner = new QueryRunnerAdapter({ networkProvider: provider });
        const smartContractQueriesController = new SmartContractQueriesController({ queryRunner: queryRunner });

        const query = smartContractQueriesController.createQuery({
            contract: contractAddress.bech32(),
            function: "get",
            arguments: [],
        });

        const queryResponse = await smartContractQueriesController.runQuery(query);
        assert.lengthOf(queryResponse.returnDataParts, 1);
        assert.equal(3, decodeUnsignedNumber(Buffer.from(queryResponse.returnDataParts[0])));
    });

    it("erc20: should deploy, call and query contract", async function () {
        this.timeout(60000);

        TransactionWatcher.DefaultPollingInterval = 5000;
        TransactionWatcher.DefaultTimeout = 50000;

        let network = await provider.getNetworkConfig();
        await alice.sync(provider);

        // Deploy
        let contract = new SmartContract({});

        let transactionDeploy = await prepareDeployment({
            contract: contract,
            deployer: alice,
            codePath: "src/testdata/erc20.wasm",
            gasLimit: 50000000,
            initArguments: [new U32Value(10000)],
            chainID: network.ChainID,
        });

        // Minting
        let transactionMintBob = contract.call({
            func: new ContractFunction("transferToken"),
            gasLimit: 9000000,
            args: [new AddressValue(bob.address), new U32Value(1000)],
            chainID: network.ChainID,
            caller: alice.address,
        });

        let transactionMintCarol = contract.call({
            func: new ContractFunction("transferToken"),
            gasLimit: 9000000,
            args: [new AddressValue(carol.address), new U32Value(1500)],
            chainID: network.ChainID,
            caller: alice.address,
        });

        // Apply nonces and sign the remaining transactions
        transactionMintBob.setNonce(alice.account.nonce);
        alice.account.incrementNonce();
        transactionMintCarol.setNonce(alice.account.nonce);
        alice.account.incrementNonce();

        transactionMintBob.applySignature(await alice.signer.sign(transactionMintBob.serializeForSigning()));
        transactionMintCarol.applySignature(await alice.signer.sign(transactionMintCarol.serializeForSigning()));

        // Broadcast & execute
        await provider.sendTransaction(transactionDeploy);
        await provider.sendTransaction(transactionMintBob);
        await provider.sendTransaction(transactionMintCarol);

        await watcher.awaitCompleted(transactionDeploy.getHash().hex());
        await watcher.awaitCompleted(transactionMintBob.getHash().hex());
        await watcher.awaitCompleted(transactionMintCarol.getHash().hex());

        // Query state, do some assertions
        let query = contract.createQuery({ func: new ContractFunction("totalSupply") });
        let queryResponse = await provider.queryContract(query);
        assert.lengthOf(queryResponse.getReturnDataParts(), 1);
        assert.equal(10000, decodeUnsignedNumber(queryResponse.getReturnDataParts()[0]));

        query = contract.createQuery({
            func: new ContractFunction("balanceOf"),
            args: [new AddressValue(alice.address)],
        });
        queryResponse = await provider.queryContract(query);

        assert.equal(7500, decodeUnsignedNumber(queryResponse.getReturnDataParts()[0]));

        query = contract.createQuery({
            func: new ContractFunction("balanceOf"),
            args: [new AddressValue(bob.address)],
        });
        queryResponse = await provider.queryContract(query);

        assert.equal(1000, decodeUnsignedNumber(queryResponse.getReturnDataParts()[0]));

        query = contract.createQuery({
            func: new ContractFunction("balanceOf"),
            args: [new AddressValue(carol.address)],
        });
        queryResponse = await provider.queryContract(query);

        assert.equal(1500, decodeUnsignedNumber(queryResponse.getReturnDataParts()[0]));
    });

    it("erc20: should deploy, call and query contract using SmartContractTransactionsFactory", async function () {
        this.timeout(60000);

        TransactionWatcher.DefaultPollingInterval = 5000;
        TransactionWatcher.DefaultTimeout = 50000;

        let network = await provider.getNetworkConfig();
        await alice.sync(provider);

        const config = new TransactionsFactoryConfig({ chainID: network.ChainID });
        const factory = new SmartContractTransactionsFactory({ config: config });

        const bytecode = await promises.readFile("src/testdata/erc20.wasm");

        const deployTransaction = factory.createTransactionForDeploy({
            sender: alice.address,
            bytecode: bytecode,
            gasLimit: 50000000n,
            arguments: [new U32Value(10000)],
        });
        deployTransaction.nonce = BigInt(alice.account.nonce.valueOf());
        const transactionComputer = new TransactionComputer();
        deployTransaction.signature = await alice.signer.sign(
            Buffer.from(transactionComputer.computeBytesForSigning(deployTransaction)),
        );

        const contractAddress = SmartContract.computeAddress(alice.address, alice.account.nonce);
        alice.account.incrementNonce();

        const transactionMintBob = factory.createTransactionForExecute({
            sender: alice.address,
            contract: contractAddress,
            function: "transferToken",
            gasLimit: 9000000n,
            arguments: [new AddressValue(bob.address), new U32Value(1000)],
        });
        transactionMintBob.nonce = BigInt(alice.account.nonce.valueOf());
        transactionMintBob.signature = await alice.signer.sign(
            Buffer.from(transactionComputer.computeBytesForSigning(transactionMintBob)),
        );

        alice.account.incrementNonce();

        const transactionMintCarol = factory.createTransactionForExecute({
            sender: alice.address,
            contract: contractAddress,
            function: "transferToken",
            gasLimit: 9000000n,
            arguments: [new AddressValue(carol.address), new U32Value(1500)],
        });
        transactionMintCarol.nonce = BigInt(alice.account.nonce.valueOf());
        transactionMintCarol.signature = await alice.signer.sign(
            Buffer.from(transactionComputer.computeBytesForSigning(transactionMintCarol)),
        );

        alice.account.incrementNonce();

        // Broadcast & execute
        const deployTxHash = await provider.sendTransaction(deployTransaction);
        const mintBobTxHash = await provider.sendTransaction(transactionMintBob);
        const mintCarolTxHash = await provider.sendTransaction(transactionMintCarol);

        await watcher.awaitCompleted(deployTxHash);
        await watcher.awaitCompleted(mintBobTxHash);
        await watcher.awaitCompleted(mintCarolTxHash);

        // Query state, do some assertions
        const queryRunner = new QueryRunnerAdapter({ networkProvider: provider });
        const smartContractQueriesController = new SmartContractQueriesController({ queryRunner: queryRunner });

        let query = smartContractQueriesController.createQuery({
            contract: contractAddress.bech32(),
            function: "totalSupply",
            arguments: [],
        });
        let queryResponse = await smartContractQueriesController.runQuery(query);
        assert.lengthOf(queryResponse.returnDataParts, 1);
        assert.equal(10000, decodeUnsignedNumber(Buffer.from(queryResponse.returnDataParts[0])));

        query = smartContractQueriesController.createQuery({
            contract: contractAddress.bech32(),
            function: "balanceOf",
            arguments: [new AddressValue(alice.address)],
        });
        queryResponse = await smartContractQueriesController.runQuery(query);
        assert.equal(7500, decodeUnsignedNumber(Buffer.from(queryResponse.returnDataParts[0])));

        query = smartContractQueriesController.createQuery({
            contract: contractAddress.bech32(),
            function: "balanceOf",
            arguments: [new AddressValue(bob.address)],
        });
        queryResponse = await smartContractQueriesController.runQuery(query);
        assert.equal(1000, decodeUnsignedNumber(Buffer.from(queryResponse.returnDataParts[0])));

        query = smartContractQueriesController.createQuery({
            contract: contractAddress.bech32(),
            function: "balanceOf",
            arguments: [new AddressValue(carol.address)],
        });
        queryResponse = await smartContractQueriesController.runQuery(query);
        assert.equal(1500, decodeUnsignedNumber(Buffer.from(queryResponse.returnDataParts[0])));
    });

    it("lottery: should deploy, call and query contract", async function () {
        this.timeout(60000);

        TransactionWatcher.DefaultPollingInterval = 5000;
        TransactionWatcher.DefaultTimeout = 50000;

        let network = await provider.getNetworkConfig();
        await alice.sync(provider);

        // Deploy
        let contract = new SmartContract({});

        let transactionDeploy = await prepareDeployment({
            contract: contract,
            deployer: alice,
            codePath: "src/testdata/lottery-esdt.wasm",
            gasLimit: 50000000,
            initArguments: [],
            chainID: network.ChainID,
        });

        // Start
        let transactionStart = contract.call({
            func: new ContractFunction("start"),
            gasLimit: 10000000,
            args: [
                BytesValue.fromUTF8("lucky"),
                new TokenIdentifierValue("EGLD"),
                new BigUIntValue(1),
                OptionValue.newMissing(),
                OptionValue.newMissing(),
                OptionValue.newProvided(new U32Value(1)),
                OptionValue.newMissing(),
                OptionValue.newMissing(),
                OptionalValue.newMissing(),
            ],
            chainID: network.ChainID,
            caller: alice.address,
        });
        // Apply nonces and sign the remaining transactions
        transactionStart.setNonce(alice.account.nonce);

        transactionStart.applySignature(await alice.signer.sign(transactionStart.serializeForSigning()));

        // Broadcast & execute
        await provider.sendTransaction(transactionDeploy);
        await provider.sendTransaction(transactionStart);

        await watcher.awaitAllEvents(transactionDeploy.getHash().hex(), ["SCDeploy"]);
        await watcher.awaitAnyEvent(transactionStart.getHash().hex(), ["completedTxEvent"]);

        // Let's check the SCRs
        let transactionOnNetwork = await provider.getTransaction(transactionDeploy.getHash().hex());
        let bundle = resultsParser.parseUntypedOutcome(transactionOnNetwork);
        assert.isTrue(bundle.returnCode.isSuccess());

        transactionOnNetwork = await provider.getTransaction(transactionStart.getHash().hex());
        bundle = resultsParser.parseUntypedOutcome(transactionOnNetwork);
        assert.isTrue(bundle.returnCode.isSuccess());

        // Query state, do some assertions
        let query = contract.createQuery({
            func: new ContractFunction("status"),
            args: [BytesValue.fromUTF8("lucky")],
        });
        let queryResponse = await provider.queryContract(query);
        assert.equal(decodeUnsignedNumber(queryResponse.getReturnDataParts()[0]), 1);

        query = contract.createQuery({
            func: new ContractFunction("status"),
            args: [BytesValue.fromUTF8("missingLottery")],
        });
        queryResponse = await provider.queryContract(query);
        assert.equal(decodeUnsignedNumber(queryResponse.getReturnDataParts()[0]), 0);
    });

    it("lottery: should deploy, call and query contract using SmartContractTransactionsFactory", async function () {
        this.timeout(60000);

        TransactionWatcher.DefaultPollingInterval = 5000;
        TransactionWatcher.DefaultTimeout = 50000;

        let network = await provider.getNetworkConfig();
        await alice.sync(provider);

        const config = new TransactionsFactoryConfig({ chainID: network.ChainID });
        const factory = new SmartContractTransactionsFactory({ config: config });

        const bytecode = await promises.readFile("src/testdata/lottery-esdt.wasm");

        const deployTransaction = factory.createTransactionForDeploy({
            sender: alice.address,
            bytecode: bytecode,
            gasLimit: 50000000n,
        });
        deployTransaction.nonce = BigInt(alice.account.nonce.valueOf());

        const transactionComputer = new TransactionComputer();
        deployTransaction.signature = await alice.signer.sign(
            Buffer.from(transactionComputer.computeBytesForSigning(deployTransaction)),
        );

        const contractAddress = SmartContract.computeAddress(alice.address, alice.account.nonce);
        alice.account.incrementNonce();

        const startTransaction = factory.createTransactionForExecute({
            sender: alice.address,
            contract: contractAddress,
            function: "start",
            gasLimit: 10000000n,
            arguments: [
                BytesValue.fromUTF8("lucky"),
                new TokenIdentifierValue("EGLD"),
                new BigUIntValue(1),
                OptionValue.newMissing(),
                OptionValue.newMissing(),
                OptionValue.newProvided(new U32Value(1)),
                OptionValue.newMissing(),
                OptionValue.newMissing(),
                OptionalValue.newMissing(),
            ],
        });
        startTransaction.nonce = BigInt(alice.account.nonce.valueOf());
        startTransaction.signature = await alice.signer.sign(
            Buffer.from(transactionComputer.computeBytesForSigning(startTransaction)),
        );

        alice.account.incrementNonce();

        // Broadcast & execute
        const deployTx = await provider.sendTransaction(deployTransaction);
        const startTx = await provider.sendTransaction(startTransaction);

        await watcher.awaitAllEvents(deployTx, ["SCDeploy"]);
        await watcher.awaitAnyEvent(startTx, ["completedTxEvent"]);

        // Let's check the SCRs
        let transactionOnNetwork = await provider.getTransaction(deployTx);
        let bundle = resultsParser.parseUntypedOutcome(transactionOnNetwork);
        assert.isTrue(bundle.returnCode.isSuccess());

        transactionOnNetwork = await provider.getTransaction(startTx);
        bundle = resultsParser.parseUntypedOutcome(transactionOnNetwork);
        assert.isTrue(bundle.returnCode.isSuccess());

        // Query state, do some assertions
        const queryRunner = new QueryRunnerAdapter({ networkProvider: provider });
        const smartContractQueriesController = new SmartContractQueriesController({ queryRunner: queryRunner });

        let query = smartContractQueriesController.createQuery({
            contract: contractAddress.bech32(),
            function: "status",
            arguments: [BytesValue.fromUTF8("lucky")],
        });
        let queryResponse = await smartContractQueriesController.runQuery(query);
        assert.equal(decodeUnsignedNumber(Buffer.from(queryResponse.returnDataParts[0])), 1);

        query = smartContractQueriesController.createQuery({
            contract: contractAddress.bech32(),
            function: "status",
            arguments: [BytesValue.fromUTF8("missingLottery")],
        });
        queryResponse = await smartContractQueriesController.runQuery(query);
        assert.equal(decodeUnsignedNumber(Buffer.from(queryResponse.returnDataParts[0])), 0);
    });
});
