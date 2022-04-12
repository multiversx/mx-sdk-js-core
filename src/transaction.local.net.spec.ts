import { Transaction } from "./transaction";
import { GasLimit } from "./networkParams";
import { TransactionPayload } from "./transactionPayload";
import { Balance } from "./balance";
import { loadTestWallets, TestWallet } from "./testutils";
import { Logger } from "./logger";
import { assert } from "chai";
import { TransactionWatcher } from "./transactionWatcher";
import { createLocalnetProvider } from "./testutils/networkProviders";
import { TokenPayment } from "./tokenPayment";

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
        let initialBalanceOfBob = Balance.fromString(bob.account.balance.toString());

        let transactionOne = new Transaction({
            receiver: bob.address,
            value: TokenPayment.egldWithRationalNumber(42),
            gasLimit: network.MinGasLimit,
            chainID: network.ChainID
        });

        let transactionTwo = new Transaction({
            receiver: bob.address,
            value: TokenPayment.egldWithRationalNumber(43),
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
        let newBalanceOfBob = Balance.fromString(bob.account.balance.toString());

        assert.deepEqual(TokenPayment.egldWithRationalNumber(85), newBalanceOfBob.valueOf().minus(initialBalanceOfBob.valueOf()));
    });

    it("should simulate transactions", async function () {
        this.timeout(20000);

        let provider = createLocalnetProvider();
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
