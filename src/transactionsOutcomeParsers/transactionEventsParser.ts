import { ResultsParser } from "../smartcontracts";
import { EventDefinition } from "../smartcontracts/typesystem/event";
import { TransactionEvent } from "./resources";

interface IAbi {
    getEvent(name: string): EventDefinition;
}

export class TransactionEventsParser {
    private readonly abi: IAbi;
    private readonly legacyResultsParser: ResultsParser;

    constructor(options: { abi: IAbi }) {
        this.abi = options.abi;
        this.legacyResultsParser = new ResultsParser();
    }

    parseEvents(options: { events: TransactionEvent[]; firstTopicIsIdentifier?: boolean }): any[] {
        const firstTopicIsIdentifier = options.firstTopicIsIdentifier;
        const results = [];

        for (const event of options.events) {
            const parsedEvent = this.parseEvent({ event, firstTopicIsIdentifier });
            results.push(parsedEvent);
        }

        return results;
    }

    parseEvent(options: { event: TransactionEvent; firstTopicIsIdentifier?: boolean }): any {
        // By default, we consider that the first topic is the event identifier.
        // This is true for log entries emitted by smart contracts:
        // https://github.com/multiversx/mx-chain-vm-go/blob/v1.5.27/vmhost/contexts/output.go#L283
        const firstTopicIsIdentifier =
            options.firstTopicIsIdentifier === undefined ? true : options.firstTopicIsIdentifier;

        const topics = options.event.topics.map((topic) => Buffer.from(topic));
        const dataItems = options.event.dataItems.map((dataItem) => Buffer.from(dataItem));
        const eventDefinition = this.abi.getEvent(options.event.identifier);

        if (firstTopicIsIdentifier) {
            // Discard the first topic (not useful).
            topics.shift();
        }

        const parsedEvent = this.legacyResultsParser.doParseEvent({
            topics: topics,
            dataItems: dataItems,
            eventDefinition: eventDefinition,
        });

        return parsedEvent;
    }
}
