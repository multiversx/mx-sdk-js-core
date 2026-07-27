import { ARGUMENTS_SEPARATOR } from "../core/constants";
import { BinaryCodec } from "./codec";
import { Type, TypedValue } from "./typesystem";
import { BufferReader } from "./bufferReader";
import { BufferWriter } from "./bufferWriter";
import { TypeValueReader } from "./typeValueReader";
import { TypeValueWriter } from "./typeValueWriter";

interface IArgSerializerOptions {
    codec: ICodec;
}

interface ICodec {
    decodeTopLevel(buffer: Buffer, type: Type): TypedValue;
    encodeTopLevel(typedValue: TypedValue): Buffer;
}

interface IParameterDefinition {
    type: Type;
}

// TODO: perhaps move default construction options to a factory (ArgSerializerFactory), instead of referencing them in the constructor
// (postpone as much as possible, breaking change)
const defaultArgSerializerOptions: IArgSerializerOptions = {
    codec: new BinaryCodec(),
};

export class ArgSerializer {
    codec: ICodec;

    constructor(options?: IArgSerializerOptions) {
        options = { ...defaultArgSerializerOptions, ...options };
        this.codec = options.codec;
    }

    /**
     * Reads typed values from an arguments string (e.g. aa@bb@@cc), given parameter definitions.
     */
    stringToValues(joinedString: string, parameters: IParameterDefinition[]): TypedValue[] {
        let buffers = this.stringToBuffers(joinedString);
        let values = this.buffersToValues(buffers, parameters);
        return values;
    }

    /**
     * Reads raw buffers from an arguments string (e.g. aa@bb@@cc).
     */
    stringToBuffers(joinedString: string): Buffer[] {
        // We also keep the zero-length buffers (they could encode missing options, Option<T>).
        return joinedString.split(ARGUMENTS_SEPARATOR).map((item) => Buffer.from(item, "hex"));
    }

    /**
     * Decodes a set of buffers into a set of typed values, given parameter definitions.
     */
    buffersToValues(buffers: Buffer[], parameters: IParameterDefinition[]): TypedValue[] {
        const bufferReader = new BufferReader(buffers, this.codec);
        const valueReader = new TypeValueReader(bufferReader);
        const values: TypedValue[] = [];

        for (const parameter of parameters) {
            const value = valueReader.readValue(parameter.type);
            values.push(value);
        }

        return values;
    }

    /**
     * Serializes a set of typed values into an arguments string (e.g. aa@bb@@cc).
     */
    valuesToString(values: TypedValue[]): { argumentsString: string; count: number } {
        let strings = this.valuesToStrings(values);
        let argumentsString = strings.join(ARGUMENTS_SEPARATOR);
        let count = strings.length;
        return { argumentsString, count };
    }

    /**
     * Serializes a set of typed values into a set of strings.
     */
    valuesToStrings(values: TypedValue[]): string[] {
        let buffers = this.valuesToBuffers(values);
        let strings = buffers.map((buffer) => buffer.toString("hex"));
        return strings;
    }

    /**
     * Serializes a set of typed values into a set of strings buffers.
     * Variadic types and composite types might result into none, one or more buffers.
     */
    valuesToBuffers(values: TypedValue[]): Buffer[] {
        const bufferWriter = new BufferWriter(this.codec);
        const valueWriter = new TypeValueWriter(bufferWriter);

        for (const value of values) {
            valueWriter.writeValue(value);
        }

        return bufferWriter.getBuffers();
    }
}
