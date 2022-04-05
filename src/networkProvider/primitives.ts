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
