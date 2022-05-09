/**
 * Bytecode of a Smart Contract, as an abstraction.
 */
export class Code {
    private readonly hex: string;

    private constructor(hex: string) {
        this.hex = hex;
    }

    /**
     * Creates a Code object from a buffer (sequence of bytes).
     */
    static fromBuffer(code: Buffer): Code {
        return new Code(code.toString("hex"));
    }

    /**
     * Returns the bytecode as a hex-encoded string.
     */
    toString(): string {
        return this.hex;
    }

    valueOf(): Buffer {
        return Buffer.from(this.hex, "hex");
    }
}
