import * as bech32 from "bech32";
import { ErrBadAddress } from "./errors";

/**
 * The human-readable-part of the bech32 addresses.
 */
const DEFAULT_HRP = "erd";

/**
 * A user Address, as an immutable object.
 */
export class UserAddress {
    private readonly buffer: Buffer;
    private readonly hrp: string;

    public constructor(buffer: Buffer, hrp?: string) {
        this.buffer = buffer;
        this.hrp = hrp || DEFAULT_HRP;
    }

    static fromBech32(value: string): UserAddress {
        let decoded;

        try {
            decoded = bech32.decode(value);
        } catch (err: any) {
            throw new ErrBadAddress(value, err);
        }

        if (decoded.prefix != DEFAULT_HRP) {
            throw new ErrBadAddress(value);
        }

        let pubkey = Buffer.from(bech32.fromWords(decoded.words));
        return new UserAddress(pubkey, decoded.prefix);
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
        const words = bech32.toWords(this.pubkey());
        const address = bech32.encode(this.hrp, words);
        return address;
    }

    /**
     * Returns the pubkey as raw bytes (buffer)
     */
    pubkey(): Buffer {
        return this.buffer;
    }

    /**
     * Returns the human-readable-part of the bech32 addresses.
     */
    getHrp(): string {
        return this.hrp;
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
