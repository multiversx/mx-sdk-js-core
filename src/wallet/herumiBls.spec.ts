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
                if (index % 20 != 0) {
                    continue;
                }

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
                if (index % 20 != 0) {
                    continue;
                }

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
});
