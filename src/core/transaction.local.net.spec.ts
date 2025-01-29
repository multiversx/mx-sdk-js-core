import BigNumber from "bignumber.js";
import { assert } from "chai";
import { INetworkProvider } from "../networkProviders/interface";
import { loadTestWallets, stringifyBigIntJSON, TestWallet } from "../testutils";
import { createLocalnetProvider } from "../testutils/networkProviders";
import { TransferTransactionsFactory } from "../transfers/transferTransactionsFactory";
import { Logger } from "./logger";
import { TokenTransfer } from "./tokens";
import { Transaction } from "./transaction";
import { TransactionComputer } from "./transactionComputer";
import { TransactionsFactoryConfig } from "./transactionsFactoryConfig";
import { TransactionWatcher } from "./transactionWatcher";

describe("test transaction", function () {
    let alice: TestWallet, bob: TestWallet;
    const transactionComputer = new TransactionComputer();

    before(async function () {
        ({ alice, bob } = await loadTestWallets());
    });

    function createTransactionWatcher(provider: INetworkProvider) {
        return new TransactionWatcher(
            {
                getTransaction: async (hash: string) => {
                    return await provider.getTransaction(hash);
                },
            },
            { timeoutMilliseconds: 100000 },
        );
    }

    it("should send transactions and wait for completion", async function () {
        this.timeout(80000);

        let provider = createLocalnetProvider();
        let watcher = createTransactionWatcher(provider);
        let network = await provider.getNetworkConfig();

        let transactionOne = new Transaction({
            sender: alice.address,
            receiver: bob.address,
            value: TokenTransfer.newFromNativeAmount(42000000000000000000n).amount,
            gasLimit: BigInt(network.minGasLimit),
            chainID: network.chainID,
        });

        let transactionTwo = new Transaction({
            sender: alice.address,
            receiver: bob.address,
            value: TokenTransfer.newFromNativeAmount(43000000000000000000n).amount,
            gasLimit: BigInt(network.minGasLimit),
            chainID: network.chainID,
        });

        await alice.sync(provider);
        await bob.sync(provider);
        let initialBalanceOfBob = new BigNumber((await bob.getBalance(provider)).toString());

        transactionOne.nonce = alice.account.getNonceThenIncrement();
        transactionTwo.nonce = alice.account.nonce;

        await signTransaction({ transaction: transactionOne, wallet: alice });
        await signTransaction({ transaction: transactionTwo, wallet: alice });

        const hashOne = await provider.sendTransaction(transactionOne);
        const hashTwo = await provider.sendTransaction(transactionTwo);

        await watcher.awaitCompleted(hashOne);
        await watcher.awaitCompleted(hashTwo);

        await bob.sync(provider);
        let newBalanceOfBob = new BigNumber((await bob.getBalance(provider)).toString());

        assert.deepEqual(
            TokenTransfer.newFromNativeAmount(85000000000000000000n).amount,
            BigInt(newBalanceOfBob.minus(initialBalanceOfBob).toString()),
        );
    });

    it("should send transaction and wait for completion using the new proxy provider", async function () {
        this.timeout(80000);

        let provider = createLocalnetProvider();
        let watcher = createTransactionWatcher(provider);

        let network = await provider.getNetworkConfig();

        let transactionOne = new Transaction({
            sender: alice.address,
            receiver: bob.address,
            value: TokenTransfer.newFromNativeAmount(42n).amount,
            gasLimit: BigInt(network.minGasLimit),
            chainID: network.chainID,
        });

        await alice.sync(provider);
        await bob.sync(provider);
        let initialBalanceOfBob = new BigNumber((await bob.getBalance(provider)).toString());

        transactionOne.nonce = alice.account.nonce;
        await signTransaction({ transaction: transactionOne, wallet: alice });
        const hashOne = await provider.sendTransaction(transactionOne);
        await watcher.awaitCompleted(hashOne);

        await bob.sync(provider);
        let newBalanceOfBob = new BigNumber((await bob.getBalance(provider)).toString());

        assert.deepEqual(
            TokenTransfer.newFromNativeAmount(42n).amount,
            BigInt(newBalanceOfBob.minus(initialBalanceOfBob).toString()),
        );
    });

    it("should simulate transactions", async function () {
        this.timeout(20000);

        let provider = createLocalnetProvider();
        let network = await provider.getNetworkConfig();
        await alice.sync(provider);

        let transactionOne = new Transaction({
            sender: alice.address,
            data: Buffer.from("helloWorld"),
            gasLimit: 70000n,
            receiver: alice.address,
            value: TokenTransfer.newFromNativeAmount(1000n).amount,
            chainID: network.chainID,
        });

        let transactionTwo = new Transaction({
            sender: alice.address,
            data: Buffer.from("helloWorld"),
            gasLimit: 70000n,
            receiver: alice.address,
            value: TokenTransfer.newFromNativeAmount(1000000n).amount,
            chainID: network.chainID,
        });

        transactionOne.nonce = alice.account.nonce;
        transactionTwo.nonce = alice.account.nonce;

        await signTransaction({ transaction: transactionOne, wallet: alice });
        await signTransaction({ transaction: transactionTwo, wallet: alice });

        Logger.trace(stringifyBigIntJSON(await provider.simulateTransaction(transactionOne)));
        Logger.trace(stringifyBigIntJSON(await provider.simulateTransaction(transactionTwo)));
    });

    it("should create transaction using the TokenTransferFactory", async function () {
        this.timeout(80000);

        const provider = createLocalnetProvider();
        const watcher = createTransactionWatcher(provider);

        const network = await provider.getNetworkConfig();

        const config = new TransactionsFactoryConfig({ chainID: network.chainID });
        const factory = new TransferTransactionsFactory({ config: config });

        await alice.sync(provider);
        await bob.sync(provider);
        const initialBalanceOfBob = new BigNumber((await bob.getBalance(provider)).toString());

        const transaction = factory.createTransactionForNativeTokenTransfer(alice.address, {
            receiver: bob.address,
            nativeAmount: 42000000000000000000n,
        });
        transaction.nonce = BigInt(alice.account.nonce.valueOf());

        transaction.signature = await alice.signer.sign(transactionComputer.computeBytesForSigning(transaction));

        const txHash = await provider.sendTransaction(transaction);
        await watcher.awaitCompleted(txHash);

        await bob.sync(provider);
        const newBalanceOfBob = new BigNumber((await bob.getBalance(provider)).toString());

        assert.deepEqual(
            TokenTransfer.newFromNativeAmount(42000000000000000000n).amount,
            BigInt(newBalanceOfBob.minus(initialBalanceOfBob).toString()),
        );
    });

    async function signTransaction(options: { transaction: Transaction; wallet: TestWallet }) {
        const transaction = options.transaction;
        const wallet = options.wallet;

        const serialized = transactionComputer.computeBytesForSigning(transaction);
        const signature = await wallet.signer.sign(serialized);
        transaction.signature = signature;
    }
});
