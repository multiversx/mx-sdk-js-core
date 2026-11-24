import { ErrInvalidArgument } from "../core/errors";
import { Type, TypedValue, U32Type } from "./typesystem";
import { CompositeType, CompositeValue } from "./typesystem/composite";
import { OptionalType, OptionalValue } from "./typesystem/algebraic";
import { VariadicType, VariadicValue } from "./typesystem/variadic";
import { BufferReader } from "./bufferReader";

/**
 * Handles recursive reading of typed values from buffers.
 * Supports complex types including Optional, Variadic, and Composite types.
 */
export class TypeValueReader {
    private readonly bufferReader: BufferReader;

    constructor(bufferReader: BufferReader) {
        this.bufferReader = bufferReader;
    }

    /**
     * Reads a typed value based on its type.
     * Handles recursive types (Optional, Variadic, Composite).
     * 
     * @param type - The type to read
     * @returns The decoded typed value
     */
    readValue(type: Type): TypedValue {
        if (type.hasExactClass(OptionalType.ClassName)) {
            return this.readOptionalValue(type);
        }

        if (type.hasExactClass(VariadicType.ClassName)) {
            return this.readVariadicValue(<VariadicType>type);
        }

        if (type.hasExactClass(CompositeType.ClassName)) {
            return this.readCompositeValue(type);
        }

        // Non-composite, non-variadic type
        return this.readSingleValue(type);
    }

    private readOptionalValue(type: Type): OptionalValue {
        const typedValue = this.readValue(type.getFirstTypeParameter());
        return new OptionalValue(type, typedValue);
    }

    private readVariadicValue(type: VariadicType): VariadicValue {
        const typedValues: TypedValue[] = [];

        if (type.isCounted) {
            const count = this.readValue(new U32Type()).valueOf().toNumber();
            for (let i = 0; i < count; i++) {
                typedValues.push(this.readValue(type.getFirstTypeParameter()));
            }
        } else {
            while (!this.bufferReader.hasReachedEnd()) {
                typedValues.push(this.readValue(type.getFirstTypeParameter()));
            }
        }

        return new VariadicValue(type, typedValues);
    }

    private readCompositeValue(type: Type): CompositeValue {
        const typedValues: TypedValue[] = [];

        for (const typeParameter of type.getTypeParameters()) {
            typedValues.push(this.readValue(typeParameter));
        }

        return new CompositeValue(type, typedValues);
    }

    private readSingleValue(type: Type): TypedValue {
        const typedValue = this.bufferReader.decodeNext(type);

        if (typedValue === null) {
            throw new ErrInvalidArgument(
                `Failed to decode value of type ${type.getName()}. Buffer may be incomplete or invalid.`,
            );
        }

        return typedValue;
    }
}
