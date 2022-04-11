import { TransactionStatus } from "./transactionStatus";
import { TransactionLogs } from "./transactionLogs";
import { isPaddedHex } from "./primitives";

interface ITransactionOnNetwork {
    logs: TransactionLogs;
    status: TransactionStatus;
    hyperblockNonce: number;
    data: Buffer;
}

const WellKnownCompletionEvents = ["completedTxEvent", "SCDeploy", "signalError"];

/**
 * Algorithm for detecting transaction completion.
 * Based on some heuristics (a bit imprecise therefore, at this moment).
 */
export class TransactionCompletionStrategyOnProxy {
    isCompleted(transaction: ITransactionOnNetwork): boolean {
        if (transaction.status.isPending()) {
            // Certainly not completed.
            return false;
        }

        // Handle gateway mechanics:
        for (const completionEvent of WellKnownCompletionEvents) {
            if (transaction.logs.findFirstOrNoneEvent(completionEvent)) {
                // Certainly completed.
                console.debug("TransactionCompletionStrategy.isCompleted(), found event:", completionEvent);
                return true;
            }
        }

        if (this.isCertainlyMoveBalance(transaction.data)) {
            return transaction.status.isExecuted();
        }

        let hyperblockNonce = transaction.hyperblockNonce;

        // Imprecise condition, uncertain completion (usually sufficient, though).
        // This is WRONG when (at least): timeOf(block with execution at destination is notarized) < timeOf(the "completedTxEvent" occurs).
        if (hyperblockNonce > 0) {
            console.debug("TransactionCompletionStrategy.isCompleted(), found hyperblock nonce:", hyperblockNonce);
            return true;
        }

        return false;
    }

    private isCertainlyMoveBalance(transactionData: Buffer): boolean {
        let parts = transactionData.toString().split("@");
        let prefix = parts[0];
        let otherParts = parts.slice(1);
        let emptyPrefix = !prefix;
        let somePartsAreNotValidArguments = !otherParts.every(part => this.looksLikeValidArgument(part));
        
        return emptyPrefix || somePartsAreNotValidArguments;
    }

    private looksLikeValidArgument(arg: string) {
        return isPaddedHex(arg);
    }
}

export class TransactionCompletionStrategyOnAPI {
    isCompleted(transaction: ITransactionOnNetwork): boolean {
        return !transaction.status.isPending();
    }
}
