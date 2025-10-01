import { FpLegendre, isNegativeLE } from "@noble/curves/abstract/modular";
import * as nobleUtils from "@noble/curves/abstract/utils";
import { bls12_381 as nobleBls } from "@noble/curves/bls12-381";
import { sha512 } from "@noble/hashes/sha512";

const Fp = nobleBls.fields.Fp;
const Fp2 = nobleBls.fields.Fp2;
const Fp12 = nobleBls.fields.Fp12;
const G1 = nobleBls.G1;
const G2 = nobleBls.G2;
const CompressedFlagMask = 0b1000_0000;

const HERUMI_C1_HEX =
    "fdfffdffffff035c040014c426b02fbc112df1cd775267bbd5ef1ed40e8cd374a39cedbe5fce32be0000000000000000";
const HERUMI_C2_HEX =
    "fefffeffffff012e02000a6213d817de8896f8e63ba9b3ddea770f6a07c669ba51ce76df2f67195f0000000000000000";

// Set custom generators for G2. Must be called before any BLS operations.
// Reason: in "mx-chain-crypto-go", we use Herumi with these custom generators.
export function setupG2GeneratorPointsLikeHerumi() {
    nobleBls.G2.CURVE.Gx.c0 = BigInt(
        "0xf3d011af81acf00140aab3c122c61bbdf0628db81c37664bdfc828163ce074ee33a1a5ce5488556603bc5d8d9f21ecc",
    );
    nobleBls.G2.CURVE.Gx.c1 = BigInt(
        "0x171df7a5080f908a16c2658ea90164e28c924c3f0e6655f6d82adca6bfbdfb5f9efca82c1609676fa15cd30396f1a4b3",
    );

    nobleBls.G2.CURVE.Gy.c0 = BigInt(
        "0x738a4db169d33b52ecdf6470030add6488ec3e8fc746734b9107c5315b6352675479f364fc210e5e46857278215abd1",
    );
    nobleBls.G2.CURVE.Gy.c1 = BigInt(
        "0x19e96417debc6d686aead20955eacc0c18fa0ec8162a32f18e5e390bee6bc4f3c80be4ba018d7f6b488f2445de040696",
    );
}

// Herumi code: https://github.com/herumi/mcl/blob/v2.00/include/mcl/bn.hpp#L475
// void initBLS12(const mpz_class& z, int curveType) { ... }
// const char *c1 = "be32ce5fbeed9ca374d38c0ed41eefd5bb675277cdf12d11bc2fb026c41400045c03fffffffdfffd";
// const char *c2 = "5f19672fdf76ce51ba69c6076a0f77eaddb3a93be6f89688de17d813620a00022e01fffffffefffe";
export function getHerumiBlsConstants() {
    const c1Bytes = Buffer.from(HERUMI_C1_HEX, "hex");
    const c2Bytes = Buffer.from(HERUMI_C2_HEX, "hex");

    const c1 = nobleUtils.bytesToNumberLE(c1Bytes);
    const c2 = nobleUtils.bytesToNumberLE(c2Bytes);

    return { c1, c2 };
}

// Signs a message, given a secret key.
export function signMessage(message: Uint8Array, secretKey: Uint8Array): { point: any; bytes: Uint8Array } {
    // First, map the message as a point on the G1 curve.
    const messagePoint = hashAndMapToG1LikeHerumi(message).point;
    return doSignMessage(messagePoint, secretKey);
}

function doSignMessage(messagePoint: any, secretKey: Uint8Array): { point: any; bytes: Uint8Array } {
    const secretKeyReversed = Buffer.from(secretKey).reverse();
    const scalar = G1.normPrivateKeyToScalar(secretKeyReversed);
    const signaturePoint = messagePoint.multiply(scalar);
    const signature = projectivePointG1ToBytes(signaturePoint);
    return { point: signaturePoint, bytes: signature };
}

// Herumi code: https://github.com/herumi/mcl/blob/v2.00/include/mcl/bn.hpp#L2122
export function hashAndMapToG1LikeHerumi(message: Uint8Array): { point: any; bytes: Uint8Array } {
    const hash = sha512(message);
    const hashMasked = setArrayMaskLikeHerumi(hash);
    const messagePoint = mapToG1LikeHerumi(hashMasked);
    const messagePointBytes = projectivePointG1ToBytes(messagePoint);
    return { point: messagePoint, bytes: messagePointBytes };
}

