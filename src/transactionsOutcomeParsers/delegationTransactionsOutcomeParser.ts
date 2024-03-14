import { ErrParseTransactionOutcome } from "../errors";
import { TransactionEvent, TransactionOutcome } from "./resources";
import { Address } from "../address";

export class DelegationTransactionsOutcomeParser {
    constructor() {}

    parseCreateNewDelegationContract(transactionOutcome: TransactionOutcome): { contractAddress: string }[] {
        this.ensureNoError(transactionOutcome.transactionLogs.events);

        const events = this.findEventsByIdentifier(transactionOutcome, "SCDeploy");

        return events.map((event) => ({ contractAddress: this.extractContractAddress(event) }));
    }

    private ensureNoError(transactionEvents: TransactionEvent[]) {
        for (const event of transactionEvents) {
            if (event.identifier == "signalError") {
                const data = Buffer.from(event.data.toString().slice(1)).toString();
                const message = this.decodeTopicAsString(event.topics[1]);

                throw new ErrParseTransactionOutcome(
                    `encountered signalError: ${message} (${Buffer.from(data, "hex").toString()})`,
                );
            }
        }
    }

    private findEventsByIdentifier(transactionOutcome: TransactionOutcome, identifier: string): TransactionEvent[] {
        const events = this.gatherAllEvents(transactionOutcome).filter((event) => event.identifier == identifier);

        if (events.length == 0) {
            throw new ErrParseTransactionOutcome(`cannot find event of type ${identifier}`);
        }

        return events;
    }

    private gatherAllEvents(transactionOutcome: TransactionOutcome): TransactionEvent[] {
        const allEvents = [];

        allEvents.push(...transactionOutcome.transactionLogs.events);

        for (const item of transactionOutcome.smartContractResults) {
            allEvents.push(...item.logs.events);
        }

        return allEvents;
    }

    private extractContractAddress(event: TransactionEvent): string {
        if (!event.topics[0]) {
            return "";
        }
        const address = Buffer.from(event.topics[0], "base64");
        return Address.fromBech32(address.toString()).bech32();
    }

    private decodeTopicAsString(topic: string): string {
        return Buffer.from(topic, "base64").toString();
    }
}
