import { IAddress } from "./interface";
import { Address } from "./primitives";

export class TransactionEvent {
    address: IAddress = new Address("");
    identifier: string = "";
    topics: TransactionEventTopic[] = [];
    dataPayload: TransactionEventData = new TransactionEventData(Buffer.from("", "utf8"));
    data: string = "";

    constructor(init?: Partial<TransactionEvent>) {
        Object.assign(this, init);
    }

    static fromHttpResponse(responsePart: {
        address: string,
        identifier: string,
        topics: string[],
        data: string
    }): TransactionEvent {
        let result = new TransactionEvent();
        result.address = new Address(responsePart.address);
        result.identifier = responsePart.identifier || "";
        result.topics = (responsePart.topics || []).map(topic => new TransactionEventTopic(topic));

        const raw_data = Buffer.from(responsePart.data || "", "base64")
        result.dataPayload = new TransactionEventData(raw_data);
        result.data = raw_data.toString();

        return result;
    }

    findFirstOrNoneTopic(predicate: (topic: TransactionEventTopic) => boolean): TransactionEventTopic | undefined {
        return this.topics.filter(topic => predicate(topic))[0];
    }

    getLastTopic(): TransactionEventTopic {
        return this.topics[this.topics.length - 1];
    }
}

export class TransactionEventData {
    private readonly raw: Buffer;

    constructor(data: Buffer) {
        this.raw = data;
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
