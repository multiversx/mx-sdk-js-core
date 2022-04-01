import BigNumber from "bignumber.js";

export function numberToPaddedHex(value: BigNumber.Value) {
    let hex = new BigNumber(value).toString(16);
    return ensureEvenLengthOfHexString(hex);
}

export function isPaddedHex(input: string) {
    let decodedThenEncoded = Buffer.from(input, "hex").toString("hex");
    return decodedThenEncoded == input;
}

function ensureEvenLengthOfHexString(input: string): string {
    input = input || "";

    if (input.length % 2 == 1) {
        return "0" + input;
    }

    return input;
}
