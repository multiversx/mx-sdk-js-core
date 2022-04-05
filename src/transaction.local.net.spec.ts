import { Transaction } from "./transaction";
import { GasLimit } from "./networkParams";
import { TransactionPayload } from "./transactionPayload";
import { Balance } from "./balance";
import { loadTestWallets, TestWallet } from "./testutils";
import { Logger } from "./logger";
import { assert } from "chai";
import { chooseProxyProvider } from "./interactive";
import { TransactionWatcher } from "./transactionWatcher";

describe("test transaction", function () {
    let alice: TestWallet, bob: TestWallet;

    before(async function () {
        ({ alice, bob } = await loadTestWallets());
    });

    it("should send transactions", async function () {
        this.timeout(20000);

        let provider = chooseProxyProvider("local-testnet");
        let watcher = new TransactionWatcher(provider);
        let network = await provider.getNetworkConfig();
        
        await alice.sync(provider);

        await bob.sync(provider);
        let initialBalanceOfBob = bob.account.balance;

        let transactionOne = new Transaction({
            receiver: bob.address,
            value: Balance.egld(42),
            gasLimit: network.MinGasLimit,
            chainID: network.ChainID
        });

        let transactionTwo = new Transaction({
            receiver: bob.address,
            value: Balance.egld(43),
            gasLimit: network.MinGasLimit,
            chainID: network.ChainID
        });

        transactionOne.setNonce(alice.account.nonce);
        alice.account.incrementNonce();
        transactionTwo.setNonce(alice.account.nonce);

        await alice.signer.sign(transactionOne);
        await alice.signer.sign(transactionTwo);

        await provider.sendTransaction(transactionOne);
        await provider.sendTransaction(transactionTwo);

        await watcher.awaitCompleted(transactionOne);
        await watcher.awaitCompleted(transactionTwo);

        await bob.sync(provider);
        let newBalanceOfBob = bob.account.balance;

        assert.deepEqual(Balance.egld(85).valueOf(), newBalanceOfBob.valueOf().minus(initialBalanceOfBob.valueOf()));
    });

    it("should simulate transactions", async function () {
        this.timeout(20000);

        let provider = chooseProxyProvider("local-testnet");
        let network = await provider.getNetworkConfig();
        await alice.sync(provider);

        let transactionOne = new Transaction({
            data: new TransactionPayload("helloWorld"),
            gasLimit: new GasLimit(70000),
            receiver: alice.address,
            value: Balance.egld(1000),
            chainID: network.ChainID
        });

        let transactionTwo = new Transaction({
            data: new TransactionPayload("helloWorld"),
            gasLimit: new GasLimit(70000),
            receiver: alice.address,
            value: Balance.egld(1000000),
            chainID: network.ChainID
        });

        transactionOne.setNonce(alice.account.nonce);
        transactionTwo.setNonce(alice.account.nonce);

        await alice.signer.sign(transactionOne);
        await alice.signer.sign(transactionTwo);

        Logger.trace(JSON.stringify(await provider.simulateTransaction(transactionOne), null, 4));
        Logger.trace(JSON.stringify(await provider.simulateTransaction(transactionTwo), null, 4));
    });
});
