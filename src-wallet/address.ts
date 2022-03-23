import * as bech32 from "bech32";

/**
 * The human-readable-part of the bech32 addresses.
 */
const HRP = "erd";

/**
 * An Elrond Address, as an immutable object.
 */
export class Address {
    private readonly buffer: Buffer;

    public constructor(buffer: Buffer) {
        this.buffer = buffer;
    }

    /**
     * Returns the hex representation of the address (pubkey)
     */
    hex(): string {
        return this.buffer.toString("hex");
    }

    /**
     * Returns the bech32 representation of the address
     */
    bech32(): string {
        let words = bech32.toWords(this.pubkey());
        let address = bech32.encode(HRP, words);
        return address;
    }

    /**
     * Returns the pubkey as raw bytes (buffer)
     */
    pubkey(): Buffer {
        return this.buffer;
    }

    /**
     * Returns whether the address is empty.
     */
    isEmpty() {
        return !this.buffer;
    }

    /**
     * Compares the address to another address
     */
    equals(other: Address): boolean {
        return this.buffer.compare(other.buffer) == 0;
    }

    /**
     * Returns the bech32 representation of the address
     */
    toString(): string {
        return this.bech32();
    }

    /**
     * Converts the address to a pretty, plain JavaScript object.
     */
    toJSON(): object {
        return {
            bech32: this.bech32(),
            pubkey: this.hex()
        };
    }
}
