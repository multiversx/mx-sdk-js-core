/**
 * Signature, as an immutable object.
 */
export class Signature {
    private readonly buffer: Buffer;

    constructor(buffer: Buffer | Uint8Array) {
        this.buffer = Buffer.from(buffer);
    }

    hex() {
        return this.buffer.toString("hex");
    }
}
