import BigNumber from "bignumber.js";
import { Type, TypedValue } from "./types";

export class ManagedDecimalType extends Type {
    static ClassName = "ManagedDecimalType";

    constructor(metadata: any) {
        super("ManagedDecimal", undefined, undefined, metadata);
    }

    getClassName(): string {
        return ManagedDecimalType.ClassName;
    }

    getMetadata(): string {
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

    constructor(value: BigNumber.Value, scale: number, isVar: boolean = false) {
        super(new ManagedDecimalType(isVar ? "usize" : scale));
        this.value = new BigNumber(value);
        this.scale = scale;
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

        return this.value == other.value;
    }

    valueOf(): BigNumber {
        return this.value;
    }

    toString(): string {
        return this.value.toFixed(this.scale);
    }
}

export class ManagedDecimalSignedType extends Type {
    static ClassName = "ManagedDecimalSignedType";

    constructor(metadata: any) {
        super("ManagedDecimalSigned", undefined, undefined, metadata);
    }

    getClassName(): string {
        return ManagedDecimalType.ClassName;
    }

    getMetadata(): string {
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

    constructor(value: BigNumber.Value, scale: number, isVariableDecimals: boolean = false) {
        super(new ManagedDecimalSignedType(isVariableDecimals ? "usize" : scale));
        this.value = new BigNumber(value);
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
        return this.value.toFixed(this.scale);
    }
}
