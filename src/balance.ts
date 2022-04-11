import { BigNumber } from "bignumber.js";
import { ErrInvalidArgument } from "./errors";
import { Egld } from "./balanceBuilder";

/**
 * The number of decimals handled when working with EGLD or ESDT values.
 */
const DEFAULT_BIGNUMBER_DECIMAL_PLACES = 18;


BigNumber.set({ DECIMAL_PLACES: DEFAULT_BIGNUMBER_DECIMAL_PLACES, ROUNDING_MODE: 1 });

interface ITokenDefinition {
    getTokenIdentifier(): string;
    isEgld(): boolean;
    decimals: number;
}

/**
 * Balance, as an immutable object.
 */
export class Balance {
    // TODO: Rename class to "Tokens" or "TokenAmount" etc.
    // "Balance" is not an appropriate name.

    readonly token: ITokenDefinition;
    private readonly nonce: BigNumber = new BigNumber(0);
    private readonly value: BigNumber = new BigNumber(0);

    /**
     * Creates a Balance object.
     */
    public constructor(token: ITokenDefinition, nonce: BigNumber.Value, value: BigNumber.Value) {
        this.token = token;
        this.nonce = new BigNumber(nonce);
        this.value = new BigNumber(value);
    }

    /**
     * Creates a balance object from an EGLD value (denomination will be applied).
     */
    static egld(value: BigNumber.Value): Balance {
        // TODO: We should decouple the [built] object from it's [builder] (that is, "Egld"), if possible
        // (perhaps not possible yet).
        return Egld(value);
    }

    /**
     * Creates a balance object from a string (with denomination included).
     */
    static fromString(value: string): Balance {
        return Egld.raw(value || "0");
    }

    /**
     * Creates a zero-valued EGLD balance object.
     */
    static Zero(): Balance {
        return Egld(0);
    }

    isZero(): boolean {
        return this.value.isZero();
    }

    isEgld(): boolean {
        return this.token.isEgld();
    }

    isSet(): boolean {
        return !this.isZero();
    }

    /**
     * Returns the string representation of the value (as EGLD currency).
     */
    toCurrencyString(): string {
        return `${this.toDenominated()} ${this.token.getTokenIdentifier()}`;
    }

    toDenominated(): string {
        return this.value.shiftedBy(-this.token.decimals).toFixed(this.token.decimals);
    }

    /**
     * Returns the string representation of the value (its big-integer form).
     */
    toString(): string {
        return this.value.toFixed();
    }

    /**
     * Converts the balance to a pretty, plain JavaScript object.
     */
    toJSON(): object {
        return {
            asString: this.toString(),
            asCurrencyString: this.toCurrencyString()
        };
    }

    // TODO: We should not keep a property of a token instance (its nonce) here, in the "Tokens" (still called "Balance") class.
    // however, "tokenIdentifier" and "decimals" still have to be available.
    getNonce(): BigNumber {
        return this.nonce;
    }

    valueOf(): BigNumber {
        return this.value;
    }

    plus(other: Balance) {
        this.checkSameToken(other);
        return new Balance(this.token, this.nonce, this.value.plus(other.value));
    }

    minus(other: Balance) {
        this.checkSameToken(other);
        return new Balance(this.token, this.nonce, this.value.minus(other.value));
    }

    times(n: BigNumber.Value) {
        return new Balance(this.token, this.nonce, this.value.times(n));
    }

    div(n: BigNumber.Value) {
        return new Balance(this.token, this.nonce, this.value.div(n));
    }

    isEqualTo(other: Balance) {
        this.checkSameToken(other);
        return this.value.isEqualTo(other.value);
    }

    checkSameToken(other: Balance) {
        // TODO: Fix or remove. Comparing by reference isn't necessarily correct here.
        if (this.token != other.token) {
            throw new ErrInvalidArgument("Different token types");
        }
        if (!this.nonce.isEqualTo(other.nonce)) {
            throw new ErrInvalidArgument("Different nonces");
        }
    }
}
