import { IBech32Address } from "./interface";

export class Bech32Address implements IBech32Address {
    private readonly value: string;

    constructor(value: string) {
        this.value = value;
    }

    bech32(): string {
        return this.value;
    }
}

export class Nonce {
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
