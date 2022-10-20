import * as errors from "./errors";
import {
    TRANSACTION_OPTIONS_DEFAULT,
    TRANSACTION_OPTIONS_TX_HASH_SIGN,
    TRANSACTION_VERSION_DEFAULT, TRANSACTION_VERSION_WITH_TX_OPTIONS, TRANSACTION_OPTIONS_TX_GUARDED, TRANSACTION_OPTIONS_TX_GUARDED_MASK
} from "./constants";

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
     * Creates a TransactionVersion object with the VERSION setting for hash signing
     */
    static withTxOptions(): TransactionVersion {
        return new TransactionVersion(TRANSACTION_VERSION_WITH_TX_OPTIONS);
    }

    valueOf(): number {
        return this.value;
    }
}

export class TransactionOptions {
    /**
     * The actual numeric value.
     */
    private readonly value: number;

    /**
     * Creates a TransactionOptions object given a value.
     */
    constructor(value: number) {
        value = Number(value);

        if (value < 0) {
            throw new errors.ErrTransactionOptionsInvalid(value);
        }

        this.value = value;
    }

    /**
     * Creates a TransactionOptions object with the default options setting
     */
    static withDefaultOptions(): TransactionOptions {
        return new TransactionOptions(TRANSACTION_OPTIONS_DEFAULT);
    }

    /**
     * Creates a TransactionsOptions object with the setting for hash signing
     */
    static withTxHashSignOptions(): TransactionOptions {
        return new TransactionOptions(TRANSACTION_OPTIONS_TX_HASH_SIGN);
    }

    /**
     * Creates a TransactionsOptions object with the setting for guarded transaction
     */
    static withTxGuardedOptions(): TransactionOptions {
        return new TransactionOptions(TRANSACTION_OPTIONS_TX_GUARDED);
    }

    /**
     * Returns true if Guarded Transaction Option is set
     */
    withGuardedOptions(): boolean {
        return ((this.value & TRANSACTION_OPTIONS_TX_GUARDED_MASK) == TRANSACTION_OPTIONS_TX_GUARDED)
    }

    valueOf(): number {
        return this.value;
    }
}
