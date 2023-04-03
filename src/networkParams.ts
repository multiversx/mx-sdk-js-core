import { TRANSACTION_OPTIONS_DEFAULT, TRANSACTION_OPTIONS_TX_GUARDED, TRANSACTION_OPTIONS_TX_HASH_SIGN, TRANSACTION_VERSION_DEFAULT, TRANSACTION_VERSION_WITH_OPTIONS } from "./constants";
import * as errors from "./errors";

export class TransactionVersion {
    /**
     * The actual numeric value.
     */
    private readonly value: number;

    /**
     * Creates a TransactionVersion object given a value.
     */
    constructor(value: number) {
        value = Number(value);

        if (value < 1) {
            throw new errors.ErrTransactionVersionInvalid(value);
        }

        this.value = value;
    }

    /**
     * Creates a TransactionVersion object with the default version setting
     */
    static withDefaultVersion(): TransactionVersion {
        return new TransactionVersion(TRANSACTION_VERSION_DEFAULT);
    }

    /**
     * Creates a TransactionVersion object with the VERSION setting for enabling options
     */
    static withTxOptions(): TransactionVersion {
        return new TransactionVersion(TRANSACTION_VERSION_WITH_OPTIONS);
    }

    valueOf(): number {
        return this.value;
    }
}

export class TransactionOptions {
    /**
     * The actual numeric value.
     */
    private value: number;

    /**
     * Creates a TransactionOptions from a numeric value.
     */
    constructor(value: number) {
        value = Number(value);

        if (value < 0) {
            throw new errors.ErrTransactionOptionsInvalid(value);
        }

        this.value = value;
    }

    /**
     * Creates a TransactionOptions object with the default options.
     */
    static withDefaultOptions() {
        return new TransactionOptions(TRANSACTION_OPTIONS_DEFAULT);
    }

    /**
     * Creates a TransactionOptions object from a set of options.
     */
    public static withOptions(options: {
        hashSign?: boolean,
        guarded?: boolean
    }): TransactionOptions {
        let value = 0;

        if (options.hashSign) {
            value |= TRANSACTION_OPTIONS_TX_HASH_SIGN;
        }
        if (options.guarded) {
            value |= TRANSACTION_OPTIONS_TX_GUARDED;
        }

        return new TransactionOptions(value);
    }

    /**
     * Returns true if the "hash sign" option is set.
     */
    isWithHashSign(): boolean {
        return (this.value & TRANSACTION_OPTIONS_TX_HASH_SIGN) == TRANSACTION_OPTIONS_TX_HASH_SIGN;
    }

    /**
     * Returns true if the "guarded transaction" option is set.
     */
    isWithGuardian(): boolean {
        return (this.value & TRANSACTION_OPTIONS_TX_GUARDED) == TRANSACTION_OPTIONS_TX_GUARDED;
    }

    /**
     * Sets the "hash sign" option.
     */
    setWithHashSign() {
        this.value |= TRANSACTION_OPTIONS_TX_HASH_SIGN;
    }

    /**
     * Sets the "guarded transaction" option.
     */
    setWithGuardian() {
        this.value |= TRANSACTION_OPTIONS_TX_GUARDED;
    }

    valueOf(): number {
        return this.value;
    }
}
