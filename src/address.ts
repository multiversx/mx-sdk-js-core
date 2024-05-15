import * as bech32 from "bech32";
import BigNumber from "bignumber.js";
import { LibraryConfig } from "./config";
import { CURRENT_NUMBER_OF_SHARDS_WITHOUT_META, METACHAIN_ID, WasmVirtualMachine } from "./constants";
import * as errors from "./errors";
import { bigIntToBuffer } from "./tokenOperations/codec";
const createKeccakHash = require("keccak");

/**
 * The length (in bytes) of a public key (from which a bech32 address can be obtained).
 */
const PUBKEY_LENGTH = 32;

const SMART_CONTRACT_HEX_PUBKEY_PREFIX = "0".repeat(16);

interface IAddress {
    getPublicKey(): Buffer;
    getHrp(): string;
}

/**
 * An Address, as an immutable object.
 */
export class Address {
    private readonly publicKey: Buffer;
    private readonly hrp: string;

    /**
     * Creates an address object, given a raw string (whether a hex pubkey or a Bech32 address), a sequence of bytes, or another Address object.
     */
    public constructor(value: Address | Uint8Array | string, hrp?: string) {
        // Legacy flow.
        if (!value) {
            this.publicKey = Buffer.from([]);
            this.hrp = hrp || LibraryConfig.DefaultAddressHrp;

            return;
        }

        // The only flow that's following the specs.
        if (ArrayBuffer.isView(value)) {
            if (value.length != PUBKEY_LENGTH) {
                throw new errors.ErrAddressCannotCreate(value);
            }

            this.publicKey = Buffer.from(value);
            this.hrp = hrp || LibraryConfig.DefaultAddressHrp;

            return;
        }

        // Legacy flow.
        if (value instanceof Address) {
            if (hrp) {
                throw new errors.ErrInvalidArgument(
                    "this variant of the Address constructor does not accept the 'hrp' argument",
                );
            }

            this.publicKey = value.publicKey;
            this.hrp = value.hrp;

            return;
        }

        // Legacy flow.
        if (typeof value === "string") {
            if (Address.isValidHex(value)) {
                this.publicKey = Buffer.from(value, "hex");
                this.hrp = hrp || LibraryConfig.DefaultAddressHrp;

                return;
            }

            if (hrp) {
                throw new errors.ErrInvalidArgument(
                    "this variant of the Address constructor does not accept the 'hrp' argument",
                );
            }

            // On this legacy flow, we do not accept addresses with custom hrp (in order to avoid behavioral breaking changes).
            const { hrp: decodedHrp, pubkey } = decodeFromBech32({ value, allowCustomHrp: false });
            this.publicKey = pubkey;
            this.hrp = decodedHrp;

            return;
        }

        throw new errors.ErrAddressCannotCreate(value);
    }

    /**
     * Creates an address object from a bech32-encoded string
     */
    static newFromBech32(value: string): Address {
        const { hrp, pubkey } = decodeFromBech32({ value, allowCustomHrp: true });
        return new Address(pubkey, hrp);
    }

    /**
     * Use {@link newFromBech32} instead.
     */
    static fromBech32(value: string): Address {
        // On this legacy flow, we do not accept addresses with custom hrp (in order to avoid behavioral breaking changes).
        const { hrp, pubkey } = decodeFromBech32({ value, allowCustomHrp: false });
        return new Address(pubkey, hrp);
    }

    /**
     * Creates an address object from a hex-encoded string
     */
    static newFromHex(value: string, hrp?: string): Address {
        if (!Address.isValidHex(value)) {
            throw new errors.ErrAddressCannotCreate(value);
        }

        return new Address(Buffer.from(value, "hex"), hrp);
    }

    /**
     * Use {@link newFromHex} instead.
     */
    static fromHex(value: string, hrp?: string): Address {
        return Address.newFromHex(value, hrp);
    }

    /**
     * @deprecated Constructing an address object from another object is deprecated.
     */
    static fromAddress(address: Address): Address {
        return new Address(address);
    }

    /**
     * @deprecated Use the constructor, instead.
     */
    static fromBuffer(buffer: Buffer, hrp?: string): Address {
        return new Address(buffer, hrp);
    }

    /**
     * @deprecated Use {@link newFromBech32} or {@link newFromHex}.
     */
    static fromString(value: string, hrp?: string): Address {
        return new Address(value, hrp);
    }

    private static isValidHex(value: string) {
        return Buffer.from(value, "hex").length == PUBKEY_LENGTH;
    }

    /**
     * Creates an empty address object.
     * Generally speaking, this should not be used by client code (internal use only).
     */
    static empty(): Address {
        return new Address("");
    }

