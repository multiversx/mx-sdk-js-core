export const CodeMetadataLength = 2;

/**
 * The metadata of a Smart Contract, as an abstraction.
 */
export class CodeMetadata {
    public upgradeable: boolean;
    public readable: boolean;
    public payable: boolean;
    public payableBySc: boolean;

    static ByteZero = {
        Upgradeable: 1,
        Reserved2: 2,
        Readable: 4,
    };

    static ByteOne = {
        Reserved1: 1,
        Payable: 2,
        PayableBySc: 4,
    };

    /**
     * Creates a metadata object. By default, set the `upgradeable` attribute, and uset all others.
     *
     * @param upgradeable Whether the contract is upgradeable
     * @param readable Whether other contracts can read this contract's data (without calling one of its pure functions)
     * @param payable Whether the contract is payable
     * @param payableBySc Whether the contract is payable by other smart contracts
     */
    constructor(
        upgradeable: boolean = true,
        readable: boolean = false,
        payable: boolean = false,
        payableBySc: boolean = false,
    ) {
        this.upgradeable = upgradeable;
        this.readable = readable;
        this.payable = payable;
        this.payableBySc = payableBySc;
    }

    /**
     * Named constructor
     * Creates a metadata object from a buffer.
     * Also checks that data has correct length (2 bytes)
     */
    static newFromBytes(bytes: Uint8Array): CodeMetadata {
        if (bytes.length != CodeMetadataLength) {
            throw new Error(`code metadata buffer has length ${bytes.length}, expected ${CodeMetadataLength}`);
        }

        const byteZero = bytes[0];
        const byteOne = bytes[1];

        const upgradeable = (byteZero & CodeMetadata.ByteZero.Upgradeable) !== 0;
        const readable = (byteZero & CodeMetadata.ByteZero.Readable) !== 0;
        const payable = (byteOne & CodeMetadata.ByteOne.Payable) !== 0;
        const payableBySc = (byteOne & CodeMetadata.ByteOne.PayableBySc) !== 0;

        return new CodeMetadata(upgradeable, readable, payable, payableBySc);
    }

    /**
     * Converts the metadata to the protocol-friendly representation.
     */
    toBytes(): Uint8Array {
        let byteZero = 0;
        let byteOne = 0;

        if (this.upgradeable) {
            byteZero |= CodeMetadata.ByteZero.Upgradeable;
        }
        if (this.readable) {
            byteZero |= CodeMetadata.ByteZero.Readable;
        }
        if (this.payable) {
            byteOne |= CodeMetadata.ByteOne.Payable;
        }
        if (this.payableBySc) {
            byteOne |= CodeMetadata.ByteOne.PayableBySc;
        }

        return new Uint8Array(Buffer.from([byteZero, byteOne]));
    }

    /**
     * Converts the metadata to a hex-encoded string.
     */
    toString() {
        return Buffer.from(this.toBytes()).toString("hex");
    }

    /**
     * Adjust the metadata (the `upgradeable` attribute), when preparing the deployment transaction.
     */
    toggleUpgradeable(value: boolean) {
        this.upgradeable = value;
    }

    /**
     * Adjust the metadata (the `readable` attribute), when preparing the deployment transaction.
     */
    toggleReadable(value: boolean) {
        this.readable = value;
    }

    /**
     * Adjust the metadata (the `payable` attribute), when preparing the deployment transaction.
     */
    togglePayable(value: boolean) {
        this.payable = value;
    }

    /**
     * Adjust the metadata (the `payableBySc` attribute), when preparing the deployment transaction.
     */
    togglePayableBySc(value: boolean) {
        this.payableBySc = value;
    }

    /**
     * Converts the metadata to a pretty, plain JavaScript object.
     */
    toJSON(): object {
        return {
            upgradeable: this.upgradeable,
            readable: this.readable,
            payable: this.payable,
            payableBySc: this.payableBySc,
        };
    }

    equals(other: CodeMetadata): boolean {
        return (
            this.upgradeable == other.upgradeable &&
            this.readable == other.readable &&
            this.payable == other.payable &&
            this.payableBySc == other.payableBySc
        );
    }
}
