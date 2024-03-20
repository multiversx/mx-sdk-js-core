import { ARGUMENTS_SEPARATOR } from "../constants";
import { BinaryCodec } from "./codec";
import { Type, TypedValue, U32Type, U32Value } from "./typesystem";
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
        // TODO: Refactor, split (function is quite complex).
        // eslint-disable-next-line @typescript-eslint/no-this-alias
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
            if (type.hasExactClass(OptionalType.ClassName)) {
                const typedValue = readValue(type.getFirstTypeParameter());
                return new OptionalValue(type, typedValue);
            }

            if (type.hasExactClass(VariadicType.ClassName)) {
                return readVariadicValue(type);
            }

            if (type.hasExactClass(CompositeType.ClassName)) {
                const typedValues = [];

                for (const typeParameter of type.getTypeParameters()) {
                    typedValues.push(readValue(typeParameter));
                }

                return new CompositeValue(type, typedValues);
            }

            // Non-composite (singular), non-variadic (fixed) type.
            // The only branching without a recursive call.
            const typedValue = decodeNextBuffer(type);
            return typedValue!;
        }

        function readVariadicValue(type: Type): TypedValue {
            const variadicType = <VariadicType>type;
            const typedValues = [];

            if (variadicType.isCounted) {
                const count: number = readValue(new U32Type()).valueOf().toNumber();

                for (let i = 0; i < count; i++) {
                    typedValues.push(readValue(type.getFirstTypeParameter()));
                }
            } else {
                while (!hasReachedTheEnd()) {
                    typedValues.push(readValue(type.getFirstTypeParameter()));
                }
            }

            return new VariadicValue(variadicType, typedValues);
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
        // TODO: Refactor, split (function is quite complex).
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;

        const buffers: Buffer[] = [];

        for (const value of values) {
            handleValue(value);
        }

        // This is a recursive function. It appends to the "buffers" variable.
        function handleValue(value: TypedValue): void {
            if (value.hasExactClass(OptionalValue.ClassName)) {
                const valueAsOptional = <OptionalValue>value;

                if (valueAsOptional.isSet()) {
                    handleValue(valueAsOptional.getTypedValue());
                }

                return;
            }

            if (value.hasExactClass(VariadicValue.ClassName)) {
                handleVariadicValue(<VariadicValue>value);
                return;
            }

            if (value.hasExactClass(CompositeValue.ClassName)) {
                const valueAsComposite = <CompositeValue>value;

                for (const item of valueAsComposite.getItems()) {
                    handleValue(item);
                }

                return;
            }

            // Non-composite (singular), non-variadic (fixed) type.
            // The only branching without a recursive call.
            const buffer: Buffer = self.codec.encodeTopLevel(value);
            buffers.push(buffer);
        }

        function handleVariadicValue(value: VariadicValue): void {
            const variadicType = <VariadicType>value.getType();

            if (variadicType.isCounted) {
                const countValue = new U32Value(value.getItems().length);
                buffers.push(self.codec.encodeTopLevel(countValue));
            }

            for (const item of value.getItems()) {
                handleValue(item);
            }
        }

        return buffers;
    }
}
