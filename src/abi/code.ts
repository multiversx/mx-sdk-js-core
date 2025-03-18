const createHasher = require("blake2b");
const CODE_HASH_LENGTH = 32;

/**
 * * @deprecated Use the bytecode directly
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
     * Creates a Code object from a hex-encoded string.
     */
    static fromHex(hex: string): Code {
        return new Code(hex);
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

    computeHash(): Buffer {
        const hash = createHasher(CODE_HASH_LENGTH).update(this.valueOf()).digest();

        return Buffer.from(hash);
    }
}
