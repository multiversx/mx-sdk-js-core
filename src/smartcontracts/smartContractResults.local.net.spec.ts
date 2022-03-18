import { NetworkConfig } from "../networkConfig";
import { loadContractCode, loadTestWallets, TestWallet } from "../testutils";
import { TransactionWatcher } from "../transactionWatcher";
import { GasLimit } from "../networkParams";
import { assert } from "chai";
import { chooseProxyProvider } from "../interactive";
import { SmartContract } from "./smartContract";
import { ContractFunction } from "./function";

describe("fetch transactions from local testnet", function () {
    let provider = chooseProxyProvider("local-testnet");;
    let alice: TestWallet;
    before(async function () {
        ({ alice } = await loadTestWallets());
    });

    it("counter smart contract", async function () {
        this.timeout(60000);

        TransactionWatcher.DefaultPollingInterval = 5000;
        TransactionWatcher.DefaultTimeout = 50000;

        await NetworkConfig.getDefault().sync(provider);
        await alice.sync(provider);

        // Deploy
        let contract = new SmartContract({});
        let transactionDeploy = contract.deploy({
            code: await loadContractCode("src/testdata/counter.wasm"),
            gasLimit: new GasLimit(3000000)
        });

        transactionDeploy.setNonce(alice.account.nonce);
        await alice.signer.sign(transactionDeploy);

        alice.account.incrementNonce();

        // ++
        let transactionIncrement = contract.call({
            func: new ContractFunction("increment"),
            gasLimit: new GasLimit(3000000)
        });

        transactionIncrement.setNonce(alice.account.nonce);
        await alice.signer.sign(transactionIncrement);

        alice.account.incrementNonce();

        // Broadcast & execute
        await transactionDeploy.send(provider);
        await transactionIncrement.send(provider);

        await transactionDeploy.awaitExecuted(provider);
        await transactionIncrement.awaitExecuted(provider);

        await transactionDeploy.getAsOnNetwork(provider);
        await transactionIncrement.getAsOnNetwork(provider);

        // TODO: Assert success in SCRs.
    });

    it("ESDT", async function () {
        this.timeout(60000);

        TransactionWatcher.DefaultPollingInterval = 5000;
        TransactionWatcher.DefaultTimeout = 50000;

        await NetworkConfig.getDefault().sync(provider);
        await alice.sync(provider);
    });
});
