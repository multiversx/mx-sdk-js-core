import { Address } from ".";
import { ErrTransactionEventNotFound } from "./errors";

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

    findEventByIdentifier(identifier: string) {
        let event = this.events.filter(event => event.identifier == identifier)[0];
        if (event) {
            return event;
        }

        throw new ErrTransactionEventNotFound(identifier);
    }
}

export class TransactionEvent {
    readonly address: Address;
    readonly identifier: string;
    readonly topics: TransactionEventTopic[];

    constructor(address: Address, identifier: string, topics: TransactionEventTopic[]) {
        this.address = address;
        this.identifier = identifier;
        this.topics = topics;
    }

    static fromHttpResponse(responsePart: {
        address: string,
        identifier: string,
        topics: string[]
    }): TransactionEvent {
        let topics = (responsePart.topics || []).map(topic => new TransactionEventTopic(topic));
        let address = new Address(responsePart.address);
        let identifier = responsePart.identifier || "";
        let event = new TransactionEvent(address, identifier, topics);
        return event;
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

    valueOf(): Buffer {
        return this.raw;
    }
}
