import { ARGUMENTS_SEPARATOR } from "../constants";
import { BinaryCodec } from "./codec";
import { EndpointParameterDefinition, Type, TypedValue } from "./typesystem";
import { OptionalType, OptionalValue } from "./typesystem/algebraic";
import { CompositeType, CompositeValue } from "./typesystem/composite";
import { VariadicType, VariadicValue } from "./typesystem/variadic";


interface IArgSerializerOptions {
    codec: ICodec;
}

interface ICodec {
    decodeTopLevel(buffer: Buffer, type: Type): TypedValue;
    encodeTopLevel(typedValue: TypedValue): Buffer;
}

// TODO: perhaps move default construction options to a factory (ArgSerializerFactory), instead of referencing them in the constructor
// (postpone as much as possible, breaking change)
const defaultArgSerializerrOptions: IArgSerializerOptions = {
    codec: new BinaryCodec()
};

export class ArgSerializer {
    codec: ICodec;

    constructor(options?: IArgSerializerOptions) {
        options = { ...defaultArgSerializerrOptions, ...options };
        this.codec = options.codec;
    }

    /**
     * Reads typed values from an arguments string (e.g. aa@bb@@cc), given parameter definitions.
     */
    stringToValues(joinedString: string, parameters: EndpointParameterDefinition[]): TypedValue[] {
        let buffers = this.stringToBuffers(joinedString);
        let values = this.buffersToValues(buffers, parameters);
        return values;
    }

    /**
     * Reads raw buffers from an arguments string (e.g. aa@bb@@cc).
     */
    stringToBuffers(joinedString: string): Buffer[] {
        // We also keep the zero-length buffers (they could encode missing options, Option<T>).
        return joinedString.split(ARGUMENTS_SEPARATOR).map(item => Buffer.from(item, "hex"));
    }

    /**
     * Decodes a set of buffers into a set of typed values, given parameter definitions.
     */
    buffersToValues(buffers: Buffer[], parameters: EndpointParameterDefinition[]): TypedValue[] {
        // TODO: Refactor, split (function is quite complex).
        const self = this;

        buffers = buffers || [];

        let values: TypedValue[] = [];
        let bufferIndex = 0;
        let numBuffers = buffers.length;

        for (let i = 0; i < parameters.length; i++) {
            let parameter = parameters[i];
            let type = parameter.type;
            let value = readValue(type);
            values.push(value);
        }

        // This is a recursive function.
        function readValue(type: Type): TypedValue {
            // TODO: Use matchers.

            if (type.hasExactClass(OptionalType.ClassName)) {
                let typedValue = readValue(type.getFirstTypeParameter());
                return new OptionalValue(type, typedValue);
            } else if (type.hasExactClass(VariadicType.ClassName)) {
                let typedValues = [];

                while (!hasReachedTheEnd()) {
                    typedValues.push(readValue(type.getFirstTypeParameter()));
                }

                return new VariadicValue(type, typedValues);
            } else if (type.hasExactClass(CompositeType.ClassName)) {
                let typedValues = [];

                for (const typeParameter of type.getTypeParameters()) {
                    typedValues.push(readValue(typeParameter));
                }

                return new CompositeValue(type, typedValues);
            } else {
                // Non-composite (singular), non-variadic (fixed) type.
                // The only branching without a recursive call.
                let typedValue = decodeNextBuffer(type);
                return typedValue!;
            }
        }

        function decodeNextBuffer(type: Type): TypedValue | null {
            if (hasReachedTheEnd()) {
                return null;
            }

            let buffer = buffers[bufferIndex++];
            let decodedValue = self.codec.decodeTopLevel(buffer, type);
            return decodedValue;
        }

        function hasReachedTheEnd() {
            return bufferIndex >= numBuffers;
        }

        return values;
    }

    /**
     * Serializes a set of typed values into an arguments string (e.g. aa@bb@@cc).
     */
    valuesToString(values: TypedValue[]): { argumentsString: string, count: number } {
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
        let strings = buffers.map(buffer => buffer.toString("hex"));
        return strings;
    }

    /**
     * Serializes a set of typed values into a set of strings buffers.
     * Variadic types and composite types might result into none, one or more buffers.
     */
    valuesToBuffers(values: TypedValue[]): Buffer[] {
        // TODO: Refactor, split (function is quite complex).
        const self = this;

        let buffers: Buffer[] = [];

        for (const value of values) {
            handleValue(value);
        }

        // This is a recursive function. It appends to the "buffers" variable.
        function handleValue(value: TypedValue): void {
            // TODO: Use matchers.

            if (value.hasExactClass(OptionalValue.ClassName)) {
                let valueAsOptional = <OptionalValue>value;
                if (valueAsOptional.isSet()) {
                    handleValue(valueAsOptional.getTypedValue());
                }
            } else if (value.hasExactClass(VariadicValue.ClassName)) {
                let valueAsVariadic = <VariadicValue>value;
                for (const item of valueAsVariadic.getItems()) {
                    handleValue(item);
                }
            } else if (value.hasExactClass(CompositeValue.ClassName)) {
                let valueAsComposite = <CompositeValue>value;
                for (const item of valueAsComposite.getItems()) {
                    handleValue(item);
                }
            } else {
                // Non-composite (singular), non-variadic (fixed) type.
                // The only branching without a recursive call.
                let buffer: Buffer = self.codec.encodeTopLevel(value);
                buffers.push(buffer);
            }
        }

        return buffers;
    }
}
