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

export class TokenTransfer {
    token: Token;
    amount: BigNumber.Value

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

        const hexNonce = Buffer.from(parts[2], 'hex');
        return decodeUnsignedNumber(hexNonce);
    }

    extractIdentifierFromExtendedIdentifier(identifier: string): string {
        const parts = identifier.split("-");

        this.checkIfExtendedIdentifierWasProvided(parts);
        this.checkLengthOfRandomSequence(parts[1]);

        return parts[0] + "-" + parts[1];
    }

    ensureIdentifierHasCorrectStructure(identifier: string): string {
        const isExtendedIdentifier = identifier.split("-").length === 3 ? true : false;
        if (!isExtendedIdentifier) {
            return identifier;
        }

        return this.extractIdentifierFromExtendedIdentifier(identifier);
    }

    private checkIfExtendedIdentifierWasProvided(tokenParts: string[]): void {
        const EXTENDED_IDENTIFIER_LENGTH_IF_SPLITTED = 3;

        if (tokenParts.length !== EXTENDED_IDENTIFIER_LENGTH_IF_SPLITTED) {
            throw new ErrInvalidTokenIdentifier("You have not provided the extended identifier");
        }
    }

    private checkLengthOfRandomSequence(randomSequence: string): void {
        const TOKEN_RANDOM_SEQUENCE_LENGTH = 6;

        if (randomSequence.length !== TOKEN_RANDOM_SEQUENCE_LENGTH) {
            throw new ErrInvalidTokenIdentifier("The identifier is not valid. The random sequence does not have the right length");
        }
    }
}

function decodeUnsignedNumber(arg: Buffer): number {
    return arg.readUIntBE(0, arg.length);
}

