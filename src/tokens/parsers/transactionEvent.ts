import { IAddress } from "../interface";
import { ITransactionEvent, ITransactionEventTopic } from "./interface";

export class TransactionEvent implements ITransactionEvent {
    address: IAddress = "";
    identifier: string = "";
    topics: ITransactionEventTopic[] = [];
    data: string = "";

    constructor(init?: Partial<ITransactionEvent>) {
        Object.assign(this, init);
    }

    static fromAny(responsePart: {
        address: string,
        identifier: string,
        topics: string[],
        data: string
    }): TransactionEvent {
        let result = new TransactionEvent();
        result.address = responsePart.address;
        result.identifier = responsePart.identifier || "";
        result.topics = (responsePart.topics || []).map(topic => new TransactionEventTopic(topic));
        result.data = Buffer.from(responsePart.data || "", "base64").toString();

        return result;
    }
}

export class TransactionEventTopic implements ITransactionEventTopic {
    private readonly raw: Buffer;

    constructor(topic: string) {
        this.raw = Buffer.from(topic || "", "base64");
    }

    valueOf(): Buffer {
        return this.raw;
    }
}
