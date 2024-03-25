import BigNumber from "bignumber.js";
import { assert } from "chai";
import { Logger } from "./logger";
import { loadTestWallets, TestWallet } from "./testutils";
import { createLocalnetProvider } from "./testutils/networkProviders";
import { TokenTransfer } from "./tokenTransfer";
import { Transaction } from "./transaction";
import { TransactionPayload } from "./transactionPayload";
import { TransactionWatcher } from "./transactionWatcher";
import { TransactionsFactoryConfig } from "./transactionsFactories/transactionsFactoryConfig";
import { TransferTransactionsFactory } from "./transactionsFactories/transferTransactionsFactory";
import { TokenComputer } from "./tokens";
import { TransactionComputer } from "./transactionComputer";

describe("test transaction", function () {
    let alice: TestWallet, bob: TestWallet;

    before(async function () {
        ({ alice, bob } = await loadTestWallets());
    });

    it("should send transactions and wait for completion", async function () {
        this.timeout(70000);

        let provider = createLocalnetProvider();
        let watcher = new TransactionWatcher({
            getTransaction: async (hash: string) => {
                return await provider.getTransaction(hash, true);
            },
        });
        let network = await provider.getNetworkConfig();

        await alice.sync(provider);

        await bob.sync(provider);
        let initialBalanceOfBob = new BigNumber(bob.account.balance.toString());

        let transactionOne = new Transaction({
            sender: alice.address,
            receiver: bob.address,
            value: TokenTransfer.egldFromAmount(42),
            gasLimit: network.MinGasLimit,
            chainID: network.ChainID,
        });

        let transactionTwo = new Transaction({
            sender: alice.address,
            receiver: bob.address,
            value: TokenTransfer.egldFromAmount(43),
            gasLimit: network.MinGasLimit,
            chainID: network.ChainID,
        });

        transactionOne.setNonce(alice.account.nonce);
        alice.account.incrementNonce();
        transactionTwo.setNonce(alice.account.nonce);

        await signTransaction({ transaction: transactionOne, wallet: alice });
        await signTransaction({ transaction: transactionTwo, wallet: alice });

        await provider.sendTransaction(transactionOne);
        await provider.sendTransaction(transactionTwo);

        await watcher.awaitCompleted(transactionOne.getHash().hex());
        await watcher.awaitCompleted(transactionTwo.getHash().hex());

        await bob.sync(provider);
        let newBalanceOfBob = new BigNumber(bob.account.balance.toString());

        assert.deepEqual(TokenTransfer.egldFromAmount(85).valueOf(), newBalanceOfBob.minus(initialBalanceOfBob));
    });

    it("should send transaction and wait for completion using the new proxy provider", async function () {
        this.timeout(70000);

        let provider = createLocalnetProvider();
        let watcher = new TransactionWatcher({
            getTransaction: async (hash: string) => {
                return await provider.getTransaction(hash, true);
            },
        });

        let network = await provider.getNetworkConfig();

        await alice.sync(provider);
        await bob.sync(provider);
        let initialBalanceOfBob = new BigNumber(bob.account.balance.toString());

        let transactionOne = new Transaction({
            sender: alice.address,
            receiver: bob.address,
            value: TokenTransfer.egldFromAmount(42),
            gasLimit: network.MinGasLimit,
            chainID: network.ChainID,
        });

        transactionOne.setNonce(alice.account.nonce);
        await signTransaction({ transaction: transactionOne, wallet: alice });
        await provider.sendTransaction(transactionOne);
        await watcher.awaitCompleted(transactionOne.getHash().hex());

        await bob.sync(provider);
        let newBalanceOfBob = new BigNumber(bob.account.balance.toString());

        assert.deepEqual(TokenTransfer.egldFromAmount(42).valueOf(), newBalanceOfBob.minus(initialBalanceOfBob));
    });

    it("should simulate transactions", async function () {
        this.timeout(20000);

        let provider = createLocalnetProvider();
        let network = await provider.getNetworkConfig();
        await alice.sync(provider);

        let transactionOne = new Transaction({
            sender: alice.address,
            data: new TransactionPayload("helloWorld"),
            gasLimit: 70000,
            receiver: alice.address,
            value: TokenTransfer.egldFromAmount(1000),
            chainID: network.ChainID,
        });

        let transactionTwo = new Transaction({
            sender: alice.address,
            data: new TransactionPayload("helloWorld"),
            gasLimit: 70000,
            receiver: alice.address,
            value: TokenTransfer.egldFromAmount(1000000),
            chainID: network.ChainID,
        });

        transactionOne.setNonce(alice.account.nonce);
        transactionTwo.setNonce(alice.account.nonce);

        await signTransaction({ transaction: transactionOne, wallet: alice });
        await signTransaction({ transaction: transactionTwo, wallet: alice });

        Logger.trace(JSON.stringify(await provider.simulateTransaction(transactionOne), null, 4));
        Logger.trace(JSON.stringify(await provider.simulateTransaction(transactionTwo), null, 4));
    });

    it("should create transaction using the NextTokenTransferFactory", async function () {
        this.timeout(70000);

        const provider = createLocalnetProvider();
        const watcher = new TransactionWatcher({
            getTransaction: async (hash: string) => {
                return await provider.getTransaction(hash, true);
            },
        });

        const network = await provider.getNetworkConfig();

        const config = new TransactionsFactoryConfig({ chainID: network.ChainID });
        const factory = new TransferTransactionsFactory({ config: config, tokenComputer: new TokenComputer() });

        await alice.sync(provider);
        await bob.sync(provider);
        const initialBalanceOfBob = new BigNumber(bob.account.balance.toString());

        const transaction = factory.createTransactionForNativeTokenTransfer({
            sender: alice.address,
            receiver: bob.address,
            nativeAmount: 42000000000000000000n,
        });
        transaction.nonce = BigInt(alice.account.nonce.valueOf());

        const transactionComputer = new TransactionComputer();
        transaction.signature = await alice.signer.sign(transactionComputer.computeBytesForSigning(transaction));

        const txHash = await provider.sendTransaction(transaction);
        await watcher.awaitCompleted(txHash);

        await bob.sync(provider);
        const newBalanceOfBob = new BigNumber(bob.account.balance.toString());

        assert.deepEqual(TokenTransfer.egldFromAmount(42).valueOf(), newBalanceOfBob.minus(initialBalanceOfBob));
    });

    async function signTransaction(options: { transaction: Transaction; wallet: TestWallet }) {
        const transaction = options.transaction;
        const wallet = options.wallet;

        const serialized = transaction.serializeForSigning();
        const signature = await wallet.signer.sign(serialized);
        transaction.applySignature(signature);
    }
});
