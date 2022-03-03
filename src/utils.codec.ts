import BigNumber from "bignumber.js";

export function numberToPaddedHex(value: BigNumber.Value) {
    let hex = new BigNumber(value).toString(16);
    let padding = "0";

    if (hex.length % 2 == 1) {
        hex = padding + hex;
    }

    return hex;
}
