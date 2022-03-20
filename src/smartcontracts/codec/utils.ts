import BigNumber from "bignumber.js";
import { numberToPaddedHex } from "../../utils.codec";

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

export function cloneBuffer(buffer: Buffer) {
    let clone = Buffer.alloc(buffer.length);
    buffer.copy(clone);
    return clone;
}

export function bufferToBigInt(buffer: Buffer): BigNumber {
    // Currently, in JavaScript, this is the feasible way to achieve reliable, arbitrary-size Buffer to BigInt conversion.
    let hex = buffer.toString("hex");
    return new BigNumber(`0x${hex}`, 16);
}

export function bigIntToBuffer(value: BigNumber): Buffer {
    // Currently, in JavaScript, this is the feasible way to achieve reliable, arbitrary-size BigInt to Buffer conversion.
    let hex = getHexMagnitudeOfBigInt(value);
    return Buffer.from(hex, "hex");
}

export function getHexMagnitudeOfBigInt(value: BigNumber): string {
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

export function prependByteToBuffer(buffer: Buffer, byte: number) {
    return Buffer.concat([Buffer.from([byte]), buffer]);
}
