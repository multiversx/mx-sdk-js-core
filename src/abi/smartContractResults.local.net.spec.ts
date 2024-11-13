import { assert } from "chai";
import { loadTestWallets, prepareDeployment, TestWallet } from "../testutils";
import { createLocalnetProvider } from "../testutils/networkProviders";
import { TransactionWatcher } from "../transactionWatcher";
import { ContractFunction } from "./function";
import { ResultsParser } from "./resultsParser";
import { SmartContract } from "./smartContract";
import { TransactionsFactoryConfig } from "../transactionsFactories/transactionsFactoryConfig";
import { SmartContractTransactionsFactory } from "../transactionsFactories/smartContractTransactionsFactory";
import { promises } from "fs";
import { TransactionComputer } from "../transactionComputer";

describe("fetch transactions from local testnet", function () {
    let alice: TestWallet;
    let provider = createLocalnetProvider();
    let watcher: TransactionWatcher;

    let resultsParser = new ResultsParser();

    before(async function () {
        ({ alice } = await loadTestWallets());
        watcher = new TransactionWatcher({
            getTransaction: async (hash: string) => {
                return await provider.getTransaction(hash, true);
            },
        });
    });

    it("counter smart contract", async function () {
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

        // Broadcast & execute
        const txHashDeploy = await provider.sendTransaction(transactionDeploy);
        const txHashIncrement = await provider.sendTransaction(transactionIncrement);

        await watcher.awaitCompleted(txHashDeploy);
        await watcher.awaitCompleted(txHashIncrement);

        const transactionOnNetworkDeploy = await provider.getTransaction(txHashDeploy);
        const transactionOnNetworkIncrement = await provider.getTransaction(txHashIncrement);

        let bundle = resultsParser.parseUntypedOutcome(transactionOnNetworkDeploy);
        assert.isTrue(bundle.returnCode.isSuccess());

        bundle = resultsParser.parseUntypedOutcome(transactionOnNetworkIncrement);
        assert.isTrue(bundle.returnCode.isSuccess());
    });

    it("interact with counter smart contract using SmartContractTransactionsFactory", async function () {
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

        // Broadcast & execute
        const deployTxHash = await provider.sendTransaction(deployTransaction);
        const callTxHash = await provider.sendTransaction(smartContractCallTransaction);

        await watcher.awaitCompleted(deployTxHash);
        await watcher.awaitCompleted(callTxHash);

        let transactionOnNetworkDeploy = await provider.getTransaction(deployTxHash);
        let transactionOnNetworkIncrement = await provider.getTransaction(callTxHash);

        let bundle = resultsParser.parseUntypedOutcome(transactionOnNetworkDeploy);
        assert.isTrue(bundle.returnCode.isSuccess());

        bundle = resultsParser.parseUntypedOutcome(transactionOnNetworkIncrement);
        assert.isTrue(bundle.returnCode.isSuccess());
    });
});
