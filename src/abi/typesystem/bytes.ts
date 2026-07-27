import * as errors from "../../core/errors";
import { numberToPaddedHex } from "../../core/utils.codec";
import { PrimitiveType, PrimitiveValue } from "./types";

export class BytesType extends PrimitiveType {
    static ClassName = "BytesType";

    constructor() {
        super("bytes");
    }

    getClassName(): string {
        return BytesType.ClassName;
    }
}

export class BytesValue extends PrimitiveValue {
    static ClassName = "BytesValue";
    private readonly value: Buffer;

    constructor(value: Buffer) {
        super(new BytesType());
        this.value = value;
    }

    getClassName(): string {
        return BytesValue.ClassName;
    }

    /**
     * Creates a BytesValue from a utf-8 string.
     */
    static fromUTF8(value: string): BytesValue {
        let buffer = Buffer.from(value, "utf-8");
        return new BytesValue(buffer);
    }

    /**
     * Creates a BytesValue from a hex-encoded string.
     */
    static fromHex(value: string): BytesValue {
        let buffer = Buffer.from(value, "hex");
        return new BytesValue(buffer);
    }

    /**
     * Creates a BytesValue from various native JavaScript types.
     * @param native - Native value (Buffer, string, or object with valueOf())
     * @returns BytesValue instance
     * @throws ErrInvalidArgument if conversion fails
     */
    static fromNative(native: Buffer | string | { valueOf(): Buffer | number }): BytesValue {
        if (native === undefined) {
            throw new errors.ErrInvalidArgument("Cannot convert undefined to BytesValue");
        }

        const innerValue = native.valueOf();

        if (native instanceof Buffer) {
            return new BytesValue(native);
        }
        if (typeof native === "string") {
            return BytesValue.fromUTF8(native);
        }
        if (innerValue instanceof Buffer) {
            return new BytesValue(innerValue);
        }
        if (typeof innerValue === "number") {
            return BytesValue.fromHex(numberToPaddedHex(innerValue));
        }

        throw new errors.ErrInvalidArgument(`Cannot convert value to BytesValue: ${native}`);
    }

    getLength(): number {
        return this.value.length;
    }

    /**
     * Returns whether two objects have the same value.
     */
    equals(other: BytesValue): boolean {
        if (this.getLength() != other.getLength()) {
            return false;
        }

        return this.value.equals(other.value);
    }

    valueOf(): Buffer {
        return this.value;
    }

    toString() {
        return this.value.toString();
    }
}
