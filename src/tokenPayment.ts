import BigNumber from "bignumber.js";
import { ErrInvalidArgument } from "./errors";

const EGLDTokenIdentifier = "EGLD";
const EGLDNumDecimals = 18;

export class TokenPayment {
    readonly tokenIdentifier: string;
    readonly nonce: number;
    readonly amountAsBigInteger: BigNumber;
    private readonly numDecimals: number;

    constructor(tokenIdentifier: string, nonce: number, amountAsAtoms: BigNumber.Value, numDecimals: number) {
        let amount = new BigNumber(amountAsAtoms);
        if (!amount.isInteger() || amount.isNegative()) {
            throw new ErrInvalidArgument(`bad amountAsAtoms: ${amountAsAtoms}`);
        }

        this.tokenIdentifier = tokenIdentifier;
        this.nonce = nonce;
        this.amountAsBigInteger = amount;
        this.numDecimals = numDecimals;
    }

    static egldFromRationalNumber(amountAsRationalNumber: BigNumber.Value) {
        let amountAsAtoms = new BigNumber(amountAsRationalNumber).shiftedBy(EGLDNumDecimals).decimalPlaces(0);
        return this.egldFromBigInteger(amountAsAtoms);
    }

    static egldFromBigInteger(amountAsBigInteger: BigNumber.Value) {
        return new TokenPayment(EGLDTokenIdentifier, 0, amountAsBigInteger, EGLDNumDecimals);
    }

    static fungibleFromRationalNumber(tokenIdentifier: string, amountAsRationalNumber: BigNumber.Value, numDecimals: number = 0): TokenPayment {
        let amountAsAtoms = new BigNumber(amountAsRationalNumber).shiftedBy(numDecimals).decimalPlaces(0);
        return this.fungibleFromBigInteger(tokenIdentifier, amountAsAtoms, numDecimals);
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

    static metaEsdtFromRationalNumber(tokenIdentifier: string, nonce: number, amountAsRationalNumber: BigNumber.Value, numDecimals = 0) {
        let amountAsAtoms = new BigNumber(amountAsRationalNumber).shiftedBy(numDecimals).decimalPlaces(0);
        return this.metaEsdtFromBigInteger(tokenIdentifier, nonce, amountAsAtoms, numDecimals);
    }

    static metaEsdtFromBigInteger(tokenIdentifier: string, nonce: number, amountAsBigInteger: BigNumber.Value, numDecimals = 0) {
        return new TokenPayment(tokenIdentifier, nonce, amountAsBigInteger, numDecimals);
    }

    toString() {
        return this.amountAsBigInteger.toFixed(0);
    }

    toPrettyString() {
        return `${this.toRationalNumber()} ${this.tokenIdentifier}`;
    }

    toRationalNumber() {
        return this.amountAsBigInteger.shiftedBy(-this.numDecimals).toFixed(this.numDecimals);
    }

    isEgld() {
        return this.tokenIdentifier == EGLDTokenIdentifier;
    }

    isFungible() {
        return this.nonce == 0;
    }
}
