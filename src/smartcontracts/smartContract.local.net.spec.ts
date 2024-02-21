import { assert } from "chai";
import { Logger } from "../logger";
import { prepareDeployment } from "../testutils";
import { createLocalnetProvider } from "../testutils/networkProviders";
import { loadTestWallets, TestWallet } from "../testutils/wallets";
import { TransactionWatcher } from "../transactionWatcher";
import { decodeUnsignedNumber } from "./codec";
import { ContractFunction } from "./function";
import { ResultsParser } from "./resultsParser";
import { SmartContract } from "./smartContract";
import { AddressValue, BigUIntValue, OptionalValue, OptionValue, TokenIdentifierValue, U32Value } from "./typesystem";
import { BytesValue } from "./typesystem/bytes";
import { TransactionsFactoryConfig } from "../transactionsFactories/transactionsFactoryConfig";
import { SmartContractTransactionsFactory } from "../transactionsFactories/smartContractTransactionsFactory";
import { TokenComputer } from "../tokens";
import { promises } from "fs";
import { TransactionComputer } from "../transaction";

describe("test on local testnet", function () {
    let alice: TestWallet, bob: TestWallet, carol: TestWallet;
    let provider = createLocalnetProvider();
    let watcher: TransactionWatcher;
    let resultsParser = new ResultsParser();

    before(async function () {
        ({ alice, bob, carol } = await loadTestWallets());

        watcher = new TransactionWatcher({
            getTransaction: async (hash: string) => { return await provider.getTransaction(hash, true) }
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
            chainID: network.ChainID
        });

        // ++
        let transactionIncrement = contract.call({
            func: new ContractFunction("increment"),
            gasLimit: 3000000,
            chainID: network.ChainID,
            caller: alice.address
        });
        transactionIncrement.setNonce(alice.account.nonce);
        transactionIncrement.applySignature(await alice.signer.sign(transactionIncrement.serializeForSigning()));

        alice.account.incrementNonce();

        // Now, let's build a few transactions, to be simulated
        let simulateOne = contract.call({
            func: new ContractFunction("increment"),
            gasLimit: 100000,
            chainID: network.ChainID,
            caller: alice.address
        });
        simulateOne.setSender(alice.address);

        let simulateTwo = contract.call({
            func: new ContractFunction("foobar"),
            gasLimit: 500000,
            chainID: network.ChainID,
            caller: alice.address
        });
        simulateTwo.setSender(alice.address);

        simulateOne.setNonce(alice.account.nonce);
        simulateTwo.setNonce(alice.account.nonce);

        simulateOne.applySignature(await alice.signer.sign(simulateOne.serializeForSigning()));
        simulateTwo.applySignature(await alice.signer.sign(simulateTwo.serializeForSigning()));

        // Broadcast & execute
        await provider.sendTransaction(transactionDeploy);
        await provider.sendTransaction(transactionIncrement);

        await watcher.awaitCompleted(transactionDeploy.getHash().hex());
        let transactionOnNetwork = await provider.getTransaction(transactionDeploy.getHash().hex());
        let bundle = resultsParser.parseUntypedOutcome(transactionOnNetwork);
        assert.isTrue(bundle.returnCode.isSuccess());

        await watcher.awaitCompleted(transactionIncrement.getHash().hex());
        transactionOnNetwork = await provider.getTransaction(transactionIncrement.getHash().hex());
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
            chainID: network.ChainID
        });

        // ++
        let transactionIncrementFirst = contract.call({
            func: new ContractFunction("increment"),
            gasLimit: 2000000,
            chainID: network.ChainID,
            caller: alice.address
        });
        transactionIncrementFirst.setNonce(alice.account.nonce);
        transactionIncrementFirst.applySignature(await alice.signer.sign(transactionIncrementFirst.serializeForSigning()));

        alice.account.incrementNonce();

        // ++
        let transactionIncrementSecond = contract.call({
            func: new ContractFunction("increment"),
            gasLimit: 2000000,
            chainID: network.ChainID,
            caller: alice.address
        });
        transactionIncrementSecond.setNonce(alice.account.nonce);
        transactionIncrementSecond.applySignature(await alice.signer.sign(transactionIncrementSecond.serializeForSigning()));

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
        assert.equal(3, decodeUnsignedNumber(queryResponse.getReturnDataParts()[0]));
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
            chainID: network.ChainID
        });

        // Minting
        let transactionMintBob = contract.call({
            func: new ContractFunction("transferToken"),
            gasLimit: 9000000,
            args: [new AddressValue(bob.address), new U32Value(1000)],
            chainID: network.ChainID,
            caller: alice.address
        });

        let transactionMintCarol = contract.call({
            func: new ContractFunction("transferToken"),
            gasLimit: 9000000,
            args: [new AddressValue(carol.address), new U32Value(1500)],
            chainID: network.ChainID,
            caller: alice.address
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
        assert.equal(10000, decodeUnsignedNumber(queryResponse.getReturnDataParts()[0]));

        query = contract.createQuery({
            func: new ContractFunction("balanceOf"),
            args: [new AddressValue(alice.address)]
        });
        queryResponse = await provider.queryContract(query);

        assert.equal(7500, decodeUnsignedNumber(queryResponse.getReturnDataParts()[0]));

        query = contract.createQuery({
            func: new ContractFunction("balanceOf"),
            args: [new AddressValue(bob.address)]
        });
        queryResponse = await provider.queryContract(query);

        assert.equal(1000, decodeUnsignedNumber(queryResponse.getReturnDataParts()[0]));

        query = contract.createQuery({
            func: new ContractFunction("balanceOf"),
            args: [new AddressValue(carol.address)]
        });
        queryResponse = await provider.queryContract(query);

        assert.equal(1500, decodeUnsignedNumber(queryResponse.getReturnDataParts()[0]));
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
            chainID: network.ChainID
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
                OptionalValue.newMissing()
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
            args: [
                BytesValue.fromUTF8("lucky")
            ]
        });
        let queryResponse = await provider.queryContract(query);
        assert.equal(decodeUnsignedNumber(queryResponse.getReturnDataParts()[0]), 1);

        query = contract.createQuery({
            func: new ContractFunction("status"),
            args: [
                BytesValue.fromUTF8("missingLottery")
            ]
        });
        queryResponse = await provider.queryContract(query);
        assert.equal(decodeUnsignedNumber(queryResponse.getReturnDataParts()[0]), 0);
    });

    it("counter: should deploy and call using the SmartContractFactory", async function () {
        this.timeout(80000);

        TransactionWatcher.DefaultPollingInterval = 5000;
        TransactionWatcher.DefaultTimeout = 50000;

        const network = await provider.getNetworkConfig();
        await alice.sync(provider);

        const transactionComputer = new TransactionComputer();
        const config = new TransactionsFactoryConfig({ chainID: network.ChainID });
        const factory = new SmartContractTransactionsFactory({ config: config, tokenComputer: new TokenComputer() });

        let bytecode = await promises.readFile("src/testdata/counter.wasm");

        const deployTransaction = factory.createTransactionForDeploy({
            sender: alice.address,
            bytecode: bytecode,
            gasLimit: 3000000n,
        });
        deployTransaction.nonce = BigInt(alice.account.nonce.valueOf());
        deployTransaction.signature = await alice.signer.sign(
            Buffer.from(transactionComputer.computeBytesForSigning(deployTransaction)),
        );

        const deployTxHash = await provider.sendTransaction(deployTransaction);
        await watcher.awaitCompleted(deployTxHash);

        const contractAddress = SmartContract.computeAddress(alice.address, alice.account.nonce);

        alice.account.incrementNonce();

        const smartContractCallTransaction = factory.createTransactionForExecute({
            sender: alice.address,
            contract: contractAddress,
            functionName: "increment",
            gasLimit: 2000000n,
        });
        smartContractCallTransaction.nonce = BigInt(alice.account.nonce.valueOf());
        smartContractCallTransaction.signature = await alice.signer.sign(
            Buffer.from(transactionComputer.computeBytesForSigning(smartContractCallTransaction)),
        );

        const scCallTxHash = await provider.sendTransaction(smartContractCallTransaction);
        await watcher.awaitCompleted(scCallTxHash);
    });
});
