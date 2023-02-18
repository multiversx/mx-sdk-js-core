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

describe("test on local testnet", function () {
    let provider = createLocalnetProvider();
    let watcher = new TransactionWatcher(provider);
    let alice: TestWallet, bob: TestWallet, carol: TestWallet;
    let resultsParser = new ResultsParser();

    before(async function () {
        ({ alice, bob, carol } = await loadTestWallets());
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
            caller: alice.account.address,
            func: new ContractFunction("increment"),
            gasLimit: 3000000,
            chainID: network.ChainID
        });

        transactionIncrement.setNonce(alice.account.nonce);
        await alice.signer.sign(transactionIncrement);

        alice.account.incrementNonce();

        // Now, let's build a few transactions, to be simulated
        let simulateOne = contract.call({
            caller: alice.account.address,
            func: new ContractFunction("increment"),
            gasLimit: 100000,
            chainID: network.ChainID
        });

        let simulateTwo = contract.call({
            caller: alice.account.address,
            func: new ContractFunction("foobar"),
            gasLimit: 500000,
            chainID: network.ChainID
        });

        simulateOne.setNonce(alice.account.nonce);
        simulateTwo.setNonce(alice.account.nonce);

        await alice.signer.sign(simulateOne);
        await alice.signer.sign(simulateTwo);

        // Broadcast & execute
        await provider.sendTransaction(transactionDeploy);
        await provider.sendTransaction(transactionIncrement);

        await watcher.awaitCompleted(transactionDeploy);
        let transactionOnNetwork = await provider.getTransaction(transactionDeploy.getHash().hex());
        let bundle = resultsParser.parseUntypedOutcome(transactionOnNetwork);
        assert.isTrue(bundle.returnCode.isSuccess());

        await watcher.awaitCompleted(transactionIncrement);
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
            caller: alice.account.address,
            func: new ContractFunction("increment"),
            gasLimit: 2000000,
            chainID: network.ChainID
        });

        transactionIncrementFirst.setNonce(alice.account.nonce);
        await alice.signer.sign(transactionIncrementFirst);

        alice.account.incrementNonce();

        // ++
        let transactionIncrementSecond = contract.call({
            caller: alice.account.address,
            func: new ContractFunction("increment"),
            gasLimit: 2000000,
            chainID: network.ChainID
        });

        transactionIncrementSecond.setNonce(alice.account.nonce);
        await alice.signer.sign(transactionIncrementSecond);

        alice.account.incrementNonce();

        // Broadcast & execute
        await provider.sendTransaction(transactionDeploy);
        await provider.sendTransaction(transactionIncrementFirst);
        await provider.sendTransaction(transactionIncrementSecond);

        await watcher.awaitCompleted(transactionDeploy);
        await watcher.awaitCompleted(transactionIncrementFirst);
        await watcher.awaitCompleted(transactionIncrementSecond);

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
            caller: alice.account.address,
            func: new ContractFunction("transferToken"),
            gasLimit: 9000000,
            args: [new AddressValue(bob.address), new U32Value(1000)],
            chainID: network.ChainID
        });

        let transactionMintCarol = contract.call({
            caller: alice.account.address,
            func: new ContractFunction("transferToken"),
            gasLimit: 9000000,
            args: [new AddressValue(carol.address), new U32Value(1500)],
            chainID: network.ChainID
        });

        // Apply nonces and sign the remaining transactions
        transactionMintBob.setNonce(alice.account.nonce);
        alice.account.incrementNonce();
        transactionMintCarol.setNonce(alice.account.nonce);
        alice.account.incrementNonce();

        await alice.signer.sign(transactionMintBob);
        await alice.signer.sign(transactionMintCarol);

        // Broadcast & execute
        await provider.sendTransaction(transactionDeploy);
        await provider.sendTransaction(transactionMintBob);
        await provider.sendTransaction(transactionMintCarol);

        await watcher.awaitCompleted(transactionDeploy);
        await watcher.awaitCompleted(transactionMintBob);
        await watcher.awaitCompleted(transactionMintCarol);

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
            caller: alice.account.address,
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
            chainID: network.ChainID
        });

        // Apply nonces and sign the remaining transactions
        transactionStart.setNonce(alice.account.nonce);

        await alice.signer.sign(transactionStart);

        // Broadcast & execute
        await provider.sendTransaction(transactionDeploy);
        await provider.sendTransaction(transactionStart);

        await watcher.awaitAllEvents(transactionDeploy, ["SCDeploy"]);
        await watcher.awaitAnyEvent(transactionStart, ["completedTxEvent"]);

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
});
