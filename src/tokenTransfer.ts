import BigNumber from "bignumber.js";
import { ErrInvalidArgument } from "./errors";

const EGLDTokenIdentifier = "EGLD";
const EGLDNumDecimals = 18;

// Note: this will actually set the default rounding mode for all BigNumber objects in the environment (in the application / dApp).
BigNumber.set({ ROUNDING_MODE: 1 });

interface ITokenTransferOptions {
    tokenIdentifier: string;
    nonce: number;
    amountAsBigInteger: BigNumber.Value;
    numDecimals: number;
}

export class TokenTransfer {
    readonly tokenIdentifier: string;
    readonly nonce: number;
    readonly amountAsBigInteger: BigNumber;
    readonly numDecimals: number;

    protected constructor(options: ITokenTransferOptions) {
        const amount = new BigNumber(options.amountAsBigInteger);
        if (!amount.isInteger() || amount.isNegative()) {
            throw new ErrInvalidArgument(`bad amountAsBigInteger: ${options.amountAsBigInteger}`);
        }

        this.tokenIdentifier = options.tokenIdentifier;
        this.nonce = options.nonce;
        this.amountAsBigInteger = amount;
        this.numDecimals = options.numDecimals;
    }

    static egldFromAmount(amount: BigNumber.Value) {
        const amountAsBigInteger = new BigNumber(amount).shiftedBy(EGLDNumDecimals).decimalPlaces(0);
        return this.egldFromBigInteger(amountAsBigInteger);
    }

    static egldFromBigInteger(amountAsBigInteger: BigNumber.Value) {
        return new TokenTransfer({
            tokenIdentifier: EGLDTokenIdentifier,
            nonce: 0,
            amountAsBigInteger,
            numDecimals: EGLDNumDecimals,
        });
    }

    static fungibleFromAmount(tokenIdentifier: string, amount: BigNumber.Value, numDecimals: number) {
        const amountAsBigInteger = new BigNumber(amount).shiftedBy(numDecimals).decimalPlaces(0);
        return this.fungibleFromBigInteger(tokenIdentifier, amountAsBigInteger, numDecimals);
    }

    static fungibleFromBigInteger(tokenIdentifier: string, amountAsBigInteger: BigNumber.Value, numDecimals: number = 0) {
        return new TokenTransfer({
            tokenIdentifier,
            nonce: 0,
            amountAsBigInteger,
            numDecimals,
        });
    }

    static nonFungible(tokenIdentifier: string, nonce: number) {
        return new TokenTransfer({
            tokenIdentifier,
            nonce,
            amountAsBigInteger: 1,
            numDecimals: 0,
        });
    }

    static semiFungible(tokenIdentifier: string, nonce: number, quantity: number) {
        return new TokenTransfer({
            tokenIdentifier,
            nonce,
            amountAsBigInteger: quantity,
            numDecimals: 0,
        });
    }

    static metaEsdtFromAmount(tokenIdentifier: string, nonce: number, amount: BigNumber.Value, numDecimals: number) {
        const amountAsBigInteger = new BigNumber(amount).shiftedBy(numDecimals).decimalPlaces(0);
        return this.metaEsdtFromBigInteger(tokenIdentifier, nonce, amountAsBigInteger, numDecimals);
    }

    static metaEsdtFromBigInteger(tokenIdentifier: string, nonce: number, amountAsBigInteger: BigNumber.Value, numDecimals = 0) {
        return new TokenTransfer({
            tokenIdentifier,
            nonce,
            amountAsBigInteger,
            numDecimals,
        });
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

/**
 * @deprecated use {@link TokenTransfer} instead.
 */
export class TokenPayment extends TokenTransfer {
    constructor(tokenIdentifier: string, nonce: number, amountAsBigInteger: BigNumber.Value, numDecimals: number) {
        super({
            tokenIdentifier,
            nonce,
            amountAsBigInteger,
            numDecimals,
        });
    }
};
