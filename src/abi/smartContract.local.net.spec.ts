import { assert } from "chai";
import { promises } from "fs";
import { Account } from "../accounts";
import { Logger } from "../core/logger";
import { TransactionsFactoryConfig } from "../core/transactionsFactoryConfig";
import { TransactionWatcher } from "../core/transactionWatcher";
import {
    SmartContractController,
    SmartContractTransactionsFactory,
    SmartContractTransactionsOutcomeParser,
} from "../smartContracts";
import { createLocalnetProvider } from "../testutils/networkProviders";
import { getTestWalletsPath, stringifyBigIntJSON } from "../testutils/utils";
import { decodeUnsignedNumber } from "./codec";
import { SmartContract } from "./smartContract";
import {
    AddressValue,
    BigUIntValue,
    BytesValue,
    OptionalValue,
    OptionValue,
    TokenIdentifierValue,
    U32Value,
} from "./typesystem";

describe("test on local testnet", function () {
    let alice: Account, bob: Account, carol: Account;
    let provider = createLocalnetProvider();
    let watcher: TransactionWatcher;
    let parser: SmartContractTransactionsOutcomeParser;

    before(async function () {
        alice = await Account.newFromPem(`${getTestWalletsPath()}/alice.pem`);
        bob = await Account.newFromPem(`${getTestWalletsPath()}/bob.pem`);
        carol = await Account.newFromPem(`${getTestWalletsPath()}/carol.pem`);

        watcher = new TransactionWatcher(
            {
                getTransaction: async (hash: string) => {
                    return await provider.getTransaction(hash);
                },
            },
            {
                pollingIntervalMilliseconds: 5000,
                timeoutMilliseconds: 50000,
            },
        );
        parser = new SmartContractTransactionsOutcomeParser();
    });

    it("counter: should deploy, then simulate transactions using SmartContractTransactionsFactory", async function () {
        this.timeout(60000);

        let network = await provider.getNetworkConfig();

        const config = new TransactionsFactoryConfig({ chainID: network.chainID });
        const factory = new SmartContractTransactionsFactory({ config: config });

        const bytecode = await promises.readFile("src/testdata/counter.wasm");
        alice.nonce = (await provider.getAccount(alice.address)).nonce;

        const deployTransaction = factory.createTransactionForDeploy(alice.address, {
            bytecode: bytecode,
            gasLimit: 4000000n,
        });
        deployTransaction.nonce = alice.nonce;

        deployTransaction.signature = await alice.signTransaction(deployTransaction);

        const contractAddress = SmartContract.computeAddress(alice.address, alice.nonce);

        const smartContractCallTransaction = factory.createTransactionForExecute(alice.address, {
            contract: contractAddress,
            function: "increment",
            gasLimit: 4000000n,
        });
        alice.incrementNonce();
        smartContractCallTransaction.nonce = alice.getNonceThenIncrement();
        smartContractCallTransaction.signature = await alice.signTransaction(smartContractCallTransaction);

        const simulateOne = factory.createTransactionForExecute(alice.address, {
            function: "increment",
            contract: contractAddress,
            gasLimit: 200000n,
        });
        simulateOne.nonce = alice.getNonceThenIncrement();
        simulateOne.signature = await alice.signTransaction(simulateOne);

        const simulateTwo = factory.createTransactionForExecute(alice.address, {
            function: "foobar",
            contract: contractAddress,
            gasLimit: 700000n,
        });
        simulateTwo.nonce = alice.getNonceThenIncrement();
        simulateTwo.signature = await alice.signTransaction(simulateTwo);

        const simulateThree = factory.createTransactionForExecute(alice.address, {
            function: "foobar",
            contract: contractAddress,
            gasLimit: 700000n,
        });
        simulateThree.nonce = alice.getNonceThenIncrement();
        simulateThree.signature = await alice.signTransaction(simulateThree);

        // Broadcast & execute
        const deployTxHash = await provider.sendTransaction(deployTransaction);
        const callTxHash = await provider.sendTransaction(smartContractCallTransaction);
        await watcher.awaitCompleted(deployTxHash);
        let transactionOnNetwork = await provider.getTransaction(deployTxHash);
        let response = parser.parseExecute({ transactionOnNetwork });

        assert.isTrue(response.returnCode == "ok");

        await watcher.awaitCompleted(callTxHash);
        transactionOnNetwork = await provider.getTransaction(callTxHash);
        response = parser.parseExecute({ transactionOnNetwork });
        assert.isTrue(response.returnCode == "ok");

        // Simulate
        Logger.trace(stringifyBigIntJSON(await provider.simulateTransaction(simulateOne)));
        Logger.trace(stringifyBigIntJSON(await provider.simulateTransaction(simulateTwo)));
    });

    it("counter: should deploy, call and query contract using SmartContractTransactionsFactory", async function () {
        this.timeout(80000);

        let network = await provider.getNetworkConfig();

        const config = new TransactionsFactoryConfig({ chainID: network.chainID });
        const factory = new SmartContractTransactionsFactory({ config: config });

        alice.nonce = (await provider.getAccount(alice.address)).nonce;
        const bytecode = await promises.readFile("src/testdata/counter.wasm");

        const deployTransaction = factory.createTransactionForDeploy(alice.address, {
            bytecode: bytecode,
            gasLimit: 3000000n,
        });
        deployTransaction.nonce = alice.nonce;

        deployTransaction.signature = await alice.signTransaction(deployTransaction);

        const contractAddress = SmartContract.computeAddress(alice.address, alice.nonce);
        alice.incrementNonce();
        const firstScCallTransaction = factory.createTransactionForExecute(alice.address, {
            contract: contractAddress,
            function: "increment",
            gasLimit: 3000000n,
        });
        firstScCallTransaction.nonce = alice.getNonceThenIncrement();
        firstScCallTransaction.signature = await alice.signTransaction(firstScCallTransaction);

        const secondScCallTransaction = factory.createTransactionForExecute(alice.address, {
            contract: contractAddress,
            function: "increment",
            gasLimit: 3000000n,
        });
        secondScCallTransaction.nonce = alice.getNonceThenIncrement();
        secondScCallTransaction.signature = await alice.signTransaction(secondScCallTransaction);

        // Broadcast & execute
        const deployTxHash = await provider.sendTransaction(deployTransaction);
        const firstScCallHash = await provider.sendTransaction(firstScCallTransaction);
        const secondScCallHash = await provider.sendTransaction(secondScCallTransaction);

        await watcher.awaitCompleted(deployTxHash);
        await watcher.awaitCompleted(firstScCallHash);
        await watcher.awaitCompleted(secondScCallHash);

        // Check counter
        const smartContractQueriesController = new SmartContractController({
            chainID: "localnet",
            networkProvider: provider,
        });

        const query = smartContractQueriesController.createQuery({
            contract: contractAddress,
            function: "get",
            arguments: [],
        });

        const queryResponse = await smartContractQueriesController.runQuery(query);
        assert.lengthOf(queryResponse.returnDataParts, 1);
        assert.equal(3, decodeUnsignedNumber(Buffer.from(queryResponse.returnDataParts[0])));
    });

    it("erc20: should deploy, call and query contract using SmartContractTransactionsFactory", async function () {
        this.timeout(60000);

        let network = await provider.getNetworkConfig();

        const config = new TransactionsFactoryConfig({ chainID: network.chainID });
        const factory = new SmartContractTransactionsFactory({ config: config });

        alice.nonce = (await provider.getAccount(alice.address)).nonce;
        const bytecode = await promises.readFile("src/testdata/erc20.wasm");

        const deployTransaction = factory.createTransactionForDeploy(alice.address, {
            bytecode: bytecode,
            gasLimit: 50000000n,
            arguments: [new U32Value(10000)],
        });
        deployTransaction.nonce = alice.nonce;
        deployTransaction.signature = await alice.signTransaction(deployTransaction);

        const contractAddress = SmartContract.computeAddress(alice.address, alice.nonce);
        alice.incrementNonce();
        const transactionMintBob = factory.createTransactionForExecute(alice.address, {
            contract: contractAddress,
            function: "transferToken",
            gasLimit: 9000000n,
            arguments: [new AddressValue(bob.address), new U32Value(1000)],
        });
        transactionMintBob.nonce = alice.getNonceThenIncrement();
        transactionMintBob.signature = await alice.signTransaction(transactionMintBob);

        const transactionMintCarol = factory.createTransactionForExecute(alice.address, {
            contract: contractAddress,
            function: "transferToken",
            gasLimit: 9000000n,
            arguments: [new AddressValue(carol.address), new U32Value(1500)],
        });
        transactionMintCarol.nonce = alice.getNonceThenIncrement();
        transactionMintCarol.signature = await alice.signTransaction(transactionMintCarol);

        // Broadcast & execute
        const deployTxHash = await provider.sendTransaction(deployTransaction);
        const mintBobTxHash = await provider.sendTransaction(transactionMintBob);
        const mintCarolTxHash = await provider.sendTransaction(transactionMintCarol);

        await watcher.awaitCompleted(deployTxHash);
        await watcher.awaitCompleted(mintBobTxHash);
        await watcher.awaitCompleted(mintCarolTxHash);

        // Query state, do some assertions
        const smartContractController = new SmartContractController({
            chainID: "localnet",
            networkProvider: provider,
        });

        let query = smartContractController.createQuery({
            contract: contractAddress,
            function: "totalSupply",
            arguments: [],
        });
        let queryResponse = await smartContractController.runQuery(query);
        assert.lengthOf(queryResponse.returnDataParts, 1);
        assert.equal(10000, decodeUnsignedNumber(Buffer.from(queryResponse.returnDataParts[0])));

        query = smartContractController.createQuery({
            contract: contractAddress,
            function: "balanceOf",
            arguments: [new AddressValue(alice.address)],
        });
        queryResponse = await smartContractController.runQuery(query);
        assert.equal(7500, decodeUnsignedNumber(Buffer.from(queryResponse.returnDataParts[0])));

        query = smartContractController.createQuery({
            contract: contractAddress,
            function: "balanceOf",
            arguments: [new AddressValue(bob.address)],
        });
        queryResponse = await smartContractController.runQuery(query);
        assert.equal(1000, decodeUnsignedNumber(Buffer.from(queryResponse.returnDataParts[0])));

        query = smartContractController.createQuery({
            contract: contractAddress,
            function: "balanceOf",
            arguments: [new AddressValue(carol.address)],
        });
        queryResponse = await smartContractController.runQuery(query);
        assert.equal(1500, decodeUnsignedNumber(Buffer.from(queryResponse.returnDataParts[0])));
    });

    it("lottery: should deploy, call and query contract using SmartContractTransactionsFactory", async function () {
        this.timeout(60000);
        let network = await provider.getNetworkConfig();
        alice.nonce = (await provider.getAccount(alice.address)).nonce;

        const config = new TransactionsFactoryConfig({ chainID: network.chainID });
        const factory = new SmartContractTransactionsFactory({ config: config });

        const bytecode = await promises.readFile("src/testdata/lottery-esdt.wasm");

        const deployTransaction = factory.createTransactionForDeploy(alice.address, {
            bytecode: bytecode,
            gasLimit: 50000000n,
        });
        deployTransaction.nonce = alice.nonce;

        deployTransaction.signature = await alice.signTransaction(deployTransaction);

        const contractAddress = SmartContract.computeAddress(alice.address, alice.nonce);
        alice.incrementNonce();
        const startTransaction = factory.createTransactionForExecute(alice.address, {
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
        startTransaction.nonce = alice.getNonceThenIncrement();
        startTransaction.signature = await alice.signTransaction(startTransaction);

        // Broadcast & execute
        const deployTx = await provider.sendTransaction(deployTransaction);
        const startTx = await provider.sendTransaction(startTransaction);

        await watcher.awaitAllEvents(deployTx, ["SCDeploy"]);
        await watcher.awaitAnyEvent(startTx, ["completedTxEvent"]);

        // Let's check the SCRs
        let transactionOnNetwork = await provider.getTransaction(deployTx);
        let response = parser.parseExecute({ transactionOnNetwork });
        assert.isTrue(response.returnCode == "ok");

        transactionOnNetwork = await provider.getTransaction(startTx);
        response = parser.parseExecute({ transactionOnNetwork });
        assert.isTrue(response.returnCode == "ok");

        // Query state, do some assertions
        const smartContractQueriesController = new SmartContractController({
            chainID: "localnet",
            networkProvider: provider,
        });

        let query = smartContractQueriesController.createQuery({
            contract: contractAddress,
            function: "status",
            arguments: [BytesValue.fromUTF8("lucky")],
        });
        let queryResponse = await smartContractQueriesController.runQuery(query);
        assert.equal(decodeUnsignedNumber(Buffer.from(queryResponse.returnDataParts[0])), 1);

        query = smartContractQueriesController.createQuery({
            contract: contractAddress,
            function: "status",
            arguments: [BytesValue.fromUTF8("missingLottery")],
        });
        queryResponse = await smartContractQueriesController.runQuery(query);
        assert.equal(decodeUnsignedNumber(Buffer.from(queryResponse.returnDataParts[0])), 0);
    });
});
