import BigNumber from "bignumber.js";
import * as contractsCodecUtils from "../abi/codec/utils";

export function numberToPaddedHex(value: bigint | number | BigNumber.Value) {
    let hexableNumber: { toString(radix?: number): string };

    if (typeof value === "bigint" || typeof value === "number") {
        hexableNumber = value;
    } else {
        hexableNumber = new BigNumber(value);
    }

    const hex = hexableNumber.toString(16);
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
