/**
 * Signature, as an immutable object.
 */
export class Signature {
    private readonly buffer: Buffer;

    constructor(buffer: Buffer) {
        this.buffer = buffer;
    }

    hex() {
        return this.buffer.toString("hex");
    }
}
