import { IAddress } from "./interface";
import { Address } from "./primitives";

export class TransactionEvent {
    address: IAddress = new Address("");
    identifier: string = "";
    topics: TransactionEventTopic[] = [];

    /**
     * @deprecated Use "dataPayload" instead.
     */
    data: string = "";
    dataPayload: TransactionEventData = new TransactionEventData(Buffer.from("", "utf8"));
    additionalData: TransactionEventData[] = [];

    constructor(init?: Partial<TransactionEvent>) {
        Object.assign(this, init);
    }

    static fromHttpResponse(responsePart: {
        address: string,
        identifier: string,
        topics: string[],
        data: string,
        additionalData?: string[]
    }): TransactionEvent {
        let result = new TransactionEvent();
        result.address = new Address(responsePart.address);
        result.identifier = responsePart.identifier || "";
        result.topics = (responsePart.topics || []).map(topic => new TransactionEventTopic(topic));

        result.dataPayload = TransactionEventData.fromBase64(responsePart.data);
        result.additionalData = (responsePart.additionalData || []).map(TransactionEventData.fromBase64);
        result.data = result.dataPayload.toString();

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

    static fromBase64(str: string): TransactionEventData {
        return new TransactionEventData(Buffer.from(str || "", "base64"));
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
