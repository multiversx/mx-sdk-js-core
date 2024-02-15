import * as bech32 from "bech32";
import * as errors from "./errors";

/**
 * The human-readable-part of the bech32 addresses.
 */
const HRP = "erd";

/**
 * The length (in bytes) of a public key (from which a bech32 address can be obtained).
 */
const PUBKEY_LENGTH = 32;

const SMART_CONTRACT_HEX_PUBKEY_PREFIX = "0".repeat(16);

/**
 * An Address, as an immutable object.
 */
export class Address {
    // We keep a hex-encoded string as the "backing" value
    private valueHex: string = "";

    /**
     * Creates an address object, given a raw string (whether a hex pubkey or a Bech32 address), a sequence of bytes, or another Address object.
     */
    public constructor(value: Address | Buffer | string) {
        if (!value) {
            return;
        }
        if (value instanceof Address) {
            return Address.fromAddress(value);
        }
        if (value instanceof Buffer) {
            return Address.fromBuffer(value);
        }
        if (typeof value === "string") {
            return Address.fromString(value);
        }

        throw new errors.ErrAddressCannotCreate(value);
    }

    /**
     * Creates an address object from another address object
     */
    static fromAddress(address: Address): Address {
        return Address.fromValidHex(address.valueHex);
    }

    private static fromValidHex(value: string): Address {
        let result = Address.empty();
        result.valueHex = value;
        return result;
    }

    /**
     * Creates an address object from a Buffer
     */
    static fromBuffer(buffer: Buffer): Address {
        if (buffer.length != PUBKEY_LENGTH) {
            throw new errors.ErrAddressCannotCreate(buffer);
        }

        return Address.fromValidHex(buffer.toString("hex"));
    }

    /**
     * Creates an address object from a string (hex or bech32)
     */
    static fromString(value: string): Address {
        if (Address.isValidHex(value)) {
            return Address.fromValidHex(value);
        }

        return Address.fromBech32(value);
    }

    private static isValidHex(value: string) {
        return Buffer.from(value, "hex").length == PUBKEY_LENGTH;
    }

    /**
     * Creates an address object from a hex-encoded string
     */
    static fromHex(value: string): Address {
        if (!Address.isValidHex(value)) {
            throw new errors.ErrAddressCannotCreate(value);
        }

        return Address.fromValidHex(value);
    }

    /**
     * Creates an empty address object. Generally speaking, this should not be used in client code (internal use only).
     */
    static empty(): Address {
        return new Address("");
    }

    /**
     * Creates an address object from a bech32-encoded string
     */
    static fromBech32(value: string): Address {
        let decoded;

        try {
            decoded = bech32.decode(value);
        } catch (err: any) {
            throw new errors.ErrAddressCannotCreate(value, err);
        }

        let prefix = decoded.prefix;
        if (prefix != HRP) {
            throw new errors.ErrAddressBadHrp(HRP, prefix);
        }

        let pubkey = Buffer.from(bech32.fromWords(decoded.words));
        if (pubkey.length != PUBKEY_LENGTH) {
            throw new errors.ErrAddressCannotCreate(value);
        }

        return Address.fromValidHex(pubkey.toString("hex"));
    }

    /**
     * Performs address validation without throwing errors
     */
    static isValid(value: string): boolean {
        const decoded = bech32.decodeUnsafe(value);
        const prefix = decoded?.prefix;
        const pubkey = decoded ? Buffer.from(bech32.fromWords(decoded.words)) : undefined;

        if (prefix !== HRP || pubkey?.length !== PUBKEY_LENGTH) {
            return false;
        }

        return true;
    }

    /**
     * Use {@link toHex} instead.
     */
    hex(): string {
        return this.toHex();
    }

    /**
     * Returns the hex representation of the address (pubkey)
     */
    toHex(): string {
        if (this.isEmpty()) {
            return "";
        }

        return this.valueHex;
    }

    /**
     * Use {@link toBech32} instead.
     */
    bech32(): string {
        return this.toBech32();
    }

    /**
     * Returns the bech32 representation of the address
     */
    toBech32(): string {
        if (this.isEmpty()) {
            return "";
        }

        let words = bech32.toWords(this.pubkey());
        let address = bech32.encode(HRP, words);
        return address;
    }

    /**
     * Use {@link getPublicKey} instead.
     */
    pubkey(): Buffer {
        return this.getPublicKey();
    }

    /**
     * Returns the pubkey as raw bytes (buffer)
     */
    getPublicKey(): Buffer {
        if (this.isEmpty()) {
            return Buffer.from([]);
        }

        return Buffer.from(this.valueHex, "hex");
    }

    /**
     * Returns whether the address is empty.
     */
    isEmpty() {
        return !this.valueHex;
    }

    /**
     * Compares the address to another address
     */
    equals(other: Address | null): boolean {
        if (!other) {
            return false;
        }

        return this.valueHex == other.valueHex;
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
            pubkey: this.hex(),
        };
    }

    /**
     * Creates the Zero address (the one that should be used when deploying smart contracts)
     */
    static Zero(): Address {
        return new Address("0".repeat(64));
    }

    /**
     * Use {@link isSmartContract} instead.
     */
    isContractAddress(): boolean {
        return this.hex().startsWith(SMART_CONTRACT_HEX_PUBKEY_PREFIX);
    }

    /**
     * Returns whether the address is a smart contract address.
     */
    isSmartContract(): boolean {
        return this.isContractAddress();
    }
}
