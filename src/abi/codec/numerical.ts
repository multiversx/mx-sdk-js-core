import BigNumber from "bignumber.js";
import { NumericalType, NumericalValue } from "../typesystem";
import { ErrInvalidArgument } from "../../core/errors";
import { SizeOfU32 } from "./constants";
import {
    bigIntToBuffer,
    decodeUnsignedBigInt,
    flipBufferBitsInPlace,
    isMsbOne,
    isMsbZero,
    prependByteToBuffer,
} from "./utils";

/**
 * Encodes and decodes "NumericalValue" objects.
 */
export class NumericalBinaryCodec {
    decodeNested(buffer: Buffer, type: NumericalType): [NumericalValue, number] {
        let offset = 0;
        let length = type.sizeInBytes;

        if (!length) {
            // Size of type is not known: arbitrary-size big integer.
            // Therefore, we must read the length from the header.
            offset = SizeOfU32;
            length = buffer.readUInt32BE(0);
        }

        let payload = buffer.slice(offset, offset + length);
        let result = this.decodeTopLevel(payload, type);
        let decodedLength = length + offset;
        return [result, decodedLength];
    }

    decodeTopLevel(buffer: Buffer, type: NumericalType): NumericalValue {
        if (type.hasFixedSize() && buffer.length > type.sizeInBytes) {
            throw new ErrInvalidArgument(`Encoded ${type} exceeds ${type.sizeInBytes} bytes`);
        }
        const magnitude = decodeUnsignedBigInt(buffer);
        const value = type.withSign ? BigInt.asIntN(buffer.length * 8, magnitude) : magnitude;
        return new NumericalValue(type, value);
    }

    encodeNested(primitive: NumericalValue): Buffer {
        if (primitive.sizeInBytes) {
            return this.encodeNestedFixedSize(primitive, primitive.sizeInBytes);
        }

        // Size is not known: arbitrary-size big integer. Therefore, we must emit the length (as U32) before the actual payload.
        let buffer = this.encodeTopLevel(primitive);
        let length = Buffer.alloc(SizeOfU32);
        length.writeUInt32BE(buffer.length);
        return Buffer.concat([length, buffer]);
    }

    private encodeNestedFixedSize(primitive: NumericalValue, size: number): Buffer {
        if (primitive.value.isZero()) {
            return Buffer.alloc(size, 0x00);
        }

        if (!primitive.withSign) {
            const buffer = bigIntToBuffer(primitive.value);
            const paddingBytes = Buffer.alloc(size - buffer.length, 0x00);

            return Buffer.concat([paddingBytes, buffer]);
        }

        if (primitive.value.isPositive()) {
            let buffer = bigIntToBuffer(primitive.value);

            // Fix ambiguity if any
            if (isMsbOne(buffer)) {
                buffer = prependByteToBuffer(buffer, 0x00);
            }

            const paddingBytes = Buffer.alloc(size - buffer.length, 0x00);
            return Buffer.concat([paddingBytes, buffer]);
        }

        // Negative:
        // Also see: https://github.com/multiversx/mx-components-big-int/blob/master/twos-complement/bigint2twos.go
        let valuePlusOne = primitive.value.plus(new BigNumber(1));
        let buffer = bigIntToBuffer(valuePlusOne);
        flipBufferBitsInPlace(buffer);

        // Fix ambiguity if any
        if (isMsbZero(buffer)) {
            buffer = prependByteToBuffer(buffer, 0xff);
        }

        const paddingBytes = Buffer.alloc(size - buffer.length, 0xff);
        return Buffer.concat([paddingBytes, buffer]);
    }

    encodeTopLevel(primitive: NumericalValue): Buffer {
        let withSign = primitive.withSign;

        // Nothing or Zero:
        if (primitive.value.isZero()) {
            return Buffer.alloc(0);
        }

        // I don't care about the sign:
        if (!withSign) {
            return bigIntToBuffer(primitive.value);
        }

        return this.encodePrimitive(primitive);
    }

    encodePrimitive(primitive: NumericalValue): Buffer {
        // Positive:
        if (primitive.value.isPositive()) {
            let buffer = bigIntToBuffer(primitive.value);

            // Fix ambiguity if any
            if (isMsbOne(buffer)) {
                buffer = prependByteToBuffer(buffer, 0x00);
            }

            return buffer;
        }

        // Negative:
        // Also see: https://github.com/multiversx/mx-components-big-int/blob/master/twos-complement/bigint2twos.go
        let valuePlusOne = primitive.value.plus(new BigNumber(1));
        let buffer = bigIntToBuffer(valuePlusOne);
        flipBufferBitsInPlace(buffer);

        // Fix ambiguity if any
        if (isMsbZero(buffer)) {
            buffer = prependByteToBuffer(buffer, 0xff);
        }

        return buffer;
    }
}
