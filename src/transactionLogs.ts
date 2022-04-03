import { Address } from "./address";
import { ErrTransactionEventNotFound, ErrUnexpectedCondition } from "./errors";

export class TransactionLogs {
    readonly address: Address;
    readonly events: TransactionEvent[];

    constructor(address: Address, events: TransactionEvent[]) {
        this.address = address;
        this.events = events;
    }

    static empty(): TransactionLogs {
        return new TransactionLogs(new Address(), []);
    }

    static fromHttpResponse(logs: any): TransactionLogs {
        let address = new Address(logs.address);
        let events = (logs.events || []).map((event: any) => TransactionEvent.fromHttpResponse(event));
        return new TransactionLogs(address, events);
    }

    findSingleOrNoneEvent(identifier: string, predicate?: (event: TransactionEvent) => boolean): TransactionEvent | undefined {
        let events = this.findEvents(identifier, predicate);

        if (events.length > 1) {
            throw new ErrUnexpectedCondition(`more than one event of type ${identifier}`);
        }

        return events[0];
    }

    findFirstOrNoneEvent(identifier: string, predicate?: (event: TransactionEvent) => boolean): TransactionEvent | undefined {
        return this.findEvents(identifier, predicate)[0];
    }

    findEvents(identifier: string, predicate?: (event: TransactionEvent) => boolean): TransactionEvent[] {
        let events = this.events.filter(event => event.identifier == identifier);

        if (predicate) {
            events = events.filter(event => predicate(event));
        }

        return events;
    }
}

export class TransactionEvent {
    readonly address: Address;
    readonly identifier: string;
    readonly topics: TransactionEventTopic[];
    readonly data: string;

    constructor(address: Address, identifier: string, topics: TransactionEventTopic[], data: string) {
        this.address = address;
        this.identifier = identifier;
        this.topics = topics;
        this.data = data;
    }

    static fromHttpResponse(responsePart: {
        address: string,
        identifier: string,
        topics: string[],
        data: string
    }): TransactionEvent {
        let topics = (responsePart.topics || []).map(topic => new TransactionEventTopic(topic));
        let address = new Address(responsePart.address);
        let identifier = responsePart.identifier || "";
        let data = Buffer.from(responsePart.data || "", "base64").toString();
        let event = new TransactionEvent(address, identifier, topics, data);
        return event;
    }

    findFirstOrNoneTopic(predicate: (topic: TransactionEventTopic) => boolean): TransactionEventTopic | undefined {
        return this.topics.filter(topic => predicate(topic))[0];
    }

    getLastTopic(): TransactionEventTopic {
        return this.topics[this.topics.length - 1];
    }
}

export class TransactionEventTopic {
    private readonly raw: Buffer;

    constructor(topic: string) {
        this.raw = Buffer.from(topic || "", "base64");
    }

    toString() {
        return this.raw.toString("utf8");
    }

    hex() {
        return this.raw.toString("hex");
    }

    valueOf(): Buffer {
        return this.raw;
    }
}
