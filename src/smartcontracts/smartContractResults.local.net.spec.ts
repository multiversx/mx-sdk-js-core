import { loadContractCode, loadTestWallets, TestWallet } from "../testutils";
import { TransactionWatcher } from "../transactionWatcher";
import { GasLimit } from "../networkParams";
import { assert } from "chai";
import { chooseProxyProvider } from "../interactive";
import { SmartContract } from "./smartContract";
import { ContractFunction } from "./function";
import { ResultsParser } from "./resultsParser";

describe("fetch transactions from local testnet", function () {
    let provider = chooseProxyProvider("local-testnet");
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
        let transactionDeploy = contract.deploy({
            code: await loadContractCode("src/testdata/counter.wasm"),
            gasLimit: new GasLimit(3000000),
            chainID: network.ChainID
        });

        transactionDeploy.setNonce(alice.account.nonce);
        await alice.signer.sign(transactionDeploy);

        alice.account.incrementNonce();

        // ++
        let transactionIncrement = contract.call({
            func: new ContractFunction("increment"),
            gasLimit: new GasLimit(3000000),
            chainID: network.ChainID
        });

        transactionIncrement.setNonce(alice.account.nonce);
        await alice.signer.sign(transactionIncrement);

        alice.account.incrementNonce();

        // Broadcast & execute
        await transactionDeploy.send(provider);
        await transactionIncrement.send(provider);

        await watcher.awaitCompleted(transactionDeploy);
        await watcher.awaitCompleted(transactionIncrement);

        let transactionOnNetworkDeploy = await provider.getTransaction(transactionDeploy.getHash());
        let transactionOnNetworkIncrement = await provider.getTransaction(transactionIncrement.getHash());

        let bundle = resultsParser.parseUntypedOutcome(transactionOnNetworkDeploy);
        assert.isTrue(bundle.returnCode.isSuccess());

        bundle = resultsParser.parseUntypedOutcome(transactionOnNetworkIncrement);
        assert.isTrue(bundle.returnCode.isSuccess());
    });
});
