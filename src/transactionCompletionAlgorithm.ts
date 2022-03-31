import { Nonce } from "./nonce";
import { TransactionStatus } from "./transaction";
import { TransactionLogs } from "./transactionLogs";

/**
 * Internal interface: a transaction, as seen from the perspective of a {@link TransactionCompletionAlgorithm}.
 */
interface ITransactionOnNetwork {
    logs: TransactionLogs;
    status: TransactionStatus;
    hyperblockNonce: Nonce;
}

const WellKnownCompletionEvents = ["completedTxEvent", "SCDeploy", "signalError"];

export class TransactionCompletionAlgorithm {
    isCompleted(transaction: ITransactionOnNetwork): boolean {
        if (transaction.status.isPending()) {
            // Certainly not completed.
            return false;
        }

        // Handle gateway mechanics:
        for (const completionEvent of WellKnownCompletionEvents) {
            if (transaction.logs.findEventByIdentifier(completionEvent)) {
                // Certainly completed.
                return true;
            }
        }

        // Imprecise condition, uncertain completion (usually sufficient, though).
        // This is WRONG when:
        // timeOf(block with execution at destination is notarized) < timeOf(the "completedTxEvent" occurs)
        // Also, extremely inefficient for simple move balances (useless long wait).
        return transaction.hyperblockNonce.valueOf() > 0;

        // TODO: simple move balance - only use the status field? isPending vs. not.
        // simple move balance = not relayed, not token transfers, not SC calls (receiver address needed).
        // tryParseCall(tx.data)
    }
}
