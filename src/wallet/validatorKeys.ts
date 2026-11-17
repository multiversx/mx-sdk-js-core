import { ErrBadType, ErrInvalidArgument } from "../core/errors";
import { bytesFromInput, guardLength, isUint8Array } from "./assertions";
import { parseValidatorKey } from "./pem";

export const VALIDATOR_SECRETKEY_LENGTH = 32;
export const VALIDATOR_PUBKEY_LENGTH = 96;

type HerumiBls = typeof import("./herumiBls");
let herumiBls: HerumiBls | undefined;

/**
 * The BLS operations are loaded on first use (not when the package is loaded): setting up the curve takes a while,
 * and most applications never handle validator keys.
 */
function getHerumiBls(): HerumiBls {
    if (!herumiBls) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        herumiBls = require("./herumiBls");
    }

    return herumiBls!;
}

export class ValidatorSecretKey {
    private readonly secretKey: Buffer;
    private readonly scalar: bigint;
    private readonly publicKey: Buffer;

    constructor(buffer: Buffer | Uint8Array) {
        guardLength(buffer, VALIDATOR_SECRETKEY_LENGTH);
        const bytes = Buffer.from(bytesFromInput(buffer, "buffer"));

        // Fail fast (e.g. when loading a corrupted PEM file), instead of producing an all-zeros public key and signatures.
        if (!bytes.some((byte) => byte != 0)) {
            throw new ErrInvalidArgument("the validator secret key must not be zero");
        }

        const bls = getHerumiBls();
        const scalar = bls.secretKeyToScalar(bytes);

        // The secret key has to be lower than the order of the group. Such values are not reduced (which would silently change the key).
        if (!bls.isValidSecretScalar(scalar)) {
            throw new ErrInvalidArgument("the validator secret key is out of range");
        }

        this.secretKey = bytes;
        this.scalar = scalar;
        this.publicKey = Buffer.from(bls.computePublicKey(scalar));
    }

    static fromPem(text: string, index: number = 0) {
        return parseValidatorKey(text, index);
    }

    generatePublicKey(): ValidatorPublicKey {
        return new ValidatorPublicKey(this.publicKey);
    }

    sign(message: Buffer | Uint8Array): Buffer {
        const signature = getHerumiBls().sign(this.scalar, messageToBytes(message));
        return Buffer.from(signature);
    }

    hex(): string {
        return this.valueOf().toString("hex");
    }

    valueOf(): Buffer {
        // A copy, so that the key can't be altered through the returned buffer.
        return Buffer.from(this.secretKey);
    }

    /**
     * Used by "JSON.stringify()", also when the key is held by another object (e.g. a signer).
     * The secret key is deliberately left out: use "hex()" or "valueOf()" to export it.
     */
    toJSON(): object {
        return {};
    }

    /**
     * Used by Node.js when the key is displayed (e.g. "console.log()", "util.inspect()"), also when the key is held by another object.
     * The secret key is deliberately left out, so that it does not end up in logs.
     */
    [Symbol.for("nodejs.util.inspect.custom")](): string {
        return "ValidatorSecretKey {}";
    }
}

/**
 * The declared type of a message is "Buffer | Uint8Array". Though, types are erased at runtime, and strings and arrays
 * have always been accepted as well (and converted as below). Kept for backwards compatibility.
 */
function messageToBytes(message: any): Uint8Array {
    // Not "instanceof", so that a Uint8Array (or Buffer) created in another realm (e.g. iframe, "vm" context, jest with jsdom) is accepted, as well.
    if (isUint8Array(message)) {
        try {
            // A copy, as a Uint8Array of this realm: the underlying library would reject, e.g., a Buffer created in another one.
            // The actual content is copied, no matter what the properties of the object (e.g. "length", "buffer") claim.
            return new Uint8Array(message);
        } catch {
            throw new ErrBadType("message", "Uint8Array", "a Uint8Array whose memory is not available (e.g. detached)");
        }
    }

    const text = stringValueOf(message);

    if (text !== undefined) {
        // One byte per character (UTF-16 code unit): the low byte of its code. For ASCII strings, this is the usual encoding.
        const bytes = new Uint8Array(text.length);

        for (let i = 0; i < text.length; i++) {
            bytes[i] = text.charCodeAt(i) & 0xff;
        }

        return bytes;
    }

    if (Array.isArray(message)) {
        return Uint8Array.from(message);
    }

    // The type is not decided by "Object.prototype.toString()": any object can claim any tag (by means of "Symbol.toStringTag").
    const tag = Object.prototype.toString.call(message);
    const isMisleadingTag = ["[object Uint8Array]", "[object String]", "[object Array]"].includes(tag);
    throw new ErrBadType("message", "Uint8Array", isMisleadingTag ? `an object that only claims to be ${tag}` : tag);
}

/**
 * Gives the content of a string or of a String object (no matter the realm it was created in), and "undefined" for anything else.
 */
function stringValueOf(value: any): string | undefined {
    if (typeof value === "string") {
        return value;
    }

    try {
        // Reads the internal slot of a String object (and throws for anything else).
        return String.prototype.valueOf.call(value);
    } catch {
        return undefined;
    }
}

export class ValidatorPublicKey {
    private readonly buffer: Buffer;

    constructor(buffer: Buffer | Uint8Array) {
        guardLength(buffer, VALIDATOR_PUBKEY_LENGTH);

        this.buffer = Buffer.from(buffer);
    }

    /**
     * Tells whether the signature is the one of the data, under this public key.
     *
     * Resolves to "false" for any signature that is not valid, including the ones that are malformed (e.g. wrong length, not a point of the curve).
     * Also resolves to "false" if the public key itself is not valid (the constructor only checks its length).
     * Rejects with "ErrBadType" if the data or the signature are not bytes.
     *
     * Asynchronous, as "UserPublicKey.verify()" is: the outcome must be awaited (a promise that is not awaited is always truthy).
     */
    async verify(data: Buffer | Uint8Array, signature: Buffer | Uint8Array): Promise<boolean> {
        // Same conversion as for "ValidatorSecretKey.sign()", so that whatever can be signed can also be verified.
        const dataBytes = messageToBytes(data);
        const signatureBytes = bytesFromInput(signature, "signature");

        return getHerumiBls().verify(this.buffer, dataBytes, signatureBytes);
    }

    hex(): string {
        return this.buffer.toString("hex");
    }

    valueOf(): Buffer {
        // A copy, so that the key can't be altered through the returned buffer.
        return Buffer.from(this.buffer);
    }
}
