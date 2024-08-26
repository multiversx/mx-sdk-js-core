import BigNumber from "bignumber.js";
import { Type, TypedValue } from "./types";

export class ManagedDecimalType extends Type {
    static ClassName = "ManagedDecimalType";
    private readonly scale: number;

    constructor(scale: number) {
        super("ManagedDecimal", undefined, undefined, scale);
        this.scale = scale;
    }

    getClassName(): string {
        return ManagedDecimalType.ClassName;
    }
}

export class ManagedDecimalValue extends TypedValue {
    static ClassName = "ManagedDecimalValue";
    private readonly value: BigNumber;
    private readonly scale: number;

    constructor(value: BigNumber.Value, scale: number) {
        super(new ManagedDecimalType(scale));
        this.value = new BigNumber(value);
        this.scale = scale;
    }

    getClassName(): string {
        return ManagedDecimalValue.ClassName;
    }

    getPrecision(): number {
        return this.value.toString(this.scale).replace(".", "").length;
    }

    /**
     * Returns whether two objects have the same value.
     */
    equals(other: ManagedDecimalValue): boolean {
        if (this.getPrecision() != other.getPrecision()) {
            return false;
        }

        return this.value == other.value;
    }

    valueOf(): BigNumber {
        return this.value;
    }

    toString(): string {
        return this.value.toString();
    }
}

export class ManagedDecimalSignedType extends Type {
    static ClassName = "ManagedDecimalSignedType";
    private readonly scale: number;

    constructor(scale: number) {
        super("ManagedDecimalSigned", undefined, undefined, scale);
        this.scale = scale;
    }

    getClassName(): string {
        return ManagedDecimalType.ClassName;
    }
}

export class ManagedDecimalSignedValue extends TypedValue {
    static ClassName = "ManagedDecimalSignedValue";
    private readonly value: BigNumber;
    private readonly scale: number;

    constructor(value: BigNumber, scale: number) {
        super(new ManagedDecimalType(scale));
        this.value = value;
        this.scale = scale;
    }

    getClassName(): string {
        return ManagedDecimalValue.ClassName;
    }

    getPrecision(): number {
        return this.value.toFixed(this.scale).replace(".", "").length;
    }

    /**
     * Returns whether two objects have the same value.
     */
    equals(other: ManagedDecimalSignedValue): boolean {
        if (this.getPrecision() != other.getPrecision()) {
            return false;
        }

        return this.value == other.value;
    }

    valueOf(): BigNumber {
        return this.value;
    }

    toString(): string {
        return this.value.toString();
    }
}
