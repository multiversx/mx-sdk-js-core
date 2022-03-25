import * as bech32 from "bech32";
import { ErrBadAddress } from "./errors";

/**
 * The human-readable-part of the bech32 addresses.
 */
const HRP = "erd";

/**
 * A user Address, as an immutable object.
 */
export class UserAddress {
    private readonly buffer: Buffer;

    public constructor(buffer: Buffer) {
        this.buffer = buffer;
    }

    static fromBech32(value: string): UserAddress {
        let decoded;

        try {
            decoded = bech32.decode(value);
        } catch (err: any) {
            throw new ErrBadAddress(value, err);
        }

        if (decoded.prefix != HRP) {
            throw new ErrBadAddress(value);
        }

        let pubkey = Buffer.from(bech32.fromWords(decoded.words));
        return new UserAddress(pubkey);
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
