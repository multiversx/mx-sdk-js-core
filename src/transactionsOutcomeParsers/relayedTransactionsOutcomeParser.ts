import { TransactionsConverter } from "../converters/transactionsConverter";
import { ITransactionOnNetwork } from "../interfaceOfNetwork";
import { TransactionOutcome, findEventsByIdentifier } from "./resources";

export class RelayedTransactionsOutcomeParser {
    constructor() {}

    parseRelayedV3Transaction(transaction: TransactionOutcome | ITransactionOnNetwork): {
        innerTransactionsHashes: string[];
    } {
        transaction = this.ensureTransactionOutcome(transaction);

        const events = findEventsByIdentifier(transaction, "completedTxEvent");
        const topics = events.flatMap((event) => event.topics);
        const hashes = topics.map((topic) => Buffer.from(topic).toString("hex"));

        return {
            innerTransactionsHashes: hashes,
        };
    }

    /**
     * Temporary workaround, until "TransactionOnNetwork" completely replaces "TransactionOutcome".
     */
    private ensureTransactionOutcome(transaction: TransactionOutcome | ITransactionOnNetwork): TransactionOutcome {
        if ("hash" in transaction) {
            return new TransactionsConverter().transactionOnNetworkToOutcome(transaction);
        }

        return transaction;
    }
}
