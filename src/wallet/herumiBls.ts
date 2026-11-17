/**
 * BLS signatures over the curve BLS12-381, as computed by Herumi's libraries (MCL, BLS) in their default mode.
 * This is the scheme of the validator keys: the public keys are points of G2 (96 bytes), the signatures are points of G1 (48 bytes).
 *
 * The arithmetic (fields, curves) is the one of "@noble/curves". The scheme itself is implemented here, since Herumi's
 * default mode differs from the standard one (IETF, Ethereum), which is what "@noble/curves" provides out of the box:
 *  - the generator of G2 is not the standard one;
 *  - a message is hashed and mapped to G1 by SHA-512, followed by the Shallue - van de Woestijne map
 *    (as described by Fouque and Tibouchi), instead of the standard "hash_to_curve";
 *  - a point is serialized as its "x" coordinate, little-endian, plus one flag: the parity of "y".
 *
 * The references to the source code of MCL are for the version 2.00: https://github.com/herumi/mcl/tree/v2.00
 *
 * This module is internal (it is not a part of the public API of the package). It is loaded on first use (see "validatorKeys.ts"),
 * since loading "@noble/curves/bls12-381" takes a while, and most applications never handle validator keys.
 */
import { bls12_381 } from "@noble/curves/bls12-381.js";
import { sha512 } from "@noble/hashes/sha2.js";

const Fp = bls12_381.fields.Fp;
const Fp2 = bls12_381.fields.Fp2;
const G1 = bls12_381.G1.Point;
const G2 = bls12_381.G2.Point;

export type G1Point = InstanceType<typeof G1>;
export type G2Point = InstanceType<typeof G2>;
export type Fp2Element = { c0: bigint; c1: bigint };

export const SECRET_KEY_LENGTH = 32;
export const PUBLIC_KEY_LENGTH = 96;
export const SIGNATURE_LENGTH = 48;

/**
 * The modulus of the base field.
 */
const P: bigint = Fp.ORDER;

/**
 * The order of the groups G1 and G2. A secret key is a number between 1 and this order (exclusive).
 */
export const GROUP_ORDER: bigint = bls12_381.fields.Fr.ORDER;

const FP_LENGTH = 48;
const FP_BITS = 381;

/**
 * The curve of G1 is y^2 = x^3 + 4.
 */
const G1_B = 4n;

/**
 * The cofactor of G1: (z - 1)^2 / 3, where "z" is the parameter of the curve.
 * MCL multiplies by the cofactor itself ("MapTo::mulByCofactorBLS12()"), not by the shorter "effective" cofactor (1 - z).
 */
const G1_COFACTOR = 0x396c8c005555e1568c00aaab0000aaabn;

/**
 * The generator of G2 used by Herumi's BLS library in its default (non-Ethereum) mode.
 * It is not the standard generator of BLS12-381 (which "@noble/curves" holds as "G2.Point.BASE", and which is left untouched).
 */
const G2_GENERATOR: G2Point = G2.fromAffine({
    x: Fp2.create({
        c0: 0x0f3d011af81acf00140aab3c122c61bbdf0628db81c37664bdfc828163ce074ee33a1a5ce5488556603bc5d8d9f21eccn,
        c1: 0x171df7a5080f908a16c2658ea90164e28c924c3f0e6655f6d82adca6bfbdfb5f9efca82c1609676fa15cd30396f1a4b3n,
    }),
    y: Fp2.create({
        c0: 0x0738a4db169d33b52ecdf6470030add6488ec3e8fc746734b9107c5315b6352675479f364fc210e5e46857278215abd1n,
        c1: 0x19e96417debc6d686aead20955eacc0c18fa0ec8162a32f18e5e390bee6bc4f3c80be4ba018d7f6b488f2445de040696n,
    }),
});

/**
 * Constants of the map to G1 (MCL: "MapTo::initBLS12()", bn.hpp).
 * c1 = sqrt(-3)
 * c2 = (c1 - 1) / 2
 */
const MAP_C1 = 0xbe32ce5fbeed9ca374d38c0ed41eefd5bb675277cdf12d11bc2fb026c41400045c03fffffffdfffdn;
const MAP_C2 = 0x5f19672fdf76ce51ba69c6076a0f77eaddb3a93be6f89688de17d813620a00022e01fffffffefffen;

