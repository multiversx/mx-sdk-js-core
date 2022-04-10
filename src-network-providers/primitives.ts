import { IBech32Address, IHash } from "./interface";

export class Hash implements IHash {
    private readonly value: string;

    constructor(value: string) {
        this.value = value;
    }

    hex(): string {
        return this.value;
    }
}

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

export class ContractReturnCode {
    private static OK: string = "ok";

    private readonly value: string;

    constructor(value: string) {
        this.value = value;
    }

    toString() {
        return this.value;
    }

    isSuccess(): boolean {
        return this.value == ContractReturnCode.OK;
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
