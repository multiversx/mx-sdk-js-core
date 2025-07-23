import BigNumber from "bignumber.js";
import { EGLD_IDENTIFIER_FOR_MULTI_ESDTNFT_TRANSFER } from "./constants";
import { ErrInvalidArgument, ErrInvalidTokenIdentifier } from "./errors";
import { numberToPaddedHex } from "./utils.codec";

// Legacy constants:
const EGLDTokenIdentifier = "EGLD";
const EGLDNumDecimals = 18;

// Legacy configuration.
// Note: this will actually set the default rounding mode for all BigNumber objects in the environment (in the application / dApp).
BigNumber.set({ ROUNDING_MODE: 1 });

interface ILegacyTokenTransferOptions {
    tokenIdentifier: string;
    nonce: number;
    amountAsBigInteger: BigNumber.Value;
    numDecimals?: number;
}

export type TokenType = "NFT" | "SFT" | "META" | "FNG";

export class Token {
    /**
     * E.g. "FOO-abcdef", "EGLD-000000".
     */
    readonly identifier: string;
    readonly nonce: bigint;

    constructor(options: { identifier: string; nonce?: bigint }) {
        this.identifier = options.identifier;
        this.nonce = options.nonce || 0n;
    }
}

export class TokenTransfer {
    readonly token: Token;
    readonly amount: bigint;

    constructor(options: { token: Token; amount: bigint } | ILegacyTokenTransferOptions) {
        if (this.isLegacyTokenTransferOptions(options)) {
            // Handle legacy fields.
            const amount = new BigNumber(options.amountAsBigInteger);
            if (!amount.isInteger() || amount.isNegative()) {
                throw new ErrInvalidArgument(`bad amountAsBigInteger: ${options.amountAsBigInteger}`);
            }

            // Handle new fields.
            this.token = new Token({
                identifier: options.tokenIdentifier,
                nonce: BigInt(options.nonce),
            });

            this.amount = BigInt(options.amountAsBigInteger.toString());
        } else {
            // Handle new fields.
            this.token = options.token;
            this.amount = options.amount;
        }
    }

    /**     *
     * @param amount
     * @returns @TokenTransfer from native token
     */
    static newFromNativeAmount(amount: bigint): TokenTransfer {
        const token = new Token({ identifier: EGLD_IDENTIFIER_FOR_MULTI_ESDTNFT_TRANSFER });
        return new TokenTransfer({ token, amount });
    }

    private isLegacyTokenTransferOptions(options: any): options is ILegacyTokenTransferOptions {
        return options.tokenIdentifier !== undefined;
    }

    toString() {
        return this.amount.toString();
    }
}

export class TokenComputer {
    TOKEN_RANDOM_SEQUENCE_LENGTH = 6;
    constructor() {}

    /**
     * Returns token.nonce == 0
     */
    isFungible(token: Token): boolean {
        return token.nonce === 0n;
    }

    /**
     * Given "FOO-abcdef-0a" returns 10.
     */
    extractNonceFromExtendedIdentifier(identifier: string): number {
        const parts = identifier.split("-");

        const { prefix, ticker, randomSequence } = this.splitIdentifierIntoComponents(parts);
        this.validateExtendedIdentifier(prefix, ticker, randomSequence, parts);

        // If identifier is for a fungible token (2 parts or 3 with prefix), return 0
        if (parts.length === 2 || (prefix && parts.length === 3)) {
            return 0;
        }

        // Otherwise, decode the last part as an unsigned number
        const hexNonce = parts[parts.length - 1];
        return decodeUnsignedNumber(Buffer.from(hexNonce, "hex"));
    }

    /**
     * Given "FOO-abcdef-0a" returns FOO-abcdef.
     */
    extractIdentifierFromExtendedIdentifier(identifier: string): string {
        const parts = identifier.split("-");
        const { prefix, ticker, randomSequence } = this.splitIdentifierIntoComponents(parts);

        this.validateExtendedIdentifier(prefix, ticker, randomSequence, parts);
        if (prefix) {
            this.checkLengthOfPrefix(prefix);
            return prefix + "-" + ticker + "-" + randomSequence;
        }
        return ticker + "-" + randomSequence;
    }

