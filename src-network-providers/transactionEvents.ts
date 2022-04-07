import { IAddress } from "./interface";
import { Address } from "./primitives";

export class TransactionEvent {
    readonly address: IAddress;
    readonly identifier: string;
    readonly topics: TransactionEventTopic[];
    readonly data: string;

    constructor(address: IAddress, identifier: string, topics: TransactionEventTopic[], data: string) {
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

    toString(): string {
        return this.raw.toString("utf8");
    }

    hex(): string {
        return this.raw.toString("hex");
    }

    valueOf(): Buffer {
        return this.raw;
    }
}
