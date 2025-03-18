import { PrimitiveType, PrimitiveValue } from "./types";

export class H256Type extends PrimitiveType {
    static ClassName = "H256Type";

    constructor() {
        super("H256");
    }

    getClassName(): string {
        return H256Type.ClassName;
    }
}

export class H256Value extends PrimitiveValue {
    static ClassName = "H256Value";
    private readonly value: Buffer;

    constructor(value: Buffer) {
        super(new H256Type());
        this.value = value;
    }

    getClassName(): string {
        return H256Value.ClassName;
    }

    /**
     * Returns whether two objects have the same value.
     */
    equals(other: H256Value): boolean {
        return this.value.equals(other.value);
    }

    valueOf(): Buffer {
        return this.value;
    }
}
