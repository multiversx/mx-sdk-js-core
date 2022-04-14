import { loadTestWallets, prepareDeployment, TestWallet } from "../testutils";
import { TransactionWatcher } from "../transactionWatcher";
import { assert } from "chai";
import { SmartContract } from "./smartContract";
import { ContractFunction } from "./function";
import { ResultsParser } from "./resultsParser";
import { createLocalnetProvider } from "../testutils/networkProviders";

describe("fetch transactions from local testnet", function () {
    let provider = createLocalnetProvider();
    let watcher = new TransactionWatcher(provider);
    let alice: TestWallet;
    let resultsParser = new ResultsParser();

    before(async function () {
        ({ alice } = await loadTestWallets());
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
            chainID: network.ChainID
        });

        transactionIncrement.setNonce(alice.account.nonce);
        await alice.signer.sign(transactionIncrement);

        alice.account.incrementNonce();

        // Broadcast & execute
        await provider.sendTransaction(transactionDeploy);
        await provider.sendTransaction(transactionIncrement);

        await watcher.awaitCompleted(transactionDeploy);
        await watcher.awaitCompleted(transactionIncrement);

        let transactionOnNetworkDeploy = await provider.getTransaction(transactionDeploy.getHash().hex());
        let transactionOnNetworkIncrement = await provider.getTransaction(transactionIncrement.getHash().hex());

        let bundle = resultsParser.parseUntypedOutcome(transactionOnNetworkDeploy);
        assert.isTrue(bundle.returnCode.isSuccess());

        bundle = resultsParser.parseUntypedOutcome(transactionOnNetworkIncrement);
        assert.isTrue(bundle.returnCode.isSuccess());
    });
});
