import BigNumber from "bignumber.js";
import { ErrInvalidArgument } from "./errors";

const EGLDTokenIdentifier = "EGLD";
const EGLDNumDecimals = 18;

export class TokenPayment {
    readonly tokenIdentifier: string;
    readonly nonce: number;
    readonly amountAsAtoms: BigNumber;
    private readonly numDecimals: number;

    constructor(tokenIdentifier: string, nonce: number, amountAsAtoms: BigNumber.Value, numDecimals: number) {
        let amount = new BigNumber(amountAsAtoms);
        if (!amount.isInteger() || amount.isNegative()) {
            throw new ErrInvalidArgument(`bad amountAsAtoms: ${amountAsAtoms}`);
        }

        this.tokenIdentifier = tokenIdentifier;
        this.nonce = nonce;
        this.amountAsAtoms = amount;
        this.numDecimals = numDecimals;
    }

    static egldWithRationalNumber(amount: BigNumber.Value) {
        let amountAsAtoms = new BigNumber(amount).shiftedBy(EGLDNumDecimals).decimalPlaces(0);
        return this.egldWithAtoms(amountAsAtoms);
    }

    static egldWithAtoms(amountAsAtoms: BigNumber.Value) {
        return new TokenPayment(EGLDTokenIdentifier, 0, amountAsAtoms, EGLDNumDecimals);
    }

    static fungibleWithRationalNumber(tokenIdentifier: string, amount: BigNumber.Value, numDecimals: number = 0): TokenPayment {
        let amountAsAtoms = new BigNumber(amount).shiftedBy(numDecimals).decimalPlaces(0);
        return this.fungibleWithAtoms(tokenIdentifier, amountAsAtoms, numDecimals);
    }

    static fungibleWithAtoms(tokenIdentifier: string, amountAsAtoms: BigNumber.Value, numDecimals: number = 0): TokenPayment {
        return new TokenPayment(tokenIdentifier, 0, amountAsAtoms, numDecimals);
    }

    static nonFungible(tokenIdentifier: string, nonce: number) {
        return new TokenPayment(tokenIdentifier, nonce, 1, 0);
    }

    static semiFungible(tokenIdentifier: string, nonce: number, quantity: number) {
        return new TokenPayment(tokenIdentifier, nonce, quantity, 0);
    }

    static metaEsdtWithRationalNumber(tokenIdentifier: string, nonce: number, amount: BigNumber.Value, numDecimals = 0) {
        let amountAsAtoms = new BigNumber(amount).shiftedBy(numDecimals).decimalPlaces(0);
        return this.metaEsdtWithAtoms(tokenIdentifier, nonce, amountAsAtoms, numDecimals);
    }

    static metaEsdtWithAtoms(tokenIdentifier: string, nonce: number, amountAsAtoms: BigNumber.Value, numDecimals = 0) {
        return new TokenPayment(tokenIdentifier, nonce, amountAsAtoms, numDecimals);
    }

    toString() {
        return this.amountAsAtoms.toFixed(0);
    }

    toPrettyString() {
        return `${this.toRationalNumber()} ${this.tokenIdentifier}`;
    }

    toRationalNumber() {
        return this.amountAsAtoms.shiftedBy(-this.numDecimals).toFixed(this.numDecimals);
    }

    isEgld() {
        return this.tokenIdentifier == EGLDTokenIdentifier;
    }

    isFungible() {
        return this.nonce == 0;
    }
}
