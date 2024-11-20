import { Address } from "./address";

export class TransactionEvent {
    address: Address = Address.empty();
    identifier: string = "";
    topics: Uint8Array[] = [];

    /**
     * @deprecated Use "dataPayload" instead.
     */
    data: string = "";
    dataPayload: Uint8Array = new Uint8Array();
    additionalData: Uint8Array[] = [];

    constructor(init?: Partial<TransactionEvent>) {
        Object.assign(this, init);
    }

    static fromHttpResponse(responsePart: {
        address: string;
        identifier: string;
        topics: string[];
        data: string;
        additionalData?: string[];
    }): TransactionEvent {
        console.log({ responsePart });
        let result = new TransactionEvent();
        result.address = new Address(responsePart.address);
        result.identifier = responsePart.identifier || "";
        result.topics = (responsePart.topics || []).map((topic) => Buffer.from(topic));

        result.dataPayload = Buffer.from(responsePart.data);
        result.additionalData = (responsePart.additionalData || []).map((data) => Buffer.from(data));
        result.data = result.dataPayload.toString();

        return result;
    }

    findFirstOrNoneTopic(predicate: (topic: Uint8Array) => boolean): Uint8Array | undefined {
        return this.topics.filter((topic) => predicate(topic))[0];
    }

    getLastTopic(): Uint8Array {
        return this.topics[this.topics.length - 1];
    }
}
