import { Transaction } from "./transaction";
import { TransactionPayload } from "./transactionPayload";
import { loadTestWallets, TestWallet } from "./testutils";
import { Logger } from "./logger";
import { assert } from "chai";
import { TransactionWatcher } from "./transactionWatcher";
import { createLocalnetProvider } from "./testutils/networkProviders";
import { TokenPayment } from "./tokenPayment";
import BigNumber from "bignumber.js";

describe("test transaction", function () {
    let alice: TestWallet, bob: TestWallet;

    before(async function () {
        ({ alice, bob } = await loadTestWallets());
    });

    it("should send transactions", async function () {
        this.timeout(20000);

        let provider = createLocalnetProvider();
        let watcher = new TransactionWatcher(provider);
        let network = await provider.getNetworkConfig();

        await alice.sync(provider);

        await bob.sync(provider);
        let initialBalanceOfBob = new BigNumber(bob.account.balance.toString());

        let transactionOne = new Transaction({
            receiver: bob.address,
            sender: alice.address,
            value: TokenPayment.egldFromAmount(42),
            gasLimit: network.MinGasLimit,
            chainID: network.ChainID
        });

        let transactionTwo = new Transaction({
            receiver: bob.address,
            sender: alice.address,
            value: TokenPayment.egldFromAmount(43),
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
        let newBalanceOfBob = new BigNumber(bob.account.balance.toString());

        assert.deepEqual(TokenPayment.egldFromAmount(85).valueOf(), newBalanceOfBob.minus(initialBalanceOfBob));
    });

    it("should simulate transactions", async function () {
        this.timeout(20000);

        let provider = createLocalnetProvider();
        let network = await provider.getNetworkConfig();
        await alice.sync(provider);

        let transactionOne = new Transaction({
            data: new TransactionPayload("helloWorld"),
            gasLimit: 70000,
            receiver: alice.address,
            sender: alice.address,
            value: TokenPayment.egldFromAmount(1000),
            chainID: network.ChainID
        });

        let transactionTwo = new Transaction({
            data: new TransactionPayload("helloWorld"),
            gasLimit: 70000,
            receiver: alice.address,
            sender: alice.address,
            value: TokenPayment.egldFromAmount(1000000),
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
