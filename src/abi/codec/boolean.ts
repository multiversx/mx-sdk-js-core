import * as errors from "../../core/errors";
import { BooleanValue } from "../typesystem";

/**
 * Encodes and decodes "BooleanValue" objects.
 */
export class BooleanBinaryCodec {
    private static readonly TRUE: number = 0x01;
    private static readonly FALSE: number = 0x00;

    decodeNested(buffer: Buffer): [BooleanValue, number] {
        // We don't check the size of the buffer, we just read the first byte.

        let byte = buffer.readUInt8(0);
        return [new BooleanValue(byte == BooleanBinaryCodec.TRUE), 1];
    }

    decodeTopLevel(buffer: Buffer): BooleanValue {
        if (buffer.length > 1) {
            throw new errors.ErrInvalidArgument("buffer should be of size <= 1");
        }

        let firstByte = buffer[0];
        return new BooleanValue(firstByte == BooleanBinaryCodec.TRUE);
    }

    encodeNested(primitive: BooleanValue): Buffer {
        if (primitive.isTrue()) {
            return Buffer.from([BooleanBinaryCodec.TRUE]);
        }

        return Buffer.from([BooleanBinaryCodec.FALSE]);
    }

    encodeTopLevel(primitive: BooleanValue): Buffer {
        if (primitive.isTrue()) {
            return Buffer.from([BooleanBinaryCodec.TRUE]);
        }

        return Buffer.from([]);
    }
}
