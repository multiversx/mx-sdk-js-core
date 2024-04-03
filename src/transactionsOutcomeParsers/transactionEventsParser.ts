import { ResultsParser } from "../smartcontracts";
import { EventDefinition } from "../smartcontracts/typesystem/event";
import { TransactionEvent } from "./resources";

interface IAbi {
    getEvent(name: string): EventDefinition;
}

export class TransactionEventsParser {
    private readonly legacyResultsParser: ResultsParser;
    private readonly abi: IAbi;
    private readonly firstTopicIsIdentifier: boolean;

    constructor(options: { abi: IAbi; firstTopicIsIdentifier?: boolean }) {
        this.legacyResultsParser = new ResultsParser();
        this.abi = options.abi;

        // By default, we consider that the first topic is the event identifier.
        // This is true for log entries emitted by smart contracts:
        // https://github.com/multiversx/mx-chain-vm-go/blob/v1.5.27/vmhost/contexts/output.go#L270
        // https://github.com/multiversx/mx-chain-vm-go/blob/v1.5.27/vmhost/contexts/output.go#L283
        this.firstTopicIsIdentifier = options.firstTopicIsIdentifier ?? true;
    }

    parseEvents(options: { events: TransactionEvent[] }): any[] {
        const results = [];

        for (const event of options.events) {
            const parsedEvent = this.parseEvent({ event });
            results.push(parsedEvent);
        }

        return results;
    }

    parseEvent(options: { event: TransactionEvent }): any {
        const topics = options.event.topics.map((topic) => Buffer.from(topic));
        const eventIdentifier = this.firstTopicIsIdentifier ? topics[0]?.toString() : options.event.identifier;

        if (this.firstTopicIsIdentifier) {
            topics.shift();
        }

        const dataItems = options.event.dataItems.map((dataItem) => Buffer.from(dataItem));
        const eventDefinition = this.abi.getEvent(eventIdentifier);

        const parsedEvent = this.legacyResultsParser.doParseEvent({
            topics: topics,
            dataItems: dataItems,
            eventDefinition: eventDefinition,
        });

        return parsedEvent;
    }
}
