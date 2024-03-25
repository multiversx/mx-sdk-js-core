import BigNumber from "bignumber.js";
import * as errors from "../../errors";
import { PrimitiveType, PrimitiveValue } from "./types";

export class NumericalType extends PrimitiveType {
    static ClassName = "NumericalType";

    readonly sizeInBytes: number;
    readonly withSign: boolean;

    protected constructor(name: string, sizeInBytes: number, withSign: boolean) {
        super(name);
        this.sizeInBytes = sizeInBytes;
        this.withSign = withSign;
    }

    getClassName(): string {
        return NumericalType.ClassName;
    }

    hasFixedSize(): boolean {
        return this.sizeInBytes ? true : false;
    }

    hasArbitrarySize(): boolean {
        return !this.hasFixedSize();
    }
}

export class U8Type extends NumericalType {
    static ClassName = "U8Type";

    constructor() {
        super("u8", 1, false);
    }

    getClassName(): string {
        return U8Type.ClassName;
    }
}

export class I8Type extends NumericalType {
    static ClassName = "I8Type";

    constructor() {
        super("i8", 1, true);
    }

    getClassName(): string {
        return I8Type.ClassName;
    }
}

export class U16Type extends NumericalType {
    static ClassName = "U16Type";

    constructor() {
        super("u16", 2, false);
    }

    getClassName(): string {
        return U16Type.ClassName;
    }
}

export class I16Type extends NumericalType {
    static ClassName = "I16Type";

    constructor() {
        super("i16", 2, true);
    }

    getClassName(): string {
        return I16Type.ClassName;
    }
}

export class U32Type extends NumericalType {
    static ClassName = "U32Type";

    constructor() {
        super("u32", 4, false);
    }

    getClassName(): string {
        return U32Type.ClassName;
    }
}

export class I32Type extends NumericalType {
    static ClassName = "I32Type";

    constructor() {
        super("i32", 4, true);
    }

    getClassName(): string {
        return I32Type.ClassName;
    }
}

export class U64Type extends NumericalType {
    static ClassName = "U64Type";

    constructor() {
        super("u64", 8, false);
    }

    getClassName(): string {
        return U64Type.ClassName;
    }
}

export class I64Type extends NumericalType {
    static ClassName = "I64Type";

    constructor() {
        super("i64", 8, true);
    }

    getClassName(): string {
        return I64Type.ClassName;
    }
}

export class BigUIntType extends NumericalType {
    static ClassName = "BigUIntType";

    constructor() {
        super("BigUint", 0, false);
    }

    getClassName(): string {
        return BigUIntType.ClassName;
    }
}

export class BigIntType extends NumericalType {
    static ClassName = "BigIntType";

    constructor() {
        super("Bigint", 0, true);
    }

    getClassName(): string {
        return BigIntType.ClassName;
    }
}

/**
 * A numerical value fed to or fetched from a Smart Contract contract, as a strongly-typed, immutable abstraction.
 */
export class NumericalValue extends PrimitiveValue {
    static ClassName = "NumericalValue";
    readonly value: BigNumber;
    readonly sizeInBytes: number | undefined;
    readonly withSign: boolean;

    constructor(type: NumericalType, value: BigNumber.Value | bigint) {
        super(type);

        if (typeof value === "bigint") {
            value = value.toString();
        }

        this.value = new BigNumber(value);
        this.sizeInBytes = type.sizeInBytes;
        this.withSign = type.withSign;

        if (this.value.isNaN()) {
            throw new errors.ErrInvalidArgument(`not a number: ${value}`);
        }

        if (!this.withSign && this.value.isNegative()) {
            throw new errors.ErrInvalidArgument(`negative, but type is unsigned: ${value}`);
        }
    }

    getClassName(): string {
        return NumericalValue.ClassName;
    }

    /**
     * Returns whether two objects have the same value.
     *
     * @param other another NumericalValue
     */
    equals(other: NumericalValue): boolean {
        return this.value.isEqualTo(other.value);
    }

    valueOf(): BigNumber {
        return this.value;
    }

    toString(): string {
        return this.value.toString();
    }
}

export class U8Value extends NumericalValue {
    static ClassName = "U8Value";

    constructor(value: BigNumber.Value | bigint) {
        super(new U8Type(), value);
    }

    getClassName(): string {
        return U8Value.ClassName;
    }
}

export class I8Value extends NumericalValue {
    static ClassName = "I8Value";

    constructor(value: BigNumber.Value | bigint) {
        super(new I8Type(), value);
    }

    getClassName(): string {
        return I8Value.ClassName;
    }
}

export class U16Value extends NumericalValue {
    static ClassName = "U16Value";

    constructor(value: BigNumber.Value | bigint) {
        super(new U16Type(), value);
    }

    getClassName(): string {
        return U16Value.ClassName;
    }
}

export class I16Value extends NumericalValue {
    static ClassName = "I16Value";

    constructor(value: BigNumber.Value | bigint) {
        super(new I16Type(), value);
    }

    getClassName(): string {
        return I16Value.ClassName;
    }
}

export class U32Value extends NumericalValue {
    static ClassName = "U32Value";

    constructor(value: BigNumber.Value | bigint) {
        super(new U32Type(), value);
    }

    getClassName(): string {
        return U32Value.ClassName;
    }
}

export class I32Value extends NumericalValue {
    static ClassName = "I32Value";

    constructor(value: BigNumber.Value | bigint) {
        super(new I32Type(), value);
    }

    getClassName(): string {
        return I32Value.ClassName;
    }
}

export class U64Value extends NumericalValue {
    static ClassName = "U64Value";

    constructor(value: BigNumber.Value | bigint) {
        super(new U64Type(), value);
    }

    getClassName(): string {
        return U64Value.ClassName;
    }
}

export class I64Value extends NumericalValue {
    static ClassName = "I64Value";

    constructor(value: BigNumber.Value | bigint) {
        super(new I64Type(), value);
    }

    getClassName(): string {
        return I64Value.ClassName;
    }
}

export class BigUIntValue extends NumericalValue {
    static ClassName = "BigUIntValue";

    constructor(value: BigNumber.Value | bigint) {
        super(new BigUIntType(), value);
    }

    getClassName(): string {
        return BigUIntValue.ClassName;
    }
}

export class BigIntValue extends NumericalValue {
    static ClassName = "BigIntValue";

    constructor(value: BigNumber.Value | bigint) {
        super(new BigIntType(), value);
    }

    getClassName(): string {
        return BigIntValue.ClassName;
    }
}
