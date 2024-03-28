import { assert } from "chai";
import { loadTestWallets, prepareDeployment, TestWallet } from "../testutils";
import { createLocalnetProvider } from "../testutils/networkProviders";
import { TransactionWatcher } from "../transactionWatcher";
import { ContractFunction } from "./function";
import { ResultsParser } from "./resultsParser";
import { SmartContract } from "./smartContract";

describe("fetch transactions from local testnet", function () {
    let alice: TestWallet;
    let provider = createLocalnetProvider();
    let watcher: TransactionWatcher;

    let resultsParser = new ResultsParser();

    before(async function () {
        ({ alice } = await loadTestWallets());
        watcher = new TransactionWatcher({
            getTransaction: async (hash: string) => { return await provider.getTransaction(hash, true) }
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

        // Broadcast & execute
        await provider.sendTransaction(transactionDeploy);
        await provider.sendTransaction(transactionIncrement);

        await watcher.awaitCompleted(transactionDeploy.getHash().hex());
        await watcher.awaitCompleted(transactionIncrement.getHash().hex());

        let transactionOnNetworkDeploy = await provider.getTransaction(transactionDeploy.getHash().hex());
        let transactionOnNetworkIncrement = await provider.getTransaction(transactionIncrement.getHash().hex());

        let bundle = resultsParser.parseUntypedOutcome(transactionOnNetworkDeploy);
        assert.isTrue(bundle.returnCode.isSuccess());

        bundle = resultsParser.parseUntypedOutcome(transactionOnNetworkIncrement);
        assert.isTrue(bundle.returnCode.isSuccess());
    });
});