// Herumi code: https://github.com/herumi/mcl/blob/v2.00/include/mcl/fp.hpp#L371
// treat x as little endian                     // Documenting comment in Herumi's code.
// x &= (1 << bitLen) - 1                       // Documenting comment in Herumi's code.
// x &= (1 << (bitLen - 1)) - 1 if x >= p       // Documenting comment in Herumi's code (order of operations is depicted ambiguously).
// void setArrayMask(const S *x, size_t n)
// {
//     const size_t dstByte = sizeof(Unit) * op_.N;
//     if (sizeof(S) * n > dstByte) {
//         n = dstByte / sizeof(S);
//     }
//     bool b = fp::convertArrayAsLE(v_, op_.N, x, n);
//     assert(b);
//     (void)b;
//     bint::maskN(v_, op_.N, op_.bitSize);
//     if (bint::cmpGeN(v_, op_.p, op_.N)) {
//         bint::maskN(v_, op_.N, op_.bitSize - 1);
//     }
//     toMont();
// }
export function setArrayMaskLikeHerumi(x: Uint8Array): Uint8Array {
    // Note: "nobleUtils.bitMask()" is implemented as follows:
    // export const bitMask = (n: number): bigint => (_1n << BigInt(n)) - _1n;
    const mask1 = nobleUtils.bitMask(Fp.BITS);
    const mask2 = nobleUtils.bitMask(Fp.BITS - 1);

    let xAsBigInt = nobleUtils.bytesToNumberLE(x);
    xAsBigInt = xAsBigInt & mask1;

    // "if x >= p"
    if (xAsBigInt >= Fp.ORDER) {
        xAsBigInt = xAsBigInt & mask2;
    }

    return nobleUtils.numberToBytesLE(xAsBigInt, Fp.BYTES);
}

function mapToG1LikeHerumi(t: Uint8Array): any {
    // Herumi code: mapToEc(P, t)                   // https://github.com/herumi/mcl/blob/v2.00/include/mcl/bn.hpp#L599
    //                  >> calcBN<G, F>(P, t)       // https://github.com/herumi/mcl/blob/v2.00/include/mcl/bn.hpp#L565
    let P = calcBNLikeHerumi(t);

    // Herumi code: mulByCofactor(P);                           // https://github.com/herumi/mcl/blob/v2.00/include/mcl/bn.hpp#L600
    //              >>  G1::mulGeneric(Q, P, cofactor_);        // https://github.com/herumi/mcl/blob/v2.00/include/mcl/bn.hpp#L430
    P = P.multiply(G1.CURVE.h);

    return P;
}

// Herumi code: https://github.com/herumi/mcl/blob/v2.00/include/mcl/bn.hpp#L362
// "Indifferentiable hashing to Barreto Naehrig curves" by Pierre-Alain Fouque and Mehdi Tibouchi
// https://www.di.ens.fr/~fouque/pub/latincrypt12.pdf
function calcBNLikeHerumi(t: Uint8Array): any {
    let tAsBigInt = nobleUtils.bytesToNumberLE(t);

    const w = calcBNComputeWLikeHerumi(tAsBigInt);
    const P = calcBNLoopLikeHerumi(w, tAsBigInt);
    return P;
}

export function calcBNComputeWLikeHerumi(t: bigint): bigint {
    const { c1 } = getHerumiBlsConstants();

    // Herumi code: if (t.isZero()) return false;
    if (Fp.eql(t, Fp.ZERO)) {
        throw new Error("t == 0");
    }

    // Herumi code: F::sqr(w, t);
    let w = Fp.sqr(t);

    // Herumi code: w += G::b_;
    w = Fp.add(w, G1.CURVE.b);

    // Herumi code: *w.getFp0() += Fp::one();
    w = Fp.add(w, Fp.ONE);

    // Herumi code: if (w.isZero()) return false;
    if (Fp.eql(w, Fp.ZERO)) {
        throw new Error("w == 0");
    }

    // Herumi code: F::inv(w, w);
    w = Fp.inv(w);

    // Herumi code: mulFp(w, c1_);
    w = Fp.mul(w, c1);

    // Herumi code: w *= t;
    w = Fp.mul(w, t);

    return w;
}

