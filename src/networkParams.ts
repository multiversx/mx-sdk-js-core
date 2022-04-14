import * as errors from "./errors";
import {
    TRANSACTION_OPTIONS_DEFAULT,
    TRANSACTION_OPTIONS_TX_HASH_SIGN,
    TRANSACTION_VERSION_DEFAULT, TRANSACTION_VERSION_TX_HASH_SIGN
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
    static withTxHashSignVersion(): TransactionVersion {
        return new TransactionVersion(TRANSACTION_VERSION_TX_HASH_SIGN);
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
     * Created a TransactionsOptions object with the setting for hash signing
     */
    static withTxHashSignOptions(): TransactionOptions {
        return new TransactionOptions(TRANSACTION_OPTIONS_TX_HASH_SIGN);
    }

    valueOf(): number {
        return this.value;
    }
}

