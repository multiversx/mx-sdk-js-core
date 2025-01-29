import BigNumber from "bignumber.js";
import * as contractsCodecUtils from "../abi/codec/utils";
import * as codecUtils from "../core/utils.codec";

export function stringToBuffer(value: string): Buffer {
    return Buffer.from(value);
}

export function bufferToBigInt(buffer: Buffer): BigNumber {
    if (buffer.length == 0) {
        return new BigNumber(0);
    }

    return contractsCodecUtils.bufferToBigInt(buffer);
}

export function bigIntToBuffer(value: BigNumber.Value): Buffer {
    if (value == 0) {
        return Buffer.from([]);
    }

    return contractsCodecUtils.bigIntToBuffer(value);
}

export { bigIntToHex, utf8ToHex } from "../core/utils.codec";

export function bufferToHex(value: Buffer) {
    const hex = value.toString("hex");
    return codecUtils.zeroPadStringIfOddLength(hex);
}
