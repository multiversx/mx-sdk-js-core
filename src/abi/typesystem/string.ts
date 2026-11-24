import * as errors from "../../core/errors";
import { PrimitiveType, PrimitiveValue } from "./types";

export class StringType extends PrimitiveType {
    static ClassName = "StringType";

    constructor() {
        super("utf-8 string");
    }

    getClassName(): string {
        return StringType.ClassName;
    }
}

export class StringValue extends PrimitiveValue {
    static ClassName = "StringValue";
    private readonly value: string;

    constructor(value: string) {
        super(new StringType());
        this.value = value;
    }

    getClassName(): string {
        return StringValue.ClassName;
    }

    /**
     * Creates a StringValue from a utf-8 string.
     */
    static fromUTF8(value: string): StringValue {
        return new StringValue(value);
    }

    /**
     * Creates a StringValue from a hex-encoded string.
     */
    static fromHex(value: string): StringValue {
        let decodedValue = Buffer.from(value, "hex").toString();
        return new StringValue(decodedValue);
    }

    /**
     * Creates a StringValue from native JavaScript types.
     * @param native - Native value (Buffer or string)
     * @returns StringValue instance
     * @throws ErrInvalidArgument if conversion fails
     */
    static fromNative(native: Buffer | string): StringValue {
        if (native === undefined) {
            throw new errors.ErrInvalidArgument("Cannot convert undefined to StringValue");
        }

        if (native instanceof Buffer) {
            return new StringValue(native.toString());
        }
        if (typeof native === "string") {
            return new StringValue(native);
        }

        throw new errors.ErrInvalidArgument(`Cannot convert value to StringValue: ${native}`);
    }

    getLength(): number {
        return this.value.length;
    }

    /**
     * Returns whether two objects have the same value.
     */
    equals(other: StringValue): boolean {
        return this.value === other.value;
    }

    valueOf(): string {
        return this.value;
    }
}
