import { IAddress } from "./interface";
import { DEFAULT_MESSAGE_VERSION, MESSAGE_PREFIX } from "./constants";
import { Address } from "./address";

const createKeccakHash = require("keccak");

export class Message {
    /**
     * Actual message being signed.
     */
    public data: Uint8Array;
    /**
     * The message signature.
     */
    public signature?: Uint8Array;
    /**
     * Address of the wallet that performed the signing operation.
     */
    public address?: IAddress;
    /**
     * Number representing the message version.
     */
    public version: number;

    constructor(options: { data: Uint8Array; signature?: Uint8Array; address?: IAddress; version?: number }) {
        this.data = options.data;
        this.signature = options.signature;
        this.address = options.address;
        this.version = options.version || DEFAULT_MESSAGE_VERSION;
    }
}

export class MessageComputer {
    constructor() {}

    computeBytesForSigning(message: Message): Uint8Array {
        const messageSize = Buffer.from(message.data.length.toString());
        const signableMessage = Buffer.concat([messageSize, message.data]);
        let bytesToHash = Buffer.concat([Buffer.from(MESSAGE_PREFIX), signableMessage]);

        return createKeccakHash("keccak256").update(bytesToHash).digest();
    }

    computeBytesForVerifying(message: Message): Uint8Array {
        return this.computeBytesForSigning(message);
    }

    packMessage(message: Message): {
        message: string;
        signature: string;
        address: string;
        version: number;
    } {
        return {
            message: Buffer.from(message.data).toString("hex"),
            signature: message.signature ? Buffer.from(message.signature).toString("hex") : "",
            address: message.address ? message.address.bech32() : "",
            version: message.version ? message.version : DEFAULT_MESSAGE_VERSION,
        };
    }

    unpackMessage(packedMessage: { message: string; signature?: string; address?: string; version?: number }): Message {
        const dataHex = this.trimHexPrefix(packedMessage.message);
        const data = Buffer.from(dataHex, "hex");

        const signatureHex = this.trimHexPrefix(packedMessage.signature || "");
        const signature = Buffer.from(signatureHex, "hex");

        let address: Address | undefined = undefined;
        if (packedMessage.address) {
            address = Address.fromBech32(packedMessage.address);
        }

        const version = packedMessage.version || DEFAULT_MESSAGE_VERSION;

        return new Message({
            data: data,
            signature: signature,
            address: address,
            version: version,
        });
    }

    private trimHexPrefix(data: string): string {
        if (data.startsWith("0x") || data.startsWith("0X")) {
            return data.slice(2);
        }
        return data;
    }
}