    /**
     * Performs address validation without throwing errors
     */
    static isValid(value: string): boolean {
        const decoded = bech32.decodeUnsafe(value);
        const prefix = decoded?.prefix;
        const pubkey = decoded ? Buffer.from(bech32.fromWords(decoded.words)) : undefined;

        if (prefix !== LibraryConfig.DefaultAddressHrp || pubkey?.length !== PUBKEY_LENGTH) {
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

        return this.publicKey.toString("hex");
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
        let address = bech32.encode(this.hrp, words);
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
        return this.publicKey;
    }

    /**
     * Returns the human-readable-part of the bech32 addresses.
     */
    getHrp(): string {
        return this.hrp;
    }

    /**
     * Returns whether the address is empty.
     */
    isEmpty() {
        return this.publicKey.length == 0;
    }

    /**
     * Compares the address to another address
     */
    equals(other: Address | null): boolean {
        if (!other) {
            return false;
        }

        return this.publicKey.toString() == other.publicKey.toString();
    }

    /**
     * Returns the bech32 representation of the address
     */
    toString(): string {
        return this.toBech32();
    }

    /**
     * Converts the address to a pretty, plain JavaScript object.
     */
    toJSON(): object {
        return {
            bech32: this.toBech32(),
            pubkey: this.toHex(),
        };
    }

    /**
     * Creates the Zero address (the one that should be used when deploying smart contracts).
     * Generally speaking, this should not be used by client code (internal use only).
     */
    static Zero(): Address {
        return new Address("0".repeat(64));
    }

    /**
     * Use {@link isSmartContract} instead.
     */
    isContractAddress(): boolean {
        return this.isSmartContract();
    }

    /**
     * Returns whether the address is a smart contract address.
     */
    isSmartContract(): boolean {
        return this.toHex().startsWith(SMART_CONTRACT_HEX_PUBKEY_PREFIX);
    }
}

export class AddressComputer {
    private readonly numberOfShardsWithoutMeta: number;

    constructor(numberOfShardsWithoutMeta?: number) {
        this.numberOfShardsWithoutMeta = numberOfShardsWithoutMeta || CURRENT_NUMBER_OF_SHARDS_WITHOUT_META;
    }

    computeContractAddress(deployer: IAddress, deploymentNonce: bigint): Address {
        const initialPadding = Buffer.alloc(8, 0);
        const ownerPubkey = deployer.getPublicKey();
        const shardSelector = ownerPubkey.slice(30);
        const ownerNonceBytes = Buffer.alloc(8);

        const bigNonce = new BigNumber(deploymentNonce.toString());
        const bigNonceBuffer = bigIntToBuffer(bigNonce);
        ownerNonceBytes.write(bigNonceBuffer.reverse().toString("hex"), "hex");

        const bytesToHash = Buffer.concat([ownerPubkey, ownerNonceBytes]);
        const hash = createKeccakHash("keccak256").update(bytesToHash).digest();
        const vmTypeBytes = Buffer.from(WasmVirtualMachine, "hex");
        const addressBytes = Buffer.concat([initialPadding, vmTypeBytes, hash.slice(10, 30), shardSelector]);

        return new Address(addressBytes);
    }

    getShardOfAddress(address: IAddress): number {
        return this.getShardOfPubkey(address.getPublicKey(), this.numberOfShardsWithoutMeta);
    }

    private getShardOfPubkey(pubkey: Uint8Array, numberOfShards: number): number {
        const maskHigh: number = parseInt("11", 2);
        const maskLow: number = parseInt("01", 2);

        const lastByteOfPubkey: number = pubkey[31];

        if (this.isPubkeyOfMetachain(pubkey)) {
            return METACHAIN_ID;
        }

        let shard: number = lastByteOfPubkey & maskHigh;
        if (shard > numberOfShards - 1) {
            shard = lastByteOfPubkey & maskLow;
        }

        return shard;
    }

    private isPubkeyOfMetachain(pubkey: Uint8Array): boolean {
        const metachainPrefix = Buffer.from([
            0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        ]);
        const pubkeyPrefix = Buffer.from(pubkey).slice(0, metachainPrefix.length);

        if (metachainPrefix.equals(pubkeyPrefix)) {
            return true;
        }

        const zeroAddress = Buffer.alloc(32);
        if (zeroAddress.equals(Buffer.from(pubkey))) {
            return true;
        }

        return false;
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
        throw new errors.ErrAddressCannotCreate(value, err);
    }

    // Workaround, in order to avoid behavioral breaking changes on legacy flows.
    // In a future major release, we should drop this constraint (not exactly useful, validation should be performed in other ways)
    if (!allowCustomHrp && hrp != LibraryConfig.DefaultAddressHrp) {
        throw new errors.ErrAddressBadHrp(LibraryConfig.DefaultAddressHrp, hrp);
    }

    return { hrp, pubkey };
}
