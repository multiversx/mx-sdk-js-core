import { IAddress, IHash, INonce, ITransactionPayload } from "./interface";

export class Hash implements IHash {
    private readonly value: string;

    constructor(value: string) {
        this.value = value;
    }

    hex(): string {
        return this.value;
    }
}

export class Address implements IAddress {
    private readonly value: string;

    constructor(value: string) {
        this.value = value;
    }

    bech32(): string {
        return this.value;
    }
}

export class Nonce implements INonce {
    private readonly value: number;

    constructor(value: number) {
        this.value = value;
    }

    valueOf(): number {
        return this.value;
    }

    hex(): string {
        return numberToPaddedHex(this.value);
    }
}

export class TransactionValue {
    private readonly value: string;

    constructor(value: string) {
        this.value = value;
    }

    toString(): string {
        return this.value;
    }
}

export class TransactionPayload implements ITransactionPayload {
    private readonly base64: string;

    constructor(base64: string) {
        this.base64 = base64;
    }

    encoded(): string {
        return this.base64;
    }
}

export function numberToPaddedHex(value: number) {
    let hex = value.toString(16);
    return zeroPadStringIfOddLength(hex);
}

export function isPaddedHex(input: string) {
    input = input || "";
    let decodedThenEncoded = Buffer.from(input, "hex").toString("hex");
    return input.toUpperCase() == decodedThenEncoded.toUpperCase();
}

export function zeroPadStringIfOddLength(input: string): string {
    input = input || "";

    if (input.length % 2 == 1) {
        return "0" + input;
    }

    return input;
}
