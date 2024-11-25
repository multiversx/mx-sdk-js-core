import { Address } from "../address";
import { ErrParseTransactionOutcome } from "../errors";
import { TransactionEvent } from "../transactionEvents";
import { TransactionOnNetwork } from "../transactionOnNetwork";
import { findEventsByIdentifier } from "../transactionsOutcomeParsers/resources";

export class DelegationTransactionsOutcomeParser {
    constructor() {}

    parseCreateNewDelegationContract(transaction: TransactionOnNetwork): { contractAddress: string }[] {
        this.ensureNoError(transaction.logs.events);

        const events = findEventsByIdentifier(transaction, "SCDeploy");

        return events.map((event) => ({ contractAddress: this.extractContractAddress(event) }));
    }

    private ensureNoError(transactionEvents: TransactionEvent[]) {
        for (const event of transactionEvents) {
            if (event.identifier == "signalError") {
                const data = Buffer.from(event.additionalData[0]?.toString().slice(1)).toString() || "";
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
        return new Address(address).toBech32();
    }

    private decodeTopicAsString(topic: Uint8Array): string {
        return Buffer.from(topic).toString();
    }
}
