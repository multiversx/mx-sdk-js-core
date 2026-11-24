import { Type, TypedValue } from "./typesystem";

/**
 * Interface for codec operations.
 */
export interface ICodec {
    decodeTopLevel(buffer: Buffer, type: Type): TypedValue;
    encodeTopLevel(typedValue: TypedValue): Buffer;
}

/**
 * Helper class for reading typed values from buffers sequentially.
 * Maintains an internal pointer to track position in the buffer array.
 */
export class BufferReader {
    private readonly buffers: Buffer[];
    private readonly codec: ICodec;
    private bufferIndex: number = 0;

    constructor(buffers: Buffer[], codec: ICodec) {
        this.buffers = buffers || [];
        this.codec = codec;
    }

    /**
     * Returns true if all buffers have been consumed.
     */
    hasReachedEnd(): boolean {
        return this.bufferIndex >= this.buffers.length;
    }

    /**
     * Reads and decodes the next buffer using the provided type.
     * Advances the internal pointer after reading.
     * 
     * @param type - The type to use for decoding
     * @returns The decoded typed value, or null if no more buffers available
     */
    decodeNext(type: Type): TypedValue | null {
        if (this.hasReachedEnd()) {
            return null;
        }

        const buffer = this.buffers[this.bufferIndex++];
        return this.codec.decodeTopLevel(buffer, type);
    }

    /**
     * Gets the current position in the buffer array.
     */
    getPosition(): number {
        return this.bufferIndex;
    }

    /**
     * Gets the total number of buffers.
     */
    getLength(): number {
        return this.buffers.length;
    }
}
