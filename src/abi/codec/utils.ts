import BigNumber from "bignumber.js";
import { ErrCodec } from "../../core/errors";
import { MaxNumericByteLength } from "./constants";
import { numberToPaddedHex } from "../../core/utils.codec";

/**
 * Returns whether the most significant bit of a given byte (within a buffer) is 1.
 * @param buffer the buffer to test
 * @param byteIndex the index of the byte to test
 */
export function isMsbOne(buffer: Buffer, byteIndex: number = 0): boolean {
    let byte = buffer[byteIndex];
    let bit = byte >> 7;
    let isSet = bit == 1;
    return isSet;
}

/**
 * Returns whether the most significant bit of a given byte (within a buffer) is 0.
 * @param buffer the buffer to test
 * @param byteIndex the index of the byte to test
 */
export function isMsbZero(buffer: Buffer, byteIndex: number = 0): boolean {
    return !isMsbOne(buffer, byteIndex);
}

export function cloneBuffer(buffer: Buffer): Buffer {
    let clone = Buffer.alloc(buffer.length);
    buffer.copy(clone);
    return clone;
}

export function decodeUnsignedBigInt(bytes: Uint8Array): bigint {
    if (bytes.length > MaxNumericByteLength) {
        throw new ErrCodec(`Numeric payload too large: ${bytes.length} > ${MaxNumericByteLength}`);
    }

    const hex = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString("hex");
    return hex ? BigInt(`0x${hex}`) : 0n;
}

export function bufferToBigInt(buffer: Buffer): BigNumber {
    return new BigNumber(decodeUnsignedBigInt(buffer).toString());
}

export function bigIntToBuffer(value: BigNumber.Value): Buffer {
    // Currently, in JavaScript, this is the feasible way to achieve reliable, arbitrary-size BigInt to Buffer conversion.
    let hex = getHexMagnitudeOfBigInt(value);
    return Buffer.from(hex, "hex");
}

export function getHexMagnitudeOfBigInt(value: BigNumber.Value): string {
    value = new BigNumber(value);

    if (!value) {
        return "";
    }

    if (value.isNegative()) {
        value = value.multipliedBy(new BigNumber(-1));
    }

    return numberToPaddedHex(value);
}

export function flipBufferBitsInPlace(buffer: Buffer) {
    for (let i = 0; i < buffer.length; i++) {
        buffer[i] = ~buffer[i];
    }
}

export function prependByteToBuffer(buffer: Buffer, byte: number): Buffer {
    return Buffer.concat([Buffer.from([byte]), buffer]);
}
