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
    constructor(options: { chainID: string }) {
        this.factory = new RelayedTransactionsFactory({
            config: new TransactionsFactoryConfig(options),
        });
        this.txComputer = new TransactionComputer();
    }

    async createRelayedV1Transaction(sender: IAccount, options: CreateV1RelayTransactionInput): Promise<Transaction> {
        const transaction = this.factory.createRelayedV1Transaction({ ...options, relayerAddress: sender.address });

        transaction.nonce = options.nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createRelayedV2Transaction(sender: IAccount, options: CreateV2RelayTransactionInput): Promise<Transaction> {
        const transaction = this.factory.createRelayedV2Transaction({ ...options, relayerAddress: sender.address });

        transaction.nonce = options.nonce;
        transaction.gasLimit = BigInt(0);
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }
}

type CreateV1RelayTransactionInput = { nonce: bigint; innerTransaction: ITransaction };
type CreateV2RelayTransactionInput = {
    nonce: bigint;
    innerTransaction: ITransaction;
    innerTransactionGasLimit: bigint;
};
