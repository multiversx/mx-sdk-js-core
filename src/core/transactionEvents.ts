import { Address } from "./address";

export class TransactionEvent {
    raw: Record<string, any> = {};
    address: Address = Address.empty();
    identifier: string = "";
    topics: Uint8Array[] = [];

    data: Uint8Array = new Uint8Array();
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
        let result = new TransactionEvent();
        result.address = new Address(responsePart.address);
        result.identifier = responsePart.identifier || "";
        result.topics = (responsePart.topics || []).map((topic) => Buffer.from(topic, "base64"));

        result.data = Buffer.from(responsePart.data ?? "", "base64");
        result.additionalData = (responsePart.additionalData || []).map((data) => Buffer.from(data, "base64"));
        result.raw = responsePart;

        return result;
    }
}
