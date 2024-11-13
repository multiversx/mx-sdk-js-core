import { PrimitiveType, PrimitiveValue } from "./types";

export class BooleanType extends PrimitiveType {
    static ClassName = "BooleanType";

    constructor() {
        super("bool");
    }

    getClassName(): string {
        return BooleanType.ClassName;
    }
}

/**
 * A boolean value fed to or fetched from a Smart Contract contract, as an immutable abstraction.
 */
export class BooleanValue extends PrimitiveValue {
    static ClassName = "BooleanValue";
    private readonly value: boolean;

    constructor(value: boolean) {
        super(new BooleanType());
        this.value = value;
    }

    getClassName(): string {
        return BooleanValue.ClassName;
    }

    /**
     * Returns whether two objects have the same value.
     *
     * @param other another BooleanValue
     */
    equals(other: BooleanValue): boolean {
        return this.value === other.value;
    }

    isTrue(): boolean {
        return this.value === true;
    }

    isFalse(): boolean {
        return !this.isTrue();
    }

    valueOf(): boolean {
        return this.value;
    }
}
