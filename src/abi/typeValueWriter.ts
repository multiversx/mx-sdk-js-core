import { TypedValue, U32Value } from "./typesystem";
import { CompositeValue } from "./typesystem/composite";
import { OptionalValue } from "./typesystem/algebraic";
import { VariadicType, VariadicValue } from "./typesystem/variadic";
import { BufferWriter } from "./bufferWriter";

/**
 * Handles recursive writing of typed values to buffers.
 * Supports complex types including Optional, Variadic, and Composite types.
 */
export class TypeValueWriter {
    private readonly bufferWriter: BufferWriter;

    constructor(bufferWriter: BufferWriter) {
        this.bufferWriter = bufferWriter;
    }

    /**
     * Writes a typed value to buffers.
     * Handles recursive types (Optional, Variadic, Composite).
     * 
     * @param value - The typed value to write
     */
    writeValue(value: TypedValue): void {
        if (value.hasExactClass(OptionalValue.ClassName)) {
            this.writeOptionalValue(<OptionalValue>value);
            return;
        }

        if (value.hasExactClass(VariadicValue.ClassName)) {
            this.writeVariadicValue(<VariadicValue>value);
            return;
        }

        if (value.hasExactClass(CompositeValue.ClassName)) {
            this.writeCompositeValue(<CompositeValue>value);
            return;
        }

        // Non-composite, non-variadic type
        this.writeSingleValue(value);
    }

    private writeOptionalValue(value: OptionalValue): void {
        if (value.isSet()) {
            this.writeValue(value.getTypedValue());
        }
    }

    private writeVariadicValue(value: VariadicValue): void {
        const variadicType = <VariadicType>value.getType();

        if (variadicType.isCounted) {
            const countValue = new U32Value(value.getItems().length);
            this.bufferWriter.write(countValue);
        }

        for (const item of value.getItems()) {
            this.writeValue(item);
        }
    }

    private writeCompositeValue(value: CompositeValue): void {
        for (const item of value.getItems()) {
            this.writeValue(item);
        }
    }

    private writeSingleValue(value: TypedValue): void {
        this.bufferWriter.write(value);
    }
}
