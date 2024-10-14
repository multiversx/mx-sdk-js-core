import { assert } from "chai";
import { promises } from "fs";
import { AddressComputer } from "../address";
import { TestWallet, loadTestWallets } from "../testutils";
import { createLocalnetProvider } from "../testutils/networkProviders";
import { Transaction } from "../transaction";
import { TransactionComputer } from "../transactionComputer";
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
        this.timeout(120000);

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

        console.log("transactionHashDeployOfAlice", transactionHashDeployOfAlice);
        console.log("transactionHashDeployOfJudy", transactionHashDeployOfJudy);

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

        console.log("relayedWithIntraShardCallsTransactionHash", relayedWithIntraShardCallsTransactionHash);
        console.log("relayedWithCrossShardCallsTransactionHash", relayedWithCrossShardCallsTransactionHash);

        const innerTransactionsOfRelayedWithIntraShardCalls =
            relayedWithIntraShardCallsTransactionOnNetwork.innerTransactions || [];

        const innerTransactionsOfRelayedWithCrossShardCalls =
            relayedWithCrossShardCallsTransactionOnNetwork.innerTransactions || [];

        // Carol to Judy's contract
        let outcome = smartContractTransactionsParser.parseExecute({
            transactionOnNetwork: innerTransactionsOfRelayedWithIntraShardCalls[0],
        });
        assert.deepEqual(outcome.values, [Buffer.from([2])]);

        // Judy to Judy's contract
        outcome = smartContractTransactionsParser.parseExecute({
            transactionOnNetwork: innerTransactionsOfRelayedWithIntraShardCalls[1],
        });
        assert.deepEqual(outcome.values, [Buffer.from([3])]);

        // Carol to Alice's contract
        outcome = smartContractTransactionsParser.parseExecute({
            transactionOnNetwork: innerTransactionsOfRelayedWithCrossShardCalls[0],
        });
        assert.deepEqual(outcome.values, [Buffer.from([2])]);

        // Judy to Alice's contract
        outcome = smartContractTransactionsParser.parseExecute({
            transactionOnNetwork: innerTransactionsOfRelayedWithCrossShardCalls[1],
        });
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
