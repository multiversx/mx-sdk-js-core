import * as fs from "fs";
import path from "path";

/**
 * A record of "src/testdata/blsVectors.json" (generated with the Go implementation, see "src/testdata/README.md").
 * The points ("...AsPoint") aren't used by the tests of the public API; they are kept for debugging an implementation.
 */
export interface IBlsVector {
    secretKey: string;
    publicKey: string;
    publicKeyAsPoint: { px: IFp2; py: IFp2; pz: IFp2 };
    // Plain text; the bytes that get signed are its UTF-8 encoding.
    message: string;
    messageMapped: string;
    messageMappedAsPoint: { px: string; py: string; pz: string };
    signature: string;
    signatureAsPoint: { px: string; py: string; pz: string };
}

interface IFp2 {
    c0: string;
    c1: string;
}

/**
 * A record of "src/testdata/blsVectorsExtended.json" (see "src/testdata/README.md").
 */
export interface IBlsExtendedVector {
    group: "edge-keys" | "message-lengths" | "structured-messages";
    note: string;
    secretKey: string;
    publicKey: string;
    messageHex: string;
    // The message, hashed and mapped to G1 (the signature is this point, multiplied by the secret key).
    messageMapped: string;
    signature: string;
    // The path taken while hashing and mapping the message to G1 (Herumi's "calcBN").
    hashToCurve: {
        // The hash, cut to 381 bits, wasn't lower than the field modulus, so one more bit was dropped.
        maskedTwice: boolean;
        // Which of the three "x" candidates landed on the curve.
        candidate: 0 | 1 | 2;
        // Whether "y" was negated (the input isn't a square in the field).
        negated: boolean;
    };
}

export function loadBlsVectors(): IBlsVector[] {
    return loadJson("blsVectors.json");
}

export function loadBlsExtendedVectors(): IBlsExtendedVector[] {
    return loadJson("blsVectorsExtended.json");
}

function loadJson(file: string): any {
    return JSON.parse(fs.readFileSync(path.join("src", "testdata", file), "utf-8"));
}
