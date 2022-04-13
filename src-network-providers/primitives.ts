import * as bech32 from "bech32";
import { IAddress } from "./interface";

/**
 * The human-readable-part of the bech32 addresses.
 */
const HRP = "erd";

export class Address implements IAddress {
    private readonly value: string;

    constructor(value: string) {
        this.value = value;
    }

    static fromPubkey(pubkey: Buffer): IAddress {
        let words = bech32.toWords(pubkey);
        let address = bech32.encode(HRP, words);
        return new Address(address);
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
