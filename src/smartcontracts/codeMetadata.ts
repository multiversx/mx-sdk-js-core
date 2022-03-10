/**
 * The metadata of a Smart Contract, as an abstraction.
 */
export class CodeMetadata {
    private upgradeable: boolean;
    private readable: boolean;
    private payable: boolean;
    private payableBySc: boolean;

    /**
     * Creates a metadata object. By default, set the `upgradeable` attribute, and uset all others.
     * 
     * @param upgradeable Whether the contract is upgradeable
     * @param readable Whether other contracts can read this contract's data (without calling one of its pure functions)
     * @param payable Whether the contract is payable
     * @param payableBySc Whether the contract is payable by other smart contracts
     */
    constructor(upgradeable: boolean = true, readable: boolean = false, payable: boolean = false, payableBySc: boolean = false) {
        this.upgradeable = upgradeable;
        this.readable = readable;
        this.payable = payable;
        this.payableBySc = payableBySc
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
     * Converts the metadata to the protocol-friendly representation.
     */
    toBuffer(): Buffer {
        let byteZero = 0;
        let byteOne = 0;

        if (this.upgradeable) {
            byteZero |= ByteZero.Upgradeable;
        }
        if (this.readable) {
            byteZero |= ByteZero.Readable;
        }
        if (this.payable) {
            byteOne |= ByteOne.Payable;
        }
        if (this.payableBySc) {
            byteOne |= ByteOne.PayableBySc;
        }

        return Buffer.from([byteZero, byteOne]);
    }

    /**
     * Converts the metadata to a hex-encoded string.
     */
    toString() {
        return this.toBuffer().toString("hex");
    }

    /**
     * Converts the metadata to a pretty, plain JavaScript object.
     */
    toJSON(): object {
        return {
            upgradeable: this.upgradeable,
            readable: this.readable,
            payable: this.payable,
            payableBySc: this.payableBySc
        };
    }

    equals(other: CodeMetadata): boolean {
        return this.upgradeable == other.upgradeable &&
            this.readable == other.readable &&
            this.payable == other.payable &&
            this.payableBySc == other.payableBySc;
    }
}

enum ByteZero {
    Upgradeable = 1,
    Reserved2 = 2,
    Readable = 4
}

enum ByteOne {
    Reserved1 = 1,
    Payable = 2,
    PayableBySc = 4
}
