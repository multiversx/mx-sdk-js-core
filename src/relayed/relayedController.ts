import { IAccount } from "../accounts/interfaces";
import { Transaction } from "../transaction";
import { TransactionComputer } from "../transactionComputer";
import { TransactionsFactoryConfig } from "../transactionsFactoryConfig";
import { RelayedTransactionsFactory } from "./relayedTransactionsFactory";
import { RelayedV1TransactionInput, RelayedV2TransactionInput } from "./resources";

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

    async createRelayedV1Transaction(
        sender: IAccount,
        nonce: bigint,
        options: RelayedV1TransactionInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createRelayedV1Transaction(sender.address, options);

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createRelayedV2Transaction(
        sender: IAccount,
        nonce: bigint,
        options: RelayedV2TransactionInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createRelayedV2Transaction(sender.address, options);

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }
}