export function calcBNLoopLikeHerumi(w: bigint, t: bigint): any {
    let x = BigInt(0);
    let y = BigInt(0);

    const legendreOfT = FpLegendre(Fp, t);
    const legendreOfTIsNegative = legendreOfT < 0;

    for (let i = 0; i < 3; i++) {
        if (i == 0) {
            x = calcBNLoopLikeHerumiIteration0(w, t);
        } else if (i === 1) {
            x = calcBNLoopLikeHerumiIteration1(x);
        } else if (i === 2) {
            x = calcBNLoopLikeHerumiIteration2(w);
        }

        // Herumi code: G::getWeierstrass(y, x);
        y = getWeierstrassLikeHerumi(x);

        // Herumi code: if (F::squareRoot(y, y)) { ... }
        try {
            y = Fp.sqrt(y);
        } catch (e) {
            // No solution, go to next iteration.
            continue;
        }

        if (legendreOfTIsNegative) {
            // Herumi code: F::neg(y, y)
            y = Fp.neg(y);
        }

        // Herumi code: P.set(& b, x, y, false);
        return new G1.ProjectivePoint(x, y, BigInt(1));
    }

    throw new Error("Cannot calcBNLoopLikeHerumi");
}

export function calcBNLoopLikeHerumiIteration0(w: bigint, t: bigint): bigint {
    const { c2 } = getHerumiBlsConstants();

    // Herumi code:
    // F::mul(x, t, w);
    // F::neg(x, x);
    // *x.getFp0() += c2_;
    let x = Fp.mul(t, w);
    x = Fp.neg(x);
    x = Fp.add(x, c2);

    return x;
}

function calcBNLoopLikeHerumiIteration1(x: bigint): bigint {
    // Herumi code:
    // F::neg(x, x);
    // *x.getFp0() -= Fp::one();

    x = Fp.neg(x);
    x = Fp.sub(x, Fp.ONE);

    return x;
}

function calcBNLoopLikeHerumiIteration2(w: bigint): bigint {
    // Herumi code:
    // F::sqr(x, w);
    // F::inv(x, x);
    // *x.getFp0() += Fp::one();

    let x = Fp.sqr(w);
    x = Fp.inv(x);
    x = Fp.add(x, Fp.ONE);

    return x;
}

// Herumi code: https://github.com/herumi/mcl/blob/v2.00/include/mcl/ec.hpp#L1954
// void getWeierstrass(Fp& yy, const Fp& x)
// {
//     Fp t;
//     Fp::sqr(t, x);
//     t += a_;
//     t *= x;
//     Fp::add(yy, t, b_);
// }
export function getWeierstrassLikeHerumi(x: bigint): bigint {
    const a = Fp.ZERO;
    const b = G1.CURVE.b;

    let t = Fp.sqr(x);
    t = Fp.add(t, a);
    t = Fp.mul(t, x);
    const yy = Fp.add(t, b);
    return yy;
}

// We don't directly use Noble Crypto's toBytes(), since that handles not only the "compressed" flag, but also the flags "infinity" and "sort",
// which aren't handled in Herumi's implementation (at least, not in the version that the Protocol relies on).
// See: https://github.com/paulmillr/noble-curves/blob/1.6.0/src/bls12-381.ts#L382
// This works for "G1" points. It does not work for "G2" points.
export function projectivePointG1ToBytes(point: any): Uint8Array {
    const bytesCompressed = nobleUtils.numberToBytesBE(point.px, Fp.BYTES);

    //  We set the "compressed" flag for negative "y" values.
    if (isNegativeLE(point.py, Fp.ORDER)) {
        bytesCompressed[0] |= CompressedFlagMask;
    }

    bytesCompressed.reverse();
    return bytesCompressed;
}

// Verifies a message signature.
export function verifySignature(signature: Uint8Array, message: Uint8Array, publicKey: Uint8Array) {
    // Both the signature and the messages are mapped to points on G1.
    const signaturePoint = bytesToG1ProjectivePoint(signature);
    const messagePoint = hashAndMapToG1LikeHerumi(message).point;
    // ... while the public key is on G2.
    const publicKeyPoint = bytesToG2ProjectivePoint(publicKey);

    return doVerifySignature(signaturePoint, messagePoint, publicKeyPoint);
}

