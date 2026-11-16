import { bls12_381 } from "@noble/curves/bls12-381.js";
import { assert } from "chai";
import { IBlsExtendedVector, IBlsVector, loadBlsExtendedVectors, loadBlsVectors } from "../testutils/blsVectors";
import * as herumiBls from "./herumiBls";

// Tests of the internals of the BLS implementation. The behaviour seen through the public API is covered by
// "validatorKeysVectors.spec.ts", "validatorKeysReference.spec.ts" and "validatorKeys.spec.ts".
describe("test the BLS implementation (Herumi-compatible, on top of noble curves)", function () {
    this.timeout(300000);

    const Fp = bls12_381.fields.Fp;
    const Fp2 = bls12_381.fields.Fp2;
    const { G2_GENERATOR, G1_COFACTOR, MAP_C1, MAP_C2 } = herumiBls.internals;

    let vectors: IBlsVector[];
    let extendedVectors: IBlsExtendedVector[];

    before(() => {
        vectors = loadBlsVectors();
        extendedVectors = loadBlsExtendedVectors();
    });

    function fromHex(value: string): Buffer {
        return Buffer.from(value, "hex");
    }

    function toHex(bytes: Uint8Array): string {
        return Buffer.from(bytes).toString("hex");
    }

    function scalarOf(secretKeyHex: string): bigint {
        return herumiBls.secretKeyToScalar(fromHex(secretKeyHex));
    }

    describe("constants", () => {
        it("should have the lengths of the keys and of the signatures", () => {
            assert.equal(herumiBls.SECRET_KEY_LENGTH, 32);
            assert.equal(herumiBls.PUBLIC_KEY_LENGTH, 96);
            assert.equal(herumiBls.SIGNATURE_LENGTH, 48);
        });

        it("should have the order of the group", () => {
            assert.equal(
                herumiBls.GROUP_ORDER,
                BigInt("0x73eda753299d7d483339d80809a1d80553bda402fffe5bfeffffffff00000001"),
            );
        });

        it("should have the constants of the map to G1: c1 = sqrt(-3), c2 = (c1 - 1) / 2", () => {
            assert.equal(Fp.sqr(MAP_C1), Fp.neg(3n));
            assert.equal(Fp.mul(MAP_C2, 2n), Fp.sub(MAP_C1, 1n));
        });

        it("should have the cofactor of G1", () => {
            // (z - 1)^2 / 3, where "z" is the (negative) parameter of the curve.
            const z = -BigInt("0xd201000000010000");
            assert.equal(G1_COFACTOR, (z - 1n) ** 2n / 3n);
            assert.equal(G1_COFACTOR, bls12_381.G1.Point.CURVE().h);
        });

        it("should have a generator of G2 that is a point of the group, other than the standard generator", () => {
            assert.doesNotThrow(() => G2_GENERATOR.assertValidity());
            assert.isTrue(G2_GENERATOR.isTorsionFree());
            assert.isFalse(G2_GENERATOR.is0());
            assert.isFalse(G2_GENERATOR.equals(bls12_381.G2.Point.BASE));

            // The generator is the public key of the secret key 1.
            assert.equal(
                toHex(herumiBls.serializeG2Point(G2_GENERATOR)),
                "cc1ef2d9d8c53b60568548e55c1a3ae34e07ce638182fcbd6476c381db2806dfbb612c123cab0a1400cf1af81a013d0fb3a4f19603d35ca16f6709162ca8fc9e5ffbbdbfa6dc2ad8f655660e3f4c928ce26401a98e65c2168a900f08a5f71d97",
            );
        });

        it("should leave the standard generators of the library underneath untouched", () => {
            // The library underneath might be used, in the same application, for the standard flavour of BLS (e.g. Ethereum).
            herumiBls.computePublicKey(5n);
            herumiBls.sign(5n, Buffer.from("hello"));

            const g1 = bls12_381.G1.Point.BASE.toAffine();
            const g2 = bls12_381.G2.Point.BASE.toAffine();

            assert.equal(
                g1.x,
                BigInt(
                    "0x17f1d3a73197d7942695638c4fa9ac0fc3688c4f9774b905a14e3a3f171bac586c55e83ff97a1aeffb3af00adb22c6bb",
                ),
            );
            assert.equal(
                g2.x.c0,
                BigInt(
                    "0x024aa2b2f08f0a91260805272dc51051c6e47ad4fa403b02b4510b647ae3d1770bac0326a805bbefd48056c8c121bdb8",
                ),
            );
            assert.equal(
                g2.x.c1,
                BigInt(
                    "0x13e02b6052719f607dacd3a088274f65596bd0d09920b61ab5da61bbdc7f5049334cf11213945d57e5ac7d055d042b7e",
                ),
            );

            // A test vector of the standard flavour (Ethereum): secret key 1.
            const standardPublicKey = bls12_381.longSignatures.getPublicKey(1n).toBytes(true);
            assert.equal(
                toHex(standardPublicKey),
                "97f1d3a73197d7942695638c4fa9ac0fc3688c4f9774b905a14e3a3f171bac586c55e83ff97a1aeffb3af00adb22c6bb",
            );
        });
    });

    describe("secret keys", () => {
        it("should read a secret key as a little-endian number", () => {
            assert.equal(herumiBls.secretKeyToScalar(fromHex("01" + "00".repeat(31))), 1n);
            assert.equal(herumiBls.secretKeyToScalar(fromHex("00".repeat(31) + "01")), 1n << 248n);
            assert.equal(
                herumiBls.secretKeyToScalar(
                    fromHex("7cff99bd671502db7d15bc8abc0c9a804fb925406fbdd50f1e4c17a4cd774247"),
                ),
                BigInt("0x474277cda4174c1e0fd5bd6f4025b94f809a0cbc8abc157ddb021567bd99ff7c"),
            );

            for (const length of [0, 31, 33, 64]) {
                assert.throws(() => herumiBls.secretKeyToScalar(new Uint8Array(length)), "must have 32 bytes");
            }
        });

        it("should tell whether a scalar is a valid secret key", () => {
            const order = herumiBls.GROUP_ORDER;

            for (const scalar of [1n, 2n, order - 1n, 1n << 254n]) {
                assert.isTrue(herumiBls.isValidSecretScalar(scalar));
            }

            for (const scalar of [0n, -1n, order, order + 1n, 1n << 255n, (1n << 256n) - 1n]) {
                assert.isFalse(herumiBls.isValidSecretScalar(scalar));
            }
        });

        it("should not compute with a scalar that is out of range (instead of reducing it)", () => {
            const order = herumiBls.GROUP_ORDER;

            for (const scalar of [0n, -1n, order, order + 5n]) {
                assert.throws(() => herumiBls.computePublicKey(scalar), "out of range");
                assert.throws(() => herumiBls.computePublicKeyPoint(scalar), "out of range");
                assert.throws(() => herumiBls.sign(scalar, Buffer.from("hello")), "out of range");
                assert.throws(() => herumiBls.signToPoint(scalar, Buffer.from("hello")), "out of range");
            }
        });
    });

    describe("hashing and mapping to G1", () => {
        it("should hash to the field: SHA-512, read as little-endian, masked to 381 bits (then to 380 bits, if needed)", () => {
            // MCL's intermediate values, from https://github.com/multiversx/mx-deprecated-sdk-js-wallet/pull/51.
            const cases: [string, string][] = [
                [
                    "aaaaaaaa",
                    "f74f2603939a53656948480ce71f1ce466685b6654fd22c61c1f2ce4e2c96d1cd02d162b560c4beaf1ae45f3471dc50b",
                ],
                [
                    "hello",
                    "9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca72323c3d99ba5c11d7c7acc6e14b8c50a",
                ],
            ];

            for (const [message, expectedLittleEndianHex] of cases) {
                const expected = herumiBls.littleEndianToBigInt(fromHex(expectedLittleEndianHex));
                assert.equal(herumiBls.hashToFp(Buffer.from(message)), expected, message);
            }
        });

        it("should hash to a number lower than the field modulus, for all the vectors (both ways of masking)", () => {
            const seen = new Set<boolean>();

            for (const vector of extendedVectors) {
                const value = herumiBls.hashToFp(fromHex(vector.messageHex));

                assert.isTrue(value > 0n && value < Fp.ORDER, vector.note);

                // Cut to 380 bits, when the vector says so.
                assert.equal(value < 1n << 380n || !vector.hashToCurve.maskedTwice, true, vector.note);
                seen.add(vector.hashToCurve.maskedTwice);
            }

            assert.equal(seen.size, 2);
        });

        it("should map to G1 (messages from the reference implementation of the map)", () => {
            // From https://github.com/multiversx/mx-deprecated-sdk-js-wallet/pull/51 (generated with MCL).
            const cases: [string, string][] = [
                [
                    "aaaaaaaa",
                    "05339eae300f121b5f6ddd41d54e2cefaf6a07472f4a87d2f7195f97d67559910ac1ada88f616a49189670db71769f89",
                ],
                [
                    "hello",
                    "a1ddb026e51f6e477354f63b8b3cb59af7bf6da8e8a61685ab8c83c3c572ef801824318a45d97fc961fc6229ba18428e",
                ],
                [
                    "world",
                    "c68a746ae5f5675f2f146baaf1126d5355d00006fcaf24bc47ba328cb0e73e4ed4ebc53283c8a0ae5d01023ee1fe8587",
                ],
                [
                    "this is a message",
                    "d99081a371bef2d6d747b1fea440e377365293a3d2a8cd0529ddab837360184fcc04453e5cea19fdd8d320ee81b44d97",
                ],
                [
                    "MultiversX",
                    "39f547f252c481ff9f1b465bdb335d03c4e430c8f3da4941a90beb30538b0faf1d240aa5e7fa30c44b738326a2035b18",
                ],
                [
                    "SDK-JS",
                    "43df809a75f7153cebcc6346701c9c28319456ec9e9dbd39a46e797b07ca6e9145ff15c5c1483868dd57ccc0a8ff2b99",
                ],
                [
                    "lorem ipsum",
                    "3f456ad872e39d35b857031bb5328f9b1515e5d00d94db210b510e0f83064961c30dbe8fcf7304a298622d857952c682",
                ],
            ];

            for (const [message, expected] of cases) {
                const point = herumiBls.hashAndMapToG1(Buffer.from(message));
                assert.equal(toHex(herumiBls.serializeG1Point(point)), expected, message);
            }
        });

        it("should map to points of the group G1 (all the paths), with the expected coordinates", () => {
            for (const vector of extendedVectors) {
                const point = herumiBls.hashAndMapToG1(fromHex(vector.messageHex));

                assert.equal(toHex(herumiBls.serializeG1Point(point)), vector.messageMapped, vector.note);
                assert.isTrue(point.isTorsionFree(), vector.note);
                assert.isFalse(point.is0(), vector.note);
            }

            // The Go vectors hold the coordinates, as well.
            const pointByMessage = new Map(vectors.map((vector) => [vector.message, vector.messageMappedAsPoint]));
            assert.equal(pointByMessage.size, 5);

            for (const [message, expected] of pointByMessage) {
                const { x, y } = herumiBls.hashAndMapToG1(Buffer.from(message)).toAffine();

                assert.equal(expected.pz, "1");
                assert.equal(x, BigInt(expected.px), message);
                assert.equal(y, BigInt(expected.py), message);
            }
        });

        it("should not map zero, or something that is not an element of the field", () => {
            for (const input of [0n, -1n, Fp.ORDER, Fp.ORDER + 1n]) {
                assert.throws(() => herumiBls.mapToG1(input), "cannot map to G1");
            }
        });
    });

    describe("points (coordinates from the vectors generated with the Go implementation)", () => {
        it("should compute the public keys", () => {
            for (const [index, vector] of vectors.entries()) {
                const point = herumiBls.computePublicKeyPoint(scalarOf(vector.secretKey));
                const { x, y } = point.toAffine();
                const expected = vector.publicKeyAsPoint;

                assert.deepEqual(expected.pz, { c0: "1", c1: "0" });
                assert.equal(x.c0, BigInt(expected.px.c0), `vector ${index}`);
                assert.equal(x.c1, BigInt(expected.px.c1), `vector ${index}`);
                assert.equal(y.c0, BigInt(expected.py.c0), `vector ${index}`);
                assert.equal(y.c1, BigInt(expected.py.c1), `vector ${index}`);

                assert.isTrue(point.isTorsionFree(), `vector ${index}`);
                assert.equal(toHex(herumiBls.serializeG2Point(point)), vector.publicKey, `vector ${index}`);
            }
        });

        it("should compute the signatures", () => {
            for (const [index, vector] of vectors.entries()) {
                const point = herumiBls.signToPoint(scalarOf(vector.secretKey), Buffer.from(vector.message));
                const { x, y } = point.toAffine();
                const expected = vector.signatureAsPoint;

                assert.equal(expected.pz, "1");
                assert.equal(x, BigInt(expected.px), `vector ${index}`);
                assert.equal(y, BigInt(expected.py), `vector ${index}`);

                assert.isTrue(point.isTorsionFree(), `vector ${index}`);
                assert.equal(toHex(herumiBls.serializeG1Point(point)), vector.signature, `vector ${index}`);
            }
        });

        it("should serialize the coordinates held by the vectors to the bytes held by the vectors", () => {
            for (const vector of vectors) {
                const publicKey = vector.publicKeyAsPoint;
                const signature = vector.signatureAsPoint;
                const messageMapped = vector.messageMappedAsPoint;

                assert.equal(
                    toHex(
                        herumiBls.serializeG2Coordinates(
                            { c0: BigInt(publicKey.px.c0), c1: BigInt(publicKey.px.c1) },
                            { c0: BigInt(publicKey.py.c0), c1: BigInt(publicKey.py.c1) },
                        ),
                    ),
                    vector.publicKey,
                );
                assert.equal(
                    toHex(herumiBls.serializeG1Coordinates(BigInt(signature.px), BigInt(signature.py))),
                    vector.signature,
                );
                assert.equal(
                    toHex(herumiBls.serializeG1Coordinates(BigInt(messageMapped.px), BigInt(messageMapped.py))),
                    vector.messageMapped,
                );
            }
        });
    });

    describe("serialization", () => {
        it("should serialize the point at infinity as zeros", () => {
            assert.equal(toHex(herumiBls.serializeG1Point(bls12_381.G1.Point.ZERO)), "00".repeat(48));
            assert.equal(toHex(herumiBls.serializeG2Point(bls12_381.G2.Point.ZERO)), "00".repeat(96));
        });

        it("should serialize 'x' as little-endian, and flag the last byte when 'y' is odd", () => {
            assert.equal(toHex(herumiBls.serializeG1Coordinates(1n, 2n)), "01" + "00".repeat(47));
            assert.equal(toHex(herumiBls.serializeG1Coordinates(1n, 3n)), "01" + "00".repeat(46) + "80");
            assert.equal(toHex(herumiBls.serializeG1Coordinates(0x0102n, 3n)), "0201" + "00".repeat(45) + "80");

            assert.equal(
                toHex(herumiBls.serializeG2Coordinates({ c0: 1n, c1: 2n }, { c0: 4n, c1: 0n })),
                "01" + "00".repeat(47) + "02" + "00".repeat(47),
            );
            assert.equal(
                toHex(herumiBls.serializeG2Coordinates({ c0: 1n, c1: 2n }, { c0: 5n, c1: 0n })),
                "01" + "00".repeat(47) + "02" + "00".repeat(46) + "80",
            );
        });

        it("should tell the parity of 'y' (G2) by its first coefficient only, as Herumi does", () => {
            // A point of the curve of G2 whose "y" has the first coefficient zero (see "validatorKeysReference.spec.ts",
            // where the same point is given to Herumi's implementation). Here, noble's rule would look at the second coefficient.
            const x = {
                c0: BigInt(
                    "0x0e31aad2f4b199f7f87e6433692648312e55a89b142b798084e1ac133c07736855bf683690d5fa5f87e90a1b49384db0",
                ),
                c1: 2n,
            };
            const b = BigInt(
                "0x029577e02fcae4ce913eafdee0672a9abdaea2cef873d93529739515f6c62301f873fbdb9825b1e9bd82e90bf609c667",
            );
            const expected =
                "b04d38491b0ae9875ffad5903668bf556873073c13ace18480792b149ba8552e3148266933647ef8f799b1f4d2aa310e" +
                "020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

            for (const c1 of [b, Fp.neg(b)]) {
                const y = { c0: 0n, c1 };

                // It is a point of the curve: y^2 = x^3 + 4 * (1 + i).
                assert.isTrue(Fp2.eql(Fp2.sqr(y), Fp2.add(Fp2.mul(Fp2.sqr(x), x), Fp2.create({ c0: 4n, c1: 4n }))));

                assert.equal(toHex(herumiBls.serializeG2Coordinates(x, y)), expected);
            }

            // One of the two roots is odd, by the rule of the library underneath (which is why that rule is not used).
            assert.equal(Number(Fp2.isOdd!({ c0: 0n, c1: b })) + Number(Fp2.isOdd!({ c0: 0n, c1: Fp.neg(b) })), 1);
        });
    });

    describe("deserialization", () => {
        const G1 = bls12_381.G1.Point;
        const G2 = bls12_381.G2.Point;

        it("should deserialize what was serialized (signatures and public keys of the vectors)", () => {
            for (const vector of [...vectors, ...extendedVectors]) {
                const scalar = scalarOf(vector.secretKey);
                const message = "messageHex" in vector ? fromHex(vector.messageHex) : Buffer.from(vector.message);

                const signaturePoint = herumiBls.deserializeG1Point(fromHex(vector.signature))!;
                const publicKeyPoint = herumiBls.deserializeG2Point(fromHex(vector.publicKey))!;

                assert.isTrue(signaturePoint.equals(herumiBls.signToPoint(scalar, message)), vector.secretKey);
                assert.isTrue(publicKeyPoint.equals(herumiBls.computePublicKeyPoint(scalar)), vector.secretKey);

                assert.equal(toHex(herumiBls.serializeG1Point(signaturePoint)), vector.signature);
                assert.equal(toHex(herumiBls.serializeG2Point(publicKeyPoint)), vector.publicKey);
            }
        });

        it("should deserialize zeros as the point at infinity", () => {
            assert.isTrue(herumiBls.deserializeG1Point(new Uint8Array(48))!.is0());
            assert.isTrue(herumiBls.deserializeG2Point(new Uint8Array(96))!.is0());
        });

        it("should pick 'y' by the flag held by the last byte", () => {
            const signature = fromHex(extendedVectors[0].signature);
            const publicKey = fromHex(extendedVectors[0].publicKey);

            const signaturePoint = herumiBls.deserializeG1Point(signature)!;
            const publicKeyPoint = herumiBls.deserializeG2Point(publicKey)!;

            signature[47] ^= 0x80;
            publicKey[95] ^= 0x80;

            assert.isTrue(herumiBls.deserializeG1Point(signature)!.equals(signaturePoint.negate()));
            assert.isTrue(herumiBls.deserializeG2Point(publicKey)!.equals(publicKeyPoint.negate()));
        });

        it("should not deserialize bytes of a wrong length", () => {
            for (const length of [0, 1, 47, 49, 95, 96, 97]) {
                assert.isUndefined(herumiBls.deserializeG1Point(new Uint8Array(length)), `G1, length: ${length}`);
            }

            for (const length of [0, 1, 47, 48, 49, 95, 97, 192]) {
                assert.isUndefined(herumiBls.deserializeG2Point(new Uint8Array(length)), `G2, length: ${length}`);
            }
        });

        it("should not deserialize a coordinate that is not lower than the field modulus", () => {
            const modulus = fromHex(Fp.ORDER.toString(16).padStart(96, "0")).reverse();
            const belowModulus = fromHex((Fp.ORDER - 1n).toString(16).padStart(96, "0")).reverse();

            // G1: "x" is the modulus itself, with and without the flag; then, all the bits set.
            assert.isUndefined(herumiBls.deserializeG1Point(modulus));
            assert.isUndefined(
                herumiBls.deserializeG1Point(
                    Buffer.concat([modulus.subarray(0, 47), Buffer.from([modulus[47] | 0x80])]),
                ),
            );
            assert.isUndefined(herumiBls.deserializeG1Point(Buffer.alloc(48, 0xff)));

            // The largest "x" is accepted, if it belongs to a point of the curve: x = -1, y^2 = 3.
            const largest = herumiBls.deserializeG1Point(belowModulus);
            assert.equal(largest === undefined, Fp.pow(3n, (Fp.ORDER - 1n) / 2n) != 1n);

            // G2: either coefficient of "x".
            const one = Buffer.concat([Buffer.from([1]), Buffer.alloc(47)]);
            assert.isUndefined(herumiBls.deserializeG2Point(Buffer.concat([modulus, one])));
            assert.isUndefined(herumiBls.deserializeG2Point(Buffer.concat([one, modulus])));
            assert.isUndefined(herumiBls.deserializeG2Point(Buffer.alloc(96, 0xff)));
        });

        it("should not deserialize an 'x' that does not belong to a point of the curve", () => {
            let onCurve = 0;
            let notOnCurve = 0;

            for (let x = 1; x <= 40; x++) {
                const bytes = new Uint8Array(48);
                bytes[0] = x;

                // y^2 = x^3 + 4 has a solution only if the right side is a square.
                const isSquare = Fp.pow(Fp.create(BigInt(x * x * x + 4)), (Fp.ORDER - 1n) / 2n) == 1n;
                const point = herumiBls.deserializeG1Point(bytes);

                assert.equal(point !== undefined, isSquare, `x = ${x}`);

                if (point) {
                    const { x: px, y: py } = point.toAffine();
                    assert.equal(px, BigInt(x));
                    assert.equal(Fp.sqr(py), Fp.create(BigInt(x * x * x + 4)));
                    assert.equal(toHex(herumiBls.serializeG1Point(point)), toHex(bytes));
                    onCurve++;
                } else {
                    notOnCurve++;
                }
            }

            assert.isAbove(onCurve, 5);
            assert.isAbove(notOnCurve, 5);

            let onCurveG2 = 0;
            let notOnCurveG2 = 0;

            for (let c0 = 1; c0 <= 40; c0++) {
                const bytes = new Uint8Array(96);
                bytes[0] = c0;
                bytes[48] = 1;

                const point = herumiBls.deserializeG2Point(bytes);

                if (point) {
                    const { x, y } = point.toAffine();
                    assert.deepEqual(x, { c0: BigInt(c0), c1: 1n });
                    assert.isTrue(Fp2.eql(Fp2.sqr(y), Fp2.add(Fp2.mul(Fp2.sqr(x), x), Fp2.create({ c0: 4n, c1: 4n }))));
                    assert.equal(toHex(herumiBls.serializeG2Point(point)), toHex(bytes));
                    onCurveG2++;
                } else {
                    notOnCurveG2++;
                }
            }

            assert.isAbove(onCurveG2, 5);
            assert.isAbove(notOnCurveG2, 5);
        });

        it("should deserialize points of the curve that are outside of the groups (which is checked when verifying)", () => {
            const pointOfOrderThree = G1.fromAffine({ x: 0n, y: Fp.neg(2n) });
            const bytes = herumiBls.serializeG1Point(pointOfOrderThree);
            const point = herumiBls.deserializeG1Point(bytes)!;

            assert.equal(toHex(bytes), "00".repeat(47) + "80");
            assert.isTrue(point.equals(pointOfOrderThree));
            assert.isTrue(point.multiplyUnsafe(3n).is0());
            assert.isFalse(point.isTorsionFree());
        });

        it("should deserialize a point of G2 whose 'y' has the first coefficient zero (with or without the flag)", () => {
            // See "should tell the parity of 'y' (G2) by its first coefficient only, as Herumi does".
            const encoded =
                "b04d38491b0ae9875ffad5903668bf556873073c13ace18480792b149ba8552e3148266933647ef8f799b1f4d2aa310e" +
                "020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
            const withFlag = fromHex(encoded);
            withFlag[95] |= 0x80;

            for (const bytes of [fromHex(encoded), withFlag]) {
                const point = herumiBls.deserializeG2Point(bytes)!;

                assert.equal(point.toAffine().y.c0, 0n);
                assert.equal(toHex(herumiBls.serializeG2Point(point)), encoded);
            }

            assert.isFalse(herumiBls.deserializeG2Point(fromHex(encoded))!.isTorsionFree());
            assert.isFalse(G2.ZERO.equals(herumiBls.deserializeG2Point(fromHex(encoded))!));
        });
    });

    describe("verifying", () => {
        const secretScalar = 0x1234567890abcdefn;
        const message = Buffer.from("hello");
        let publicKey: Uint8Array;
        let signature: Uint8Array;

        before(() => {
            publicKey = herumiBls.computePublicKey(secretScalar);
            signature = herumiBls.sign(secretScalar, message);
        });

        it("should verify: e(signature, generator) = e(message mapped to G1, public key)", () => {
            assert.isTrue(herumiBls.verify(publicKey, message, signature));
            assert.isFalse(herumiBls.verify(publicKey, Buffer.from("hello!"), signature));
            assert.isFalse(herumiBls.verify(herumiBls.computePublicKey(secretScalar + 1n), message, signature));
            assert.isFalse(herumiBls.verify(publicKey, message, herumiBls.sign(secretScalar + 1n, message)));

            // The same check, by the two pairings computed apart.
            const left = bls12_381.pairing(herumiBls.signToPoint(secretScalar, message), G2_GENERATOR);
            const right = bls12_381.pairing(
                herumiBls.hashAndMapToG1(message),
                herumiBls.computePublicKeyPoint(secretScalar),
            );
            assert.isTrue(bls12_381.fields.Fp12.eql(left, right));
        });

        it("should not verify against the standard generator of G2 (the one of Herumi's default mode is not the standard one)", () => {
            const standardPublicKey = herumiBls.serializeG2Point(bls12_381.G2.Point.BASE.multiply(secretScalar));

            assert.isFalse(herumiBls.verify(standardPublicKey, message, signature));
        });

        it("should verify for the smallest and the largest secret keys", () => {
            for (const scalar of [1n, 2n, herumiBls.GROUP_ORDER - 2n, herumiBls.GROUP_ORDER - 1n]) {
                const key = herumiBls.computePublicKey(scalar);

                assert.isTrue(herumiBls.verify(key, message, herumiBls.sign(scalar, message)), scalar.toString(16));
                assert.isFalse(herumiBls.verify(key, message, signature), scalar.toString(16));
            }
        });

        it("should not verify the opposite signature, nor under the opposite public key", () => {
            const oppositeSignature = Uint8Array.from(signature);
            oppositeSignature[47] ^= 0x80;
            const oppositePublicKey = Uint8Array.from(publicKey);
            oppositePublicKey[95] ^= 0x80;

            assert.isFalse(herumiBls.verify(publicKey, message, oppositeSignature));
            assert.isFalse(herumiBls.verify(oppositePublicKey, message, signature));

            // Both of them negated: this is the public key, and the signature, of the opposite secret key (order - secret key).
            assert.isTrue(herumiBls.verify(oppositePublicKey, message, oppositeSignature));
            assert.equal(
                toHex(oppositePublicKey),
                toHex(herumiBls.computePublicKey(herumiBls.GROUP_ORDER - secretScalar)),
            );
            assert.equal(
                toHex(oppositeSignature),
                toHex(herumiBls.sign(herumiBls.GROUP_ORDER - secretScalar, message)),
            );
        });

        it("should not verify when the lengths are wrong", () => {
            assert.isFalse(herumiBls.verify(publicKey, message, signature.subarray(0, 47)));
            assert.isFalse(herumiBls.verify(publicKey, message, Buffer.concat([signature, Buffer.from([0])])));
            assert.isFalse(herumiBls.verify(publicKey.subarray(0, 95), message, signature));
            assert.isFalse(herumiBls.verify(Buffer.concat([publicKey, Buffer.from([0])]), message, signature));
            assert.isFalse(herumiBls.verify(signature, message, publicKey));
        });

        it("should not verify with the point at infinity, as public key or as signature", () => {
            const zeroPublicKey = new Uint8Array(96);
            const zeroSignature = new Uint8Array(48);

            assert.isFalse(herumiBls.verify(zeroPublicKey, message, zeroSignature));
            assert.isFalse(herumiBls.verify(zeroPublicKey, message, signature));
            assert.isFalse(herumiBls.verify(publicKey, message, zeroSignature));
        });

        it("should not verify a signature that is not a point of G1 (the signature, plus a point of order 3)", () => {
            const pointOfOrderThree = bls12_381.G1.Point.fromAffine({ x: 0n, y: 2n });
            const forgedPoint = herumiBls.deserializeG1Point(signature)!.add(pointOfOrderThree);
            const forged = herumiBls.serializeG1Point(forgedPoint);

            assert.isFalse(forgedPoint.isTorsionFree());
            assert.isTrue(herumiBls.deserializeG1Point(forged)!.equals(forgedPoint));
            assert.isFalse(herumiBls.verify(publicKey, message, forged));
        });

        it("should not verify under a public key that is not a point of G2", () => {
            // A point of the curve of G2, multiplied by the order of the group: what is left is outside of the group.
            const bytes = new Uint8Array(96);
            bytes[0] = 2;
            const pointOfTheCurve = herumiBls.deserializeG2Point(bytes)!;
            const outsideOfTheGroup = pointOfTheCurve.multiplyUnsafe(herumiBls.GROUP_ORDER - 1n).add(pointOfTheCurve);

            assert.isFalse(outsideOfTheGroup.is0());
            assert.isFalse(outsideOfTheGroup.isTorsionFree());

            const forgedPoint = herumiBls.deserializeG2Point(publicKey)!.add(outsideOfTheGroup);
            const forged = herumiBls.serializeG2Point(forgedPoint);

            assert.isTrue(herumiBls.deserializeG2Point(forged)!.equals(forgedPoint));
            assert.isFalse(herumiBls.verify(forged, message, signature));
            assert.isFalse(herumiBls.verify(bytes, message, signature));
        });
    });
});
