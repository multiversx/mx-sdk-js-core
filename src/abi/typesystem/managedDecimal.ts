import BigNumber from "bignumber.js";
import { Type, TypedValue } from "./types";

export class ManagedDecimalType extends Type {
    static ClassName = "ManagedDecimalType";

    constructor(metadata: number | "usize") {
        super("ManagedDecimal", undefined, undefined, metadata);
    }

    getClassName(): string {
        return ManagedDecimalType.ClassName;
    }

    getMetadata(): number | "usize" {
        return this.metadata;
    }

    isVariable(): boolean {
        return this.metadata == "usize";
    }
}

export class ManagedDecimalValue extends TypedValue {
    static ClassName = "ManagedDecimalValue";
    private readonly value: BigNumber;
    private readonly scale: number;
    private readonly variable: boolean;

    constructor(value: BigNumber.Value, scale: number, isVariable: boolean = false) {
        super(new ManagedDecimalType(isVariable ? "usize" : scale));
        this.value = new BigNumber(value);
        this.scale = scale;
        this.variable = isVariable;
    }

    getClassName(): string {
        return ManagedDecimalValue.ClassName;
    }

    getScale(): number {
        return this.scale;
    }

    getPrecision(): number {
        return this.value.toFixed(this.scale).replace(".", "").length;
    }

    /**
     * Returns whether two objects have the same value.
     */
    equals(other: ManagedDecimalValue): boolean {
        if (this.getPrecision() != other.getPrecision()) {
            return false;
        }

        return new BigNumber(this.value).eq(other.value);
    }

    valueOf(): BigNumber {
        return this.value;
    }

    toString(): string {
        return this.value.toFixed(this.scale);
    }

    isVariable(): boolean {
        return this.variable;
    }
}
