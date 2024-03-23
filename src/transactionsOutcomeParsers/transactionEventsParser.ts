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

    parseEvents(options: { events: TransactionEvent[] }): any[] {
        const results = [];

        for (const event of options.events) {
            const parsedEvent = this.parseEvent({ event });
            results.push(parsedEvent);
        }

        return results;
    }

    parseEvent(options: { event: TransactionEvent }): any {
        const eventDefinition = this.abi.getEvent(options.event.identifier);
        const parsedEvent = this.legacyResultsParser.parseEvent(
            {
                topics: options.event.topics,
                dataPayload: options.event.data,
                additionalData: options.event.additionalData,
            },
            eventDefinition,
        );

        return parsedEvent;
    }
}
