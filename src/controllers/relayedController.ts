import { ITransaction } from "../interface";
import { Transaction } from "../transaction";
import { TransactionComputer } from "../transactionComputer";
import { RelayedTransactionsFactory, TransactionsFactoryConfig } from "../transactionsFactories";
import { IAccount } from "./interfaces";

export class RelayedController {
    private factory: RelayedTransactionsFactory;
    private txComputer: TransactionComputer;

    /**
     * The transactions are created from the perspective of the relayer.
     * The 'sender' represents the relayer.
     */
    constructor(chainId: string) {
        this.factory = new RelayedTransactionsFactory({ config: new TransactionsFactoryConfig({ chainID: chainId }) });
        this.txComputer = new TransactionComputer();
    }

    async createRelayedV1Transaction(
        sender: IAccount,
        nonce: bigint,
        innerTransaction: ITransaction,
    ): Promise<Transaction> {
        const transaction = this.factory.createRelayedV1Transaction({
            innerTransaction,
            relayerAddress: sender.address,
        });

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createRelayedV2Transaction(
        sender: IAccount,
        nonce: bigint,
        innerTransaction: ITransaction,
        innerTransactionGasLimit: bigint,
    ): Promise<Transaction> {
        const transaction = this.factory.createRelayedV2Transaction({
            innerTransaction,
            innerTransactionGasLimit: BigInt(innerTransactionGasLimit),
            relayerAddress: sender.address,
        });

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createRelayedV3Transaction(
        sender: IAccount,
        nonce: bigint,
        innerTransactions: ITransaction[],
    ): Promise<Transaction> {
        const transaction = this.factory.createRelayedV3Transaction({
            relayerAddress: sender.address,
            innerTransactions,
        });

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }
}
