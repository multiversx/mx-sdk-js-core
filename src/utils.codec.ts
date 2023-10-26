import BigNumber from "bignumber.js";
import * as contractsCodecUtils from "./smartcontracts/codec/utils";
import { Address } from "./address";
import { IAddress } from "./interface";

export function numberToPaddedHex(value: BigNumber.Value) {
    let hex = new BigNumber(value).toString(16);
    return zeroPadStringIfOddLength(hex);
}

export function isPaddedHex(input: string) {
    input = input || "";
    let decodedThenEncoded = Buffer.from(input, "hex").toString("hex");
    return input.toUpperCase() == decodedThenEncoded.toUpperCase();
}

export function zeroPadStringIfOddLength(input: string): string {
    input = input || "";

    if (input.length % 2 == 1) {
        return "0" + input;
    }

    return input;
}

export function utf8ToHex(value: string) {
    const hex = Buffer.from(value).toString("hex");
    return zeroPadStringIfOddLength(hex);
}

export function boolToHex(value: boolean) {
    return utf8ToHex(value.toString());
}

export function byteArrayToHex(byteArray: Uint8Array): string {
    const hexString = Buffer.from(byteArray).toString("hex");
    return zeroPadStringIfOddLength(hexString);
}

export function bigIntToHex(value: BigNumber.Value): string {
    if (value == 0) {
        return "";
    }

    return contractsCodecUtils.getHexMagnitudeOfBigInt(value);
}

export function addressToHex(address: IAddress): string {
    const buffer = Address.fromBech32(address.toString()).pubkey();
    return buffer.toString("hex");
}
