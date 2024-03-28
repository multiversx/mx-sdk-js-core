import * as errors from "./errors";

const SIGNATURE_LENGTH = 64;

/**
 * Signature, as an immutable object.
 */
export class Signature {
    private valueHex: string = "";

    constructor(value?: string | Buffer) {
        if (!value) {
            return;
        }
        if (typeof value === "string") {
            return Signature.fromHex(value);
        }
        if (value instanceof Buffer) {
            return Signature.fromBuffer(value);
        }
    }

    static empty(): Signature {
        return new Signature();
    }

    static fromHex(value: string): Signature {
        if (value.startsWith("0x")) {
            value = value.slice(2);
        }
        if (!Signature.isValidHex(value)) {
            throw new errors.ErrSignatureCannotCreate(value);
        }

        return Signature.fromValidHex(value);
    }

    private static isValidHex(value: string) {
        return Buffer.from(value, "hex").length == SIGNATURE_LENGTH;
    }

    private static fromValidHex(value: string): Signature {
        let result = new Signature();
        result.valueHex = value;
        return result;
    }

    static fromBuffer(buffer: Buffer): Signature {
        if (buffer.length != SIGNATURE_LENGTH) {
            throw new errors.ErrSignatureCannotCreate(buffer);
        }

        return Signature.fromValidHex(buffer.toString("hex"));
    }

    hex() {
        return this.valueHex;
    }
}

export function interpretSignatureAsBuffer(signature: { hex(): string } | Uint8Array): Buffer {
    if (ArrayBuffer.isView(signature)) {
        return Buffer.from(signature);
    } else if ((<any>signature).hex != null) {
        return Buffer.from(signature.hex(), "hex");
    }

    throw new Error(`Object cannot be interpreted as a signature: ${signature}`);
}