/**
 * The flag set on the last byte of a serialized point, when "y" is odd.
 */
const FLAG_Y_IS_ODD = 0x80;

/**
 * Exposed for tests.
 */
export const internals = { G2_GENERATOR, G1_COFACTOR, MAP_C1, MAP_C2 };

export function littleEndianToBigInt(bytes: Uint8Array): bigint {
    let value = 0n;

    for (let i = bytes.length - 1; i >= 0; i--) {
        value = (value << 8n) | BigInt(bytes[i]);
    }

    return value;
}

function bigIntToLittleEndian(value: bigint, length: number): Uint8Array {
    const bytes = new Uint8Array(length);

    for (let i = 0; i < length; i++) {
        bytes[i] = Number(value & 0xffn);
        value >>= 8n;
    }

    if (value != 0n) {
        throw new Error("the number does not fit the given length");
    }

    return bytes;
}

/**
 * Converts a secret key (32 bytes, little-endian) to a scalar.
 * The scalar is not checked here; see "isValidSecretScalar()".
 */
export function secretKeyToScalar(secretKey: Uint8Array): bigint {
    if (secretKey.length != SECRET_KEY_LENGTH) {
        throw new Error(`a secret key must have ${SECRET_KEY_LENGTH} bytes`);
    }

    return littleEndianToBigInt(secretKey);
}

export function isValidSecretScalar(scalar: bigint): boolean {
    return scalar > 0n && scalar < GROUP_ORDER;
}

function requireValidSecretScalar(scalar: bigint) {
    if (!isValidSecretScalar(scalar)) {
        throw new Error("the secret scalar is out of range");
    }
}

/**
 * The public key (a point of G2) of a secret key.
 */
export function computePublicKeyPoint(secretScalar: bigint): G2Point {
    requireValidSecretScalar(secretScalar);
    return G2_GENERATOR.multiply(secretScalar);
}

/**
 * The public key of a secret key, serialized (96 bytes).
 */
export function computePublicKey(secretScalar: bigint): Uint8Array {
    return serializeG2Point(computePublicKeyPoint(secretScalar));
}

/**
 * The signature (a point of G1): the message, hashed and mapped to G1, then multiplied by the secret key.
 */
export function signToPoint(secretScalar: bigint, message: Uint8Array): G1Point {
    requireValidSecretScalar(secretScalar);
    return hashAndMapToG1(message).multiply(secretScalar);
}

/**
 * The signature of a message, serialized (48 bytes).
 */
export function sign(secretScalar: bigint, message: Uint8Array): Uint8Array {
    return serializeG1Point(signToPoint(secretScalar, message));
}

/**
 * MCL: "hashAndMapToG1()" (bn.hpp).
 */
export function hashAndMapToG1(message: Uint8Array): G1Point {
    return mapToG1(hashToFp(message));
}

/**
 * MCL: "Fp::setHashOf()", which ends up in "Fp::setArrayMask()" (fp.hpp), given the SHA-512 of the message.
 *
 * The first 48 bytes of the hash are read as a little-endian number, of which the lowest 381 bits are kept (the size of the field modulus).
 * If the outcome is not lower than the modulus, one more bit is dropped (it is not reduced modulo the modulus).
 */
export function hashToFp(message: Uint8Array): bigint {
    const hash = sha512(message);
    let value = littleEndianToBigInt(hash.subarray(0, FP_LENGTH)) & ((1n << BigInt(FP_BITS)) - 1n);

    if (value >= P) {
        value &= (1n << BigInt(FP_BITS - 1)) - 1n;
    }

    return value;
}

/**
 * MCL: "MapTo::calc()", that is "MapTo::calcBN()" followed by "MapTo::mulByCofactorBLS12()" (bn.hpp).
 *
 * The Shallue - van de Woestijne map, as described in "Indifferentiable Hashing to Barreto-Naehrig Curves" (Fouque, Tibouchi):
 * out of three candidates for "x", at least one is the abscissa of a point of the curve; the first such one is picked.
 */
