import { Address } from "../address";
import { TransactionsConverter } from "../converters/transactionsConverter";
import { ErrParseTransactionOutcome } from "../errors";
import { ITransactionOnNetwork } from "../interfaceOfNetwork";
import { TransactionEvent, TransactionOutcome, findEventsByIdentifier } from "./resources";

export class DelegationTransactionsOutcomeParser {
    constructor() {}

    parseCreateNewDelegationContract(
        transaction: TransactionOutcome | ITransactionOnNetwork,
    ): { contractAddress: string }[] {
        transaction = this.ensureTransactionOutcome(transaction);

        this.ensureNoError(transaction.logs.events);

        const events = findEventsByIdentifier(transaction, "SCDeploy");

        return events.map((event) => ({ contractAddress: this.extractContractAddress(event) }));
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

    private ensureNoError(transactionEvents: TransactionEvent[]) {
        for (const event of transactionEvents) {
            if (event.identifier == "signalError") {
                const data = Buffer.from(event.dataItems[0]?.toString().slice(1)).toString() || "";
                const message = this.decodeTopicAsString(event.topics[1]);

                throw new ErrParseTransactionOutcome(
                    `encountered signalError: ${message} (${Buffer.from(data, "hex").toString()})`,
                );
            }
        }
    }

    private extractContractAddress(event: TransactionEvent): string {
        if (!event.topics[0]?.length) {
            return "";
        }
        const address = Buffer.from(event.topics[0]);
        return Address.fromBuffer(address).bech32();
    }

    private decodeTopicAsString(topic: Uint8Array): string {
        return Buffer.from(topic).toString();
    }
}
