import BigNumber from "bignumber.js";
import { Address } from "../address";
import * as contractsCodecUtils from "../smartcontracts/codec/utils";
import * as codecUtils from "../utils.codec";
import { IAddress } from "./interface";

export function stringToBuffer(value: string): Buffer {
    return Buffer.from(value);
}

export function bufferToBigInt(buffer: Buffer): BigNumber {
    return contractsCodecUtils.bufferToBigInt(buffer);
}

export function bufferToPaddedHex(value: Buffer) {
    const hex = value.toString("hex");
    return codecUtils.zeroPadStringIfOddLength(hex);
}

export function addressToBuffer(address: IAddress): Buffer {
    return Address.fromBech32(address.toString()).pubkey();
}
