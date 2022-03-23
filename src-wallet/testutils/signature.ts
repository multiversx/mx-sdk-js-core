import { ISignature } from "../interface";

export class TestSignature implements ISignature {
    readonly value: string;

    constructor(value: string) {
        this.value = value;
    }

    hex(): string {
        return this.value;
    }
}