export function bytesToG1ProjectivePoint(bytes: Uint8Array): any {
    const bytesReversed = Buffer.from(bytes).reverse();

    // Retain the "compressed" flag, as is.
    const isCompressed = !!(bytesReversed[0] & CompressedFlagMask);

    // Overwrite the "compressed" flag, so that we don't mislead Noble Crypto, since Herumi-like encoding is always compressed (even if the flag isn't set):
    // https://github.com/paulmillr/noble-curves/blob/1.6.0/src/bls12-381.ts#L500
    bytesReversed[0] |= CompressedFlagMask;

    const point = G1.ProjectivePoint.fromHex(bytesReversed);
    const isYOdd = Fp.isOdd!(point.py);
    const yNegated = Fp.neg(point.py);

    // Herumi does not handle the "sort" flag; we need to correct the y-coordinate if necessary.
    const shouldApplyCorrection = (!isCompressed && isYOdd) || (isCompressed && !isYOdd);
    if (shouldApplyCorrection) {
        // We'll return "-y" instead of "y". That is, undo the operation performed by Noble Crypto here:
        // https://github.com/paulmillr/noble-curves/blob/1.6.0/src/bls12-381.ts#L513
        return new G1.ProjectivePoint(point.px, yNegated, point.pz);
    }

    return point;
}

// This function is extremely fragile. It relies on internals of Noble Curves,
// while trying to **implement issues** (e.g. bugs or non-standard features) of the Herumi library,
// issues which we depend on (through "mx-chain-crypto-go").
export function bytesToG2ProjectivePoint(bytes: Uint8Array): any {
    const bytesReversed = Buffer.from(bytes).reverse();

    // Retain the "compressed" flag, as is.
    const isCompressed = !!(bytesReversed[0] & CompressedFlagMask);

    // Overwrite the "compressed" flag, so that we don't mislead Noble Crypto, since Herumi-like encoding is always compressed (even if the flag isn't set):
    // https://github.com/paulmillr/noble-curves/blob/1.6.0/src/bls12-381.ts#L651
    bytesReversed[0] |= CompressedFlagMask;

    const point = G2.ProjectivePoint.fromHex(bytesReversed);
    const yNegated = Fp2.neg(point.y);
    const isYodd = Fp2.isOdd!(point.y);

    // Herumi does not handle the "sort" flag; we need to correct the y-coordinate if necessary.
    const shouldApplyCorrection = (!isCompressed && isYodd) || (isCompressed && !isYodd);
    if (shouldApplyCorrection) {
        // We'll return "-y" instead of "y". That is, undo the operation performed by Noble Crypto here:
        // https://github.com/paulmillr/noble-curves/blob/1.6.0/src/bls12-381.ts#L667
        return new G2.ProjectivePoint(point.px, yNegated, point.pz);
    }

    return point;
}

// We cannot directly use Noble Crypto's verifyShortSignature(), since that performs its own (standard) hashing and mapping to G1,
// which differs from the one in Herumi's library.
// See: https://github.com/paulmillr/noble-curves/blob/1.6.0/src/abstract/bls.ts#L420
function doVerifySignature(signaturePoint: any, messagePoint: any, publicKeyPoint: any): boolean {
    const P = publicKeyPoint;
    const Hm = messagePoint;
    const G = G2.ProjectivePoint.BASE;
    const S = signaturePoint;

    const exp = nobleBls.pairingBatch([
        { g1: Hm, g2: P }, // eHmP = pairing(Hm, P, false);
        { g1: S, g2: G.negate() }, // eSG = pairing(S, G.negate(), false);
    ]);

    return Fp12.eql(exp, Fp12.ONE);
}

// Generates a public key, given a secret key.
export function getPublicKeyBytesForShortSignaturesLikeHerumi(secretKeyBytes: Uint8Array): {
    point: any;
    bytes: Uint8Array;
} {
    const secretKeyReversed = Buffer.from(secretKeyBytes).reverse();
    const publicKeyPoint = G2.ProjectivePoint.fromPrivateKey(secretKeyReversed);
    const publicKeyRawBytes = publicKeyPoint.toRawBytes(false);
    const publicKeyRawBytesReversed = Buffer.from(publicKeyRawBytes).reverse();
    const publicKeyBytes = publicKeyRawBytesReversed.subarray(96);

    const isYOdd = Fp2.isOdd!(publicKeyPoint.py);
    if (isYOdd) {
        // Set "compressed" flag.
        publicKeyBytes[publicKeyBytes.length - 1] |= CompressedFlagMask;
    }

    return { point: publicKeyPoint, bytes: publicKeyBytes };
}
