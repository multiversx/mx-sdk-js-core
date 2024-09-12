import BigNumber from "bignumber.js";
import { Type, TypedValue } from "./types";

export class ManagedDecimalSignedType extends Type {
    static ClassName = "ManagedDecimalSignedType";

    constructor(metadata: number | "usize") {
        super("ManagedDecimalSigned", undefined, undefined, metadata);
    }

    getClassName(): string {
        return ManagedDecimalSignedType.ClassName;
    }

    getMetadata(): number | "usize" {
        return this.metadata;
    }

    isVariable(): boolean {
        return this.metadata == "usize";
    }
}

export class ManagedDecimalSignedValue extends TypedValue {
    static ClassName = "ManagedDecimalSignedValue";
    private readonly value: BigNumber;
    private readonly scale: number;
    private readonly variable: boolean;

    constructor(value: BigNumber.Value, scale: number, isVariable: boolean = false) {
        super(new ManagedDecimalSignedType(isVariable ? "usize" : scale));
        this.value = new BigNumber(value);
        this.scale = scale;
        this.variable = isVariable;
    }

    getClassName(): string {
        return ManagedDecimalSignedValue.ClassName;
    }

    getPrecision(): number {
        return this.value.toFixed(this.scale).replace(".", "").length;
    }

    getScale(): number {
        return this.scale;
    }

    /**
     * Returns whether two objects have the same value.
     */
    equals(other: ManagedDecimalSignedValue): boolean {
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
