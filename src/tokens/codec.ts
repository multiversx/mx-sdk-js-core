import BigNumber from "bignumber.js";
import { Address } from "../address";
import { IAddress } from "../interface";
import * as contractsCodecUtils from "../smartcontracts/codec/utils";
import * as codecUtils from "../utils.codec";

export function stringToBuffer(value: string): Buffer {
    return Buffer.from(value);
}

export function bufferToBigInt(buffer: Buffer): BigNumber {
    return contractsCodecUtils.bufferToBigInt(buffer);
}

export function bigIntToBuffer(value: BigNumber.Value): Buffer {
    return contractsCodecUtils.bigIntToBuffer(value);
}

export function bigIntToHex(value: BigNumber.Value): string {
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
    return addressToBuffer(address).toString("hex");
}

export function addressToBuffer(address: IAddress): Buffer {
    return Address.fromBech32(address.toString()).pubkey();
}
