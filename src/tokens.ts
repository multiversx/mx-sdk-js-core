import BigNumber from "bignumber.js";
import { ErrInvalidTokenIdentifier } from "./errors";

export class Token {
    identifier: string;
    nonce: BigNumber.Value;

    constructor(identifier: string, nonce: BigNumber.Value) {
        this.identifier = identifier;
        this.nonce = nonce;
    }
}

export class NextTokenTransfer {
    token: Token;
    amount: BigNumber.Value;

    constructor(token: Token, amount: BigNumber.Value) {
        this.token = token;
        this.amount = amount;
    }
}

export class TokenComputer {
    constructor() { }

    isFungible(token: Token): boolean {
        return token.nonce === 0;
    }

    extractNonceFromExtendedIdentifier(identifier: string): number {
        const parts = identifier.split("-");

        this.checkIfExtendedIdentifierWasProvided(parts);
        this.checkLengthOfRandomSequence(parts[1]);

        // in case the identifier of a fungible token is provided
        if (parts.length == 2) {
            return 0;
        }

        const hexNonce = Buffer.from(parts[2], "hex");
        return decodeUnsignedNumber(hexNonce);
    }

    extractIdentifierFromExtendedIdentifier(identifier: string): string {
        const parts = identifier.split("-");

        this.checkIfExtendedIdentifierWasProvided(parts);
        this.ensureTokenTickerValidity(parts[0]);
        this.checkLengthOfRandomSequence(parts[1]);

        return parts[0] + "-" + parts[1];
    }

    private checkIfExtendedIdentifierWasProvided(tokenParts: string[]): void {
        //  this is for the identifiers of fungible tokens
        const MIN_EXTENDED_IDENTIFIER_LENGTH_IF_SPLITTED = 2;
        //  this is for the identifiers of nft, sft and meta-esdt
        const MAX_EXTENDED_IDENTIFIER_LENGTH_IF_SPLITTED = 3;

        if (
            tokenParts.length < MIN_EXTENDED_IDENTIFIER_LENGTH_IF_SPLITTED ||
            tokenParts.length > MAX_EXTENDED_IDENTIFIER_LENGTH_IF_SPLITTED
        ) {
            throw new ErrInvalidTokenIdentifier("Invalid extended token identifier provided");
        }
    }

    private checkLengthOfRandomSequence(randomSequence: string): void {
        const TOKEN_RANDOM_SEQUENCE_LENGTH = 6;

        if (randomSequence.length !== TOKEN_RANDOM_SEQUENCE_LENGTH) {
            throw new ErrInvalidTokenIdentifier(
                "The identifier is not valid. The random sequence does not have the right length"
            );
        }
    }

    private ensureTokenTickerValidity(ticker: string) {
        const MIN_TICKER_LENGTH = 3;
        const MAX_TICKER_LENGTH = 10;

        if (ticker.length < MIN_TICKER_LENGTH || ticker.length > MAX_TICKER_LENGTH) {
            throw new ErrInvalidTokenIdentifier(
                `The token ticker should be between ${MIN_TICKER_LENGTH} and ${MAX_TICKER_LENGTH} characters`
            );
        }

        if (!ticker.match(/^[a-zA-Z0-9]+$/)) {
            throw new ErrInvalidTokenIdentifier("The token ticker should only contain alphanumeric characters");
        }

        if (!(ticker == ticker.toUpperCase())) {
            throw new ErrInvalidTokenIdentifier("The token ticker should be upper case");
        }
    }
}

function decodeUnsignedNumber(arg: Buffer): number {
    return arg.readUIntBE(0, arg.length);
}
