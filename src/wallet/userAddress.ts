import * as bech32 from "bech32";
import { LibraryConfig } from "./config";
import { ErrBadAddress } from "./errors";

/**
 * @internal
 * For internal use only.
 */
export class UserAddress {
    private readonly buffer: Buffer;
    private readonly hrp: string;

    public constructor(buffer: Buffer, hrp?: string) {
        this.buffer = buffer;
        this.hrp = hrp || LibraryConfig.DefaultAddressHrp;
    }

    static newFromBech32(value: string): UserAddress {
        const { hrp, pubkey } = decodeFromBech32({ value, allowCustomHrp: true });
        return new UserAddress(pubkey, hrp);
    }

    /**
     * @internal
     * @deprecated
     */
    static fromBech32(value: string): UserAddress {
        // On this legacy flow, we do not accept addresses with custom hrp (in order to avoid behavioral breaking changes).
        const { hrp, pubkey } = decodeFromBech32({ value, allowCustomHrp: false });
        return new UserAddress(pubkey, hrp);
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

function decodeFromBech32(options: { value: string; allowCustomHrp: boolean }): { hrp: string; pubkey: Buffer } {
    const value = options.value;
    const allowCustomHrp = options.allowCustomHrp;

    let hrp: string;
    let pubkey: Buffer;

    try {
        const decoded = bech32.decode(value);

        hrp = decoded.prefix;
        pubkey = Buffer.from(bech32.fromWords(decoded.words));
    } catch (err: any) {
        throw new ErrBadAddress(value, err);
    }

    // Workaround, in order to avoid behavioral breaking changes on legacy flows.
    if (!allowCustomHrp && hrp != LibraryConfig.DefaultAddressHrp) {
        throw new ErrBadAddress(value);
    }

    return { hrp, pubkey };
}
