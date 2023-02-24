import BigNumber from "bignumber.js";
import { ErrInvalidArgument } from "./errors";

const EGLDTokenIdentifier = "EGLD";
const EGLDNumDecimals = 18;

// Note: this will actually set the default rounding mode for all BigNumber objects in the environment (in the application / dApp).
BigNumber.set({ ROUNDING_MODE: 1 });

export class TokenPayment {
    readonly tokenIdentifier: string;
    readonly nonce: number;
    readonly amountAsBigInteger: BigNumber;
    readonly numDecimals: number;

    // TODO (breaking, next major version): constructor({ ... })
    constructor(tokenIdentifier: string, nonce: number, amountAsBigInteger: BigNumber.Value, numDecimals: number) {
        let amount = new BigNumber(amountAsBigInteger);
        if (!amount.isInteger() || amount.isNegative()) {
            throw new ErrInvalidArgument(`bad amountAsBigInteger: ${amountAsBigInteger}`);
        }

        this.tokenIdentifier = tokenIdentifier;
        this.nonce = nonce;
        this.amountAsBigInteger = amount;
        this.numDecimals = numDecimals;
    }

    static egldFromAmount(amount: BigNumber.Value) {
        let amountAsBigInteger = new BigNumber(amount).shiftedBy(EGLDNumDecimals).decimalPlaces(0);
        return this.egldFromBigInteger(amountAsBigInteger);
    }

    static egldFromBigInteger(amountAsBigInteger: BigNumber.Value) {
        return new TokenPayment(EGLDTokenIdentifier, 0, amountAsBigInteger, EGLDNumDecimals);
    }

    static fungibleFromAmount(tokenIdentifier: string, amount: BigNumber.Value, numDecimals: number): TokenPayment {
        let amountAsBigInteger = new BigNumber(amount).shiftedBy(numDecimals).decimalPlaces(0);
        return this.fungibleFromBigInteger(tokenIdentifier, amountAsBigInteger, numDecimals);
    }

    static fungibleFromBigInteger(tokenIdentifier: string, amountAsBigInteger: BigNumber.Value, numDecimals: number = 0): TokenPayment {
        return new TokenPayment(tokenIdentifier, 0, amountAsBigInteger, numDecimals);
    }

    static nonFungible(tokenIdentifier: string, nonce: number) {
        return new TokenPayment(tokenIdentifier, nonce, 1, 0);
    }

    static semiFungible(tokenIdentifier: string, nonce: number, quantity: number) {
        return new TokenPayment(tokenIdentifier, nonce, quantity, 0);
    }

    static metaEsdtFromAmount(tokenIdentifier: string, nonce: number, amount: BigNumber.Value, numDecimals: number) {
        let amountAsBigInteger = new BigNumber(amount).shiftedBy(numDecimals).decimalPlaces(0);
        return this.metaEsdtFromBigInteger(tokenIdentifier, nonce, amountAsBigInteger, numDecimals);
    }

    static metaEsdtFromBigInteger(tokenIdentifier: string, nonce: number, amountAsBigInteger: BigNumber.Value, numDecimals = 0) {
        return new TokenPayment(tokenIdentifier, nonce, amountAsBigInteger, numDecimals);
    }

    toString() {
        return this.amountAsBigInteger.toFixed(0);
    }

    valueOf(): BigNumber {
        return this.amountAsBigInteger;
    }

    toPrettyString(): string {
        return `${this.toAmount()} ${this.tokenIdentifier}`;
    }

    private toAmount(): string {
        return this.amountAsBigInteger.shiftedBy(-this.numDecimals).toFixed(this.numDecimals);
    }

    isEgld(): boolean {
        return this.tokenIdentifier == EGLDTokenIdentifier;
    }

    isFungible(): boolean {
        return this.nonce == 0;
    }
}
