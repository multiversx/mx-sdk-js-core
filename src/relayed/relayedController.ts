import { IAccount } from "../accounts/interfaces";
import { Transaction } from "../transaction";
import { TransactionComputer } from "../transactionComputer";
import { TransactionsFactoryConfig } from "../transactionsFactories";
import { RelayedTransactionsFactory } from "./relayedTransactionsFactory";
import { CreateV1RelayedTransactionInput, CreateV2RelayedTransactionInput } from "./resources";

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

    async createRelayedV1Transaction(sender: IAccount, options: CreateV1RelayedTransactionInput): Promise<Transaction> {
        const transaction = this.factory.createRelayedV1Transaction({ ...options, relayerAddress: sender.address });

        transaction.nonce = options.nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createRelayedV2Transaction(sender: IAccount, options: CreateV2RelayedTransactionInput): Promise<Transaction> {
        const transaction = this.factory.createRelayedV2Transaction({ ...options, relayerAddress: sender.address });

        transaction.nonce = options.nonce;
        transaction.gasLimit = BigInt(0);
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }
}
