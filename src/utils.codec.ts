export function numberToPaddedHex(value: number) {
    let hex = value.toString(16);
    let padding = "0";

    if (hex.length % 2 == 1) {
        hex = padding + hex;
    }

    return hex;
}
