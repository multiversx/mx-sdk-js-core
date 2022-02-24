import * as errors from "./errors";
import { numberToPaddedHex } from "./utils.codec";

/**
 * The nonce, as an immutable object.
 */
export class Nonce {
    /**
     * The actual numeric value.
     */
    private readonly value: number;

    /**
     * Creates a Nonce object given a value.
     */
    constructor(value: number) {
        value = Number(value);

        if (Number.isNaN(value) || value < 0) {
            throw new errors.ErrNonceInvalid(value);
        }

        this.value = value;
    }

    /**
     * Creates a new Nonce object by incrementing the current one.
     */
    increment(): Nonce {
        return new Nonce(this.value + 1);
    }

    hex(): string {
        return numberToPaddedHex(this.value);
    }

    valueOf(): number {
        return this.value;
    }

    equals(other: Nonce): boolean {
        if (!other) {
            return false;
        }

        return this.value === other.value;
    }
}