export function mapToG1(t: bigint): G1Point {
    if (!Fp.isValid(t) || Fp.is0(t)) {
        throw new Error("cannot map to G1: bad input");
    }

    // w = sqrt(-3) * t / (1 + b + t^2)
    let w = Fp.add(Fp.add(Fp.sqr(t), G1_B), Fp.ONE);
    if (Fp.is0(w)) {
        throw new Error("cannot map to G1: bad input");
    }

    w = Fp.mul(Fp.mul(Fp.inv(w), MAP_C1), t);

    // "y" is negated if "t" is not a square. Here, "t" is never zero, thus the Legendre symbol is either 1 or -1.
    const shouldNegate = !Fp.eql(Fp.pow(t, (P - 1n) / 2n), Fp.ONE);

    let x = Fp.ZERO;

    for (let i = 0; i < 3; i++) {
        if (i == 0) {
            // x1 = (-1 + sqrt(-3)) / 2 - t * w
            x = Fp.add(Fp.neg(Fp.mul(t, w)), MAP_C2);
        } else if (i == 1) {
            // x2 = -1 - x1
            x = Fp.sub(Fp.neg(x), Fp.ONE);
        } else {
            // x3 = 1 + 1 / w^2
            x = Fp.add(Fp.inv(Fp.sqr(w)), Fp.ONE);
        }

        // y^2 = x^3 + b
        let y = sqrtFp(Fp.add(Fp.mul(Fp.sqr(x), x), G1_B));
        if (y === undefined) {
            continue;
        }

        if (shouldNegate) {
            y = Fp.neg(y);
        }

        // The input of this multiplication is derived from the message (not from a secret), thus the faster variant is fine.
        return G1.fromAffine({ x, y }).multiplyUnsafe(G1_COFACTOR);
    }

    // Not reachable: one of the three candidates is always on the curve.
    throw new Error("cannot map to G1");
}

/**
 * The square root picked by MCL, for a field whose modulus is 3 (mod 4): value^((p + 1) / 4).
 * Computed here (instead of calling "Fp.sqrt()"), so that the choice between the two roots does not depend on the library underneath.
 * Returns "undefined" if the value is not a square.
 */
function sqrtFp(value: bigint): bigint | undefined {
    const root = Fp.pow(value, (P + 1n) / 4n);
    return Fp.eql(Fp.sqr(root), value) ? root : undefined;
}

/**
 * MCL: "EcT::save()", with "IoSerialize" (ec.hpp).
 */
export function serializeG1Point(point: G1Point): Uint8Array {
    if (point.is0()) {
        return new Uint8Array(SIGNATURE_LENGTH);
    }

    const { x, y } = point.toAffine();
    return serializeG1Coordinates(x, y);
}

export function serializeG1Coordinates(x: bigint, y: bigint): Uint8Array {
    const bytes = bigIntToLittleEndian(x, FP_LENGTH);

    if ((y & 1n) == 1n) {
        bytes[bytes.length - 1] |= FLAG_Y_IS_ODD;
    }

    return bytes;
}

/**
 * MCL: "EcT::save()", with "IoSerialize" (ec.hpp).
 */
export function serializeG2Point(point: G2Point): Uint8Array {
    if (point.is0()) {
        return new Uint8Array(PUBLIC_KEY_LENGTH);
    }

    const { x, y } = point.toAffine();
    return serializeG2Coordinates(x, y);
}

export function serializeG2Coordinates(x: Fp2Element, y: Fp2Element): Uint8Array {
    const bytes = new Uint8Array(PUBLIC_KEY_LENGTH);
    bytes.set(bigIntToLittleEndian(x.c0, FP_LENGTH), 0);
    bytes.set(bigIntToLittleEndian(x.c1, FP_LENGTH), FP_LENGTH);

    // MCL: "Fp2::isOdd()" (fp_tower.hpp) looks at the first coefficient only, even when that one is zero.
    // Do not replace this by "Fp2.isOdd()" of "@noble/curves", which then falls back to the second coefficient.
    if ((y.c0 & 1n) == 1n) {
        bytes[bytes.length - 1] |= FLAG_Y_IS_ODD;
    }

    return bytes;
}
