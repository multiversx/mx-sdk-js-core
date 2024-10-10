import { assert } from "chai";
import { promises } from "fs";
import { AddressComputer } from "../address";
import { TestWallet, loadTestWallets } from "../testutils";
import { createLocalnetProvider } from "../testutils/networkProviders";
import { Transaction } from "../transaction";
import { TransactionComputer } from "../transactionComputer";
import { RelayedTransactionsOutcomeParser } from "../transactionsOutcomeParsers/relayedTransactionsOutcomeParser";
import { SmartContractTransactionsOutcomeParser } from "../transactionsOutcomeParsers/smartContractTransactionsOutcomeParser";
import { TransactionWatcher } from "../transactionWatcher";
import { RelayedTransactionsFactory } from "./relayedTransactionsFactory";
import { SmartContractTransactionsFactory } from "./smartContractTransactionsFactory";
import { TransactionsFactoryConfig } from "./transactionsFactoryConfig";

describe("test relayed transactions factory (on localnet)", function () {
    const networkProvider = createLocalnetProvider();
    const transactionWatcher = new TransactionWatcher({
        getTransaction: async (hash: string) => {
            return await networkProvider.getTransaction(hash, true);
        },
    });

    const config = new TransactionsFactoryConfig({ chainID: "localnet" });
    const relayedTransactionsFactory = new RelayedTransactionsFactory({ config: config });
    const relayedTransactionsOutcomeParser = new RelayedTransactionsOutcomeParser();
    const smartContractTransactionsFactory = new SmartContractTransactionsFactory({ config: config });
    const smartContractTransactionsParser = new SmartContractTransactionsOutcomeParser();
    const transactionComputer = new TransactionComputer();
    const addressComputer = new AddressComputer();

    // Alice - shard 1
    // Carol - shard 2
    // Heidi - shard 2
    // Judy - shard 2
    let alice: TestWallet, carol: TestWallet, heidi: TestWallet, judy: TestWallet;

    before(async function () {
        ({ alice, carol, heidi, judy } = await loadTestWallets());
    });

    it("should create relayed v3 transaction", async function () {
        this.timeout(60000);

        await alice.sync(networkProvider);
        await carol.sync(networkProvider);
        await heidi.sync(networkProvider);
        await judy.sync(networkProvider);

        const bytecode = await promises.readFile("src/testdata/counter.wasm");

        // Alice and Judy will each deploy a contract.
        const addressOfContractOfAlice = addressComputer.computeContractAddress(
            alice.address,
            BigInt(alice.account.nonce.valueOf()),
        );

        const addressOfContractOfJudy = addressComputer.computeContractAddress(
            judy.address,
            BigInt(judy.account.nonce.valueOf()),
        );

        const transactionHashDeployOfAlice = await networkProvider.sendTransaction(
            await signTransaction({
                transaction: smartContractTransactionsFactory.createTransactionForDeploy({
                    sender: alice.address,
                    bytecode: bytecode,
                    gasLimit: 3000000n,
                }),
                wallet: alice,
            }),
        );

        const transactionHashDeployOfJudy = await networkProvider.sendTransaction(
            await signTransaction({
                transaction: smartContractTransactionsFactory.createTransactionForDeploy({
                    sender: judy.address,
                    bytecode: bytecode,
                    gasLimit: 3000000n,
                }),
                wallet: judy,
            }),
        );

        await transactionWatcher.awaitCompleted(transactionHashDeployOfAlice);
        await transactionWatcher.awaitCompleted(transactionHashDeployOfJudy);

        // Intra-shard contract calls (Carol and Judy to Judy's contract)
        const relayedWithIntraShardCallsTransaction = relayedTransactionsFactory.createRelayedV3Transaction({
            relayerAddress: heidi.address,
            innerTransactions: [
                await signTransaction({
                    transaction: smartContractTransactionsFactory.createTransactionForExecute({
                        sender: carol.address,
                        contract: addressOfContractOfJudy,
                        function: "increment",
                        gasLimit: 3000000n,
                    }),
                    wallet: carol,
                    relayer: heidi,
                }),
                await signTransaction({
                    transaction: smartContractTransactionsFactory.createTransactionForExecute({
                        sender: judy.address,
                        contract: addressOfContractOfJudy,
                        function: "increment",
                        gasLimit: 3000000n,
                    }),
                    wallet: judy,
                    relayer: heidi,
                }),
            ],
        });

        await signTransaction({ transaction: relayedWithIntraShardCallsTransaction, wallet: heidi });

        // Cross-shard contract calls (Carol and Judy to Alice's contract)
        const relayedWithCrossShardCallsTransaction = relayedTransactionsFactory.createRelayedV3Transaction({
            relayerAddress: heidi.address,
            innerTransactions: [
                await signTransaction({
                    transaction: smartContractTransactionsFactory.createTransactionForExecute({
                        sender: carol.address,
                        contract: addressOfContractOfAlice,
                        function: "increment",
                        gasLimit: 3000000n,
                    }),
                    wallet: carol,
                    relayer: heidi,
                }),
                await signTransaction({
                    transaction: smartContractTransactionsFactory.createTransactionForExecute({
                        sender: judy.address,
                        contract: addressOfContractOfAlice,
                        function: "increment",
                        gasLimit: 3000000n,
                    }),
                    wallet: judy,
                    relayer: heidi,
                }),
            ],
        });

        await signTransaction({ transaction: relayedWithCrossShardCallsTransaction, wallet: heidi });

        const relayedWithIntraShardCallsTransactionHash = await networkProvider.sendTransaction(
            relayedWithIntraShardCallsTransaction,
        );

        const relayedWithCrossShardCallsTransactionHash = await networkProvider.sendTransaction(
            relayedWithCrossShardCallsTransaction,
        );

        const relayedWithIntraShardCallsTransactionOnNetwork = await transactionWatcher.awaitCompleted(
            relayedWithIntraShardCallsTransactionHash,
        );

        const relayedWithCrossShardCallsTransactionOnNetwork = await transactionWatcher.awaitCompleted(
            relayedWithCrossShardCallsTransactionHash,
        );

        const { innerTransactionsHashes: innerTransactionsHashesOfRelayedWithIntraShardCalls } =
            relayedTransactionsOutcomeParser.parseRelayedV3Transaction(relayedWithIntraShardCallsTransactionOnNetwork);

        const { innerTransactionsHashes: innerTransactionsHashesOfRelayedWithCrossShardCalls } =
            relayedTransactionsOutcomeParser.parseRelayedV3Transaction(relayedWithCrossShardCallsTransactionOnNetwork);

        // Carol to Judy's contract
        let innerTransactionOnNetwork = await networkProvider.getTransaction(
            innerTransactionsHashesOfRelayedWithIntraShardCalls[0],
        );
        let outcome = smartContractTransactionsParser.parseExecute({ transactionOnNetwork: innerTransactionOnNetwork });
        assert.deepEqual(outcome.values, [Buffer.from([2])]);

        // Judy to Judy's contract
        innerTransactionOnNetwork = await networkProvider.getTransaction(
            innerTransactionsHashesOfRelayedWithIntraShardCalls[1],
        );
        outcome = smartContractTransactionsParser.parseExecute({ transactionOnNetwork: innerTransactionOnNetwork });
        assert.deepEqual(outcome.values, [Buffer.from([3])]);

        // Carol to Alice's contract
        innerTransactionOnNetwork = await networkProvider.getTransaction(
            innerTransactionsHashesOfRelayedWithCrossShardCalls[0],
        );
        outcome = smartContractTransactionsParser.parseExecute({ transactionOnNetwork: innerTransactionOnNetwork });
        assert.deepEqual(outcome.values, [Buffer.from([2])]);

        // Judy to Alice's contract
        innerTransactionOnNetwork = await networkProvider.getTransaction(
            innerTransactionsHashesOfRelayedWithCrossShardCalls[1],
        );
        outcome = smartContractTransactionsParser.parseExecute({ transactionOnNetwork: innerTransactionOnNetwork });
        assert.deepEqual(outcome.values, [Buffer.from([3])]);
    });

    async function signTransaction(options: {
        transaction: Transaction;
        wallet: TestWallet;
        relayer?: TestWallet;
    }): Promise<Transaction> {
        const transaction = options.transaction;
        const wallet = options.wallet;

        transaction.nonce = BigInt(wallet.account.getNonceThenIncrement().valueOf());

        if (options.relayer) {
            transaction.relayer = options.relayer.address.toBech32();
        }

        const serialized = transactionComputer.computeBytesForSigning(transaction);
        const signature = await wallet.signer.sign(serialized);

        transaction.applySignature(signature);
        return transaction;
    }
});
