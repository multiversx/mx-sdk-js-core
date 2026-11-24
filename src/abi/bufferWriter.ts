import { TypedValue } from "./typesystem";

/**
 * Interface for codec operations.
 */
export interface ICodec {
    decodeTopLevel(buffer: Buffer, type: import("./typesystem").Type): TypedValue;
    encodeTopLevel(typedValue: TypedValue): Buffer;
}

/**
 * Helper class for writing typed values to buffers.
 * Accumulates encoded buffers in an internal array.
 */
export class BufferWriter {
    private readonly buffers: Buffer[] = [];
    private readonly codec: ICodec;

    constructor(codec: ICodec) {
        this.codec = codec;
    }

    /**
     * Encodes and writes a typed value to the buffer list.
     * 
     * @param value - The typed value to encode and write
     */
    write(value: TypedValue): void {
        const buffer = this.codec.encodeTopLevel(value);
        this.buffers.push(buffer);
    }

    /**
     * Returns all accumulated buffers.
     */
    getBuffers(): Buffer[] {
        return this.buffers;
    }

    /**
     * Returns the number of buffers written.
     */
    getCount(): number {
        return this.buffers.length;
    }
}