    /**
     * Given "FOO-abcdef-0a" returns FOO.
     * Given "FOO-abcdef" returns FOO.
     */
    extractTickerFromExtendedIdentifier(identifier: string): string {
        const parts = identifier.split("-");
        const { prefix, ticker, randomSequence } = this.splitIdentifierIntoComponents(parts);

        this.validateExtendedIdentifier(prefix, ticker, randomSequence, parts);
        if (prefix) {
            this.checkLengthOfPrefix(prefix);
            return prefix + "-" + ticker + "-" + randomSequence;
        }
        return ticker;
    }

    computeExtendedIdentifier(token: Token): string {
        const parts = token.identifier.split("-");
        const { prefix, ticker, randomSequence } = this.splitIdentifierIntoComponents(parts);

        this.validateExtendedIdentifier(prefix, ticker, randomSequence, parts);

        if (token.nonce < 0) {
            throw new Error("The token nonce can't be less than 0");
        }

        if (token.nonce === 0n) {
            return token.identifier;
        }

        const nonceAsHex = numberToPaddedHex(token.nonce);
        return `${token.identifier}-${nonceAsHex}`;
    }

    private validateExtendedIdentifier(
        prefix: string | null,
        ticker: string,
        randomSequence: string,
        parts: string[],
    ): void {
        this.checkIfExtendedIdentifierWasProvided(prefix, parts);
        this.ensureTokenTickerValidity(ticker);
        this.checkLengthOfRandomSequence(randomSequence);
    }

    private splitIdentifierIntoComponents(parts: string[]): { prefix: any; ticker: any; randomSequence: any } {
        if (parts.length >= 3 && parts[2].length === this.TOKEN_RANDOM_SEQUENCE_LENGTH) {
            return { prefix: parts[0], ticker: parts[1], randomSequence: parts[2] };
        }

        return { prefix: null, ticker: parts[0], randomSequence: parts[1] };
    }

    private checkIfExtendedIdentifierWasProvided(prefix: string | null, tokenParts: string[]): void {
        //  this is for the identifiers of fungible tokens
        const MIN_EXTENDED_IDENTIFIER_LENGTH_IF_SPLITTED = 2;
        //  this is for the identifiers of nft, sft and meta-esdt
        const MAX_EXTENDED_IDENTIFIER_LENGTH_IF_SPLITTED = prefix ? 4 : 3;

        if (
            tokenParts.length < MIN_EXTENDED_IDENTIFIER_LENGTH_IF_SPLITTED ||
            tokenParts.length > MAX_EXTENDED_IDENTIFIER_LENGTH_IF_SPLITTED
        ) {
            throw new ErrInvalidTokenIdentifier("Invalid extended token identifier provided");
        }
    }

    private checkLengthOfRandomSequence(randomSequence: string): void {
        if (randomSequence.length !== this.TOKEN_RANDOM_SEQUENCE_LENGTH) {
            throw new ErrInvalidTokenIdentifier(
                "The identifier is not valid. The random sequence does not have the right length",
            );
        }
    }

    private checkLengthOfPrefix(prefix: string): void {
        const MAX_TOKEN_PREFIX_LENGTH = 4;
        const MIN_TOKEN_PREFIX_LENGTH = 1;
        if (prefix.length < MIN_TOKEN_PREFIX_LENGTH || prefix.length > MAX_TOKEN_PREFIX_LENGTH) {
            throw new ErrInvalidTokenIdentifier(
                "The identifier is not valid. The prefix does not have the right length",
            );
        }
    }

    private ensureTokenTickerValidity(ticker: string) {
        const MIN_TICKER_LENGTH = 3;
        const MAX_TICKER_LENGTH = 10;

        if (ticker.length < MIN_TICKER_LENGTH || ticker.length > MAX_TICKER_LENGTH) {
            throw new ErrInvalidTokenIdentifier(
                `The token ticker should be between ${MIN_TICKER_LENGTH} and ${MAX_TICKER_LENGTH} characters`,
            );
        }

        if (!ticker.match(/^[a-zA-Z0-9]+$/)) {
            throw new ErrInvalidTokenIdentifier("The token ticker should only contain alphanumeric characters");
        }
    }
}

function decodeUnsignedNumber(arg: Buffer): number {
    return arg.readUIntBE(0, arg.length);
}
