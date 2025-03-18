import { Address } from "./address";
import { DEFAULT_MESSAGE_VERSION, MESSAGE_PREFIX, SDK_JS_SIGNER, UNKNOWN_SIGNER } from "./constants";

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
    public address?: Address;
    /**
     * Number representing the message version.
     */
    public version: number;
    /**
     * The library or tool that was used to sign the message.
     */
    public signer: string;

    constructor(options: {
        data: Uint8Array;
        signature?: Uint8Array;
        address?: Address;
        version?: number;
        signer?: string;
    }) {
        this.data = options.data;
        this.signature = options.signature;
        this.address = options.address;
        this.version = options.version || DEFAULT_MESSAGE_VERSION;
        this.signer = options.signer || SDK_JS_SIGNER;
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

    /**
     * returns the result of `computeBytesForSigning`
     */
    computeBytesForVerifying(message: Message): Uint8Array {
        return this.computeBytesForSigning(message);
    }

    packMessage(message: Message): {
        message: string;
        signature: string;
        address: string;
        version: number;
        signer: string;
    } {
        return {
            message: Buffer.from(message.data).toString("hex"),
            signature: message.signature ? Buffer.from(message.signature).toString("hex") : "",
            address: message.address ? message.address.toBech32() : "",
            version: message.version,
            signer: message.signer,
        };
    }

    /**
     * packedMessage should be the one obtained from calling `packMessage()`
     * should treat both 'legacy message' and current message
     */
    unpackMessage(packedMessage: {
        message: string;
        signature?: string;
        address?: string;
        version?: number;
        signer?: string;
    }): Message {
        const dataHex = this.trimHexPrefix(packedMessage.message);
        const data = Buffer.from(dataHex, "hex");

        const signatureHex = this.trimHexPrefix(packedMessage.signature || "");
        const signature = Buffer.from(signatureHex, "hex");

        let address: Address | undefined = undefined;
        if (packedMessage.address) {
            address = Address.newFromBech32(packedMessage.address);
        }

        const version = packedMessage.version || DEFAULT_MESSAGE_VERSION;
        const signer = packedMessage.signer || UNKNOWN_SIGNER;

        return new Message({
            data: data,
            signature: signature,
            address: address,
            version: version,
            signer: signer,
        });
    }

    private trimHexPrefix(data: string): string {
        if (data.startsWith("0x") || data.startsWith("0X")) {
            return data.slice(2);
        }
        return data;
    }
}
