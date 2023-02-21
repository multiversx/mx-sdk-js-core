import BigNumber from "bignumber.js";
import { Address } from "../address";
import { IAddress } from "../interface";
import * as contractsCodecUtils from "../smartcontracts/codec/utils";
import * as codecUtils from "../utils.codec";

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

export function bigIntToHex(value: BigNumber.Value): string {
    if (value == 0) {
        return "";
    }

    return contractsCodecUtils.getHexMagnitudeOfBigInt(value);
}

export function utf8ToHex(value: string) {
    const hex = Buffer.from(value).toString("hex");
    return codecUtils.zeroPadStringIfOddLength(hex);
}

export function bufferToHex(value: Buffer) {
    const hex = value.toString("hex");
    return codecUtils.zeroPadStringIfOddLength(hex);
}

export function addressToHex(address: IAddress): string {
    const buffer = Address.fromBech32(address.toString()).pubkey();
    return buffer.toString("hex");
}
