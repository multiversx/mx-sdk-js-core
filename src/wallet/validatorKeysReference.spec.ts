import { bls12_381 } from "@noble/curves/bls12-381.js";
import { assert } from "chai";
import { randomBytes, randomInt } from "crypto";
import * as fs from "fs";
import path from "path";
import { getTestWalletsPath } from "../testutils";
import { ReferenceBls } from "../testutils/blsReference";
import { IBlsExtendedVector, IBlsVector, loadBlsExtendedVectors, loadBlsVectors } from "../testutils/blsVectors";
import * as herumiBls from "./herumiBls";
import { ValidatorPublicKey, ValidatorSecretKey } from "./validatorKeys";
import { ValidatorPEM } from "./validatorPem";

// The SDK, compared against the reference implementation (Herumi, as WebAssembly), which the SDK used before switching
// to "@noble/curves". The reference is loaded by the tests only (see "testutils/blsReference.ts").
describe("test validator keys against the reference BLS implementation", function () {
    this.timeout(300000);

    // The order of the group (BLS12-381).
    const order = BigInt("0x73eda753299d7d483339d80809a1d80553bda402fffe5bfeffffffff00000001");

    let reference: ReferenceBls;
    let vectors: IBlsVector[];
    let extendedVectors: IBlsExtendedVector[];

    before(async () => {
        reference = await ReferenceBls.load();
        vectors = loadBlsVectors();
        extendedVectors = loadBlsExtendedVectors();
    });

    function fromHex(value: string): Buffer {
        return Buffer.from(value, "hex");
    }

    function createRandomSecretKey(): Buffer {
        for (;;) {
            const bytes = randomBytes(32);
            const value = BigInt("0x" + Buffer.from(bytes).reverse().toString("hex"));

            if (value > 0n && value < order) {
                return bytes;
            }
        }
    }

    function flipBit(bytes: Uint8Array, byteIndex: number, bit: number): Buffer {
        const copy = Buffer.from(bytes);
        copy[byteIndex] ^= 1 << bit;
        return copy;
    }

    /**
     * Never throws: a public key or a signature that cannot be decoded does not verify.
     */
    function referenceVerifies(publicKey: Uint8Array, message: Uint8Array, signature: Uint8Array): boolean {
        try {
            return reference.verify(publicKey, message, signature);
        } catch {
            return false;
        }
    }

    describe("the reference itself", () => {
        it("should agree with the test vectors", () => {
            for (const [index, vector] of vectors.entries()) {
                const secretKey = fromHex(vector.secretKey);
                const message = Buffer.from(vector.message);

                assert.equal(reference.getPublicKey(secretKey).toString("hex"), vector.publicKey, `vector ${index}`);
                assert.equal(reference.sign(secretKey, message).toString("hex"), vector.signature, `vector ${index}`);
                assert.isTrue(
                    reference.verify(fromHex(vector.publicKey), message, fromHex(vector.signature)),
                    `vector ${index}`,
                );
            }

            for (const vector of extendedVectors) {
                const secretKey = fromHex(vector.secretKey);
                const message = fromHex(vector.messageHex);

                assert.equal(reference.getPublicKey(secretKey).toString("hex"), vector.publicKey, vector.note);
                assert.equal(reference.sign(secretKey, message).toString("hex"), vector.signature, vector.note);
                assert.isTrue(
                    reference.verify(fromHex(vector.publicKey), message, fromHex(vector.signature)),
                    vector.note,
                );
            }
        });

        it("should tell the parity of a public key's 'y' by its first coefficient only", () => {
            // A point of the curve of G2 (not of the group itself, which the reference does not check when decoding),
            // picked so that the first coefficient of "y" is zero: y = (0, b). The two roots are (0, b) and (0, -b); one of
            // "b" and "-b" is odd. No actual public key is like this, so this is the only way to observe the rule: Herumi
            // looks at the first coefficient alone (both roots are "even"), whereas other libraries (e.g. "@noble/curves")
            // fall back to the second coefficient when the first one is zero.
            const x =
                "b04d38491b0ae9875ffad5903668bf556873073c13ace18480792b149ba8552e3148266933647ef8f799b1f4d2aa310e" +
                "020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
            const withFlag = fromHex(x);
            withFlag[95] |= 0x80;

            assert.equal(reference.reencodePublicKey(fromHex(x)).toString("hex"), x);
            assert.equal(reference.reencodePublicKey(withFlag).toString("hex"), x);
        });

        it("should not verify when the message, the public key or the signature is another one", () => {
            const [first, second] = extendedVectors.filter((vector) => vector.group == "message-lengths").slice(40);
            const publicKey = fromHex(first.publicKey);
            const message = fromHex(first.messageHex);
            const signature = fromHex(first.signature);

            assert.isTrue(referenceVerifies(publicKey, message, signature));

            assert.isFalse(referenceVerifies(publicKey, fromHex(second.messageHex), signature));
            assert.isFalse(referenceVerifies(publicKey, Buffer.concat([message, Buffer.from([0])]), signature));
            assert.isFalse(referenceVerifies(publicKey, message.subarray(1), signature));
            assert.isFalse(referenceVerifies(publicKey, flipBit(message, 0, 0), signature));
            assert.isFalse(referenceVerifies(fromHex(second.publicKey), message, signature));
            assert.isFalse(referenceVerifies(publicKey, message, fromHex(second.signature)));

            // The highest bit of the last byte carries the parity of "y": when flipped, the point is the opposite one.
            assert.isFalse(referenceVerifies(publicKey, message, flipBit(signature, 47, 7)));
            assert.isFalse(referenceVerifies(flipBit(publicKey, 95, 7), message, signature));

            for (let byteIndex = 0; byteIndex < 48; byteIndex += 5) {
                assert.isFalse(referenceVerifies(publicKey, message, flipBit(signature, byteIndex, 0)));
            }

            for (let byteIndex = 0; byteIndex < 96; byteIndex += 7) {
                assert.isFalse(referenceVerifies(flipBit(publicKey, byteIndex, 0), message, signature));
            }
        });
    });

    describe("the SDK", () => {
        it("should produce public keys and signatures that the reference decodes, in their canonical form", () => {
            for (const vector of extendedVectors) {
                const secretKey = new ValidatorSecretKey(fromHex(vector.secretKey));
                const publicKey = secretKey.generatePublicKey().valueOf();
                const signature = secretKey.sign(fromHex(vector.messageHex));

                assert.equal(reference.reencodePublicKey(publicKey).toString("hex"), publicKey.toString("hex"));
                assert.equal(reference.reencodeSignature(signature).toString("hex"), signature.toString("hex"));
            }
        });

        it("should produce signatures that the reference verifies (test wallets)", async () => {
            for (const file of ["validatorKey00.pem", "validators.pem", "multipleValidatorKeys.pem"]) {
                const text = fs.readFileSync(path.join(getTestWalletsPath(), file), "utf-8");

                for (const pem of await ValidatorPEM.fromTextAll(text)) {
                    const publicKey = pem.secretKey.generatePublicKey().valueOf();

                    for (const message of ["", "hello", "MultiversX", "x".repeat(500)].map((item) =>
                        Buffer.from(item),
                    )) {
                        const signature = pem.secretKey.sign(message);

                        assert.isTrue(referenceVerifies(publicKey, message, signature), `${file}, ${pem.label}`);
                        assert.isFalse(
                            referenceVerifies(
                                publicKey,
                                Buffer.concat([message, message, Buffer.from("!")]),
                                signature,
                            ),
                        );
                    }
                }
            }
        });

        it("should produce signatures that the reference verifies (edge keys, all the paths of the map to G1)", () => {
            for (const vector of extendedVectors) {
                const secretKey = new ValidatorSecretKey(fromHex(vector.secretKey));
                const publicKey = secretKey.generatePublicKey().valueOf();
                const message = fromHex(vector.messageHex);
                const signature = secretKey.sign(message);

                assert.isTrue(referenceVerifies(publicKey, message, signature), vector.note);
            }
        });

        it("should produce the same public keys and signatures as the reference (random keys and messages)", function () {
            for (let i = 0; i < 300; i++) {
                const secretKeyBytes = createRandomSecretKey();
                const message = randomBytes(randomInt(0, 400));
                // Random inputs: on failure, the message tells how to reproduce.
                const context = `secret key: ${secretKeyBytes.toString("hex")}, message: ${message.toString("hex")}`;

                const secretKey = new ValidatorSecretKey(secretKeyBytes);
                const publicKey = secretKey.generatePublicKey().valueOf();
                const signature = secretKey.sign(message);

                assert.equal(
                    publicKey.toString("hex"),
                    reference.getPublicKey(secretKeyBytes).toString("hex"),
                    context,
                );
                assert.equal(
                    signature.toString("hex"),
                    reference.sign(secretKeyBytes, message).toString("hex"),
                    context,
                );

                assert.isTrue(referenceVerifies(publicKey, message, signature), context);
            }
        });

        it("should verify the same as the reference (random keys and messages; valid and altered signatures)", async function () {
            for (let i = 0; i < 40; i++) {
                const secretKeyBytes = createRandomSecretKey();
                const message = randomBytes(randomInt(0, 400));
                const context = `secret key: ${secretKeyBytes.toString("hex")}, message: ${message.toString("hex")}`;

                const secretKey = new ValidatorSecretKey(secretKeyBytes);
                const publicKey = secretKey.generatePublicKey();
                const signature = secretKey.sign(message);

                const otherSecretKey = new ValidatorSecretKey(createRandomSecretKey());
                const alteredMessage = Buffer.concat([message, Buffer.from([i])]);
                const alteredSignature = flipBit(signature, randomInt(0, 48), randomInt(0, 8));
                const alteredPublicKey = flipBit(publicKey.valueOf(), randomInt(0, 96), randomInt(0, 8));

                const cases: [string, Uint8Array, Uint8Array, Uint8Array, boolean][] = [
                    ["valid", publicKey.valueOf(), message, signature, true],
                    ["other message", publicKey.valueOf(), alteredMessage, signature, false],
                    ["other key", otherSecretKey.generatePublicKey().valueOf(), message, signature, false],
                    ["other signature", publicKey.valueOf(), message, otherSecretKey.sign(message), false],
                    ["altered signature", publicKey.valueOf(), message, alteredSignature, false],
                    ["altered public key", alteredPublicKey, message, signature, false],
                ];

                for (const [name, publicKeyBytes, messageBytes, signatureBytes, expected] of cases) {
                    const details = `${name}; ${context}; signature: ${Buffer.from(signatureBytes).toString("hex")}`;

                    assert.equal(
                        await new ValidatorPublicKey(publicKeyBytes).verify(messageBytes, signatureBytes),
                        expected,
                        details,
                    );
                    assert.equal(referenceVerifies(publicKeyBytes, messageBytes, signatureBytes), expected, details);
                }
            }
        });

        it("should verify the signatures produced by the reference", async () => {
            for (const vector of extendedVectors) {
                const secretKeyBytes = fromHex(vector.secretKey);
                const message = fromHex(vector.messageHex);
                const publicKey = new ValidatorPublicKey(reference.getPublicKey(secretKeyBytes));

                assert.isTrue(await publicKey.verify(message, reference.sign(secretKeyBytes, message)), vector.note);
            }
        });

        it("should be stricter than the reference: no 'zero' signature under the 'zero' public key", async () => {
            const message = Buffer.from("hello");

            assert.isTrue(referenceVerifies(Buffer.alloc(96), message, Buffer.alloc(48)));
            assert.isFalse(await new ValidatorPublicKey(Buffer.alloc(96)).verify(message, Buffer.alloc(48)));
        });

        it("should be stricter than the reference: no trailing bytes after the signature", async () => {
            const secretKey = new ValidatorSecretKey(fromHex(extendedVectors[0].secretKey));
            const message = Buffer.from("hello");
            const signature = Buffer.concat([secretKey.sign(message), Buffer.from([0xff])]);

            assert.isTrue(referenceVerifies(secretKey.generatePublicKey().valueOf(), message, signature));
            assert.isFalse(await secretKey.generatePublicKey().verify(message, signature));
        });

        it("should be stricter than the reference: no signature outside of the group G1 (a second 'valid' signature for the same message)", async () => {
            const secretKey = new ValidatorSecretKey(fromHex(extendedVectors[0].secretKey));
            const publicKey = secretKey.generatePublicKey();
            const message = Buffer.from("hello");
            const signature = secretKey.sign(message);

            // A point of order 3 (thus, not of G1) is added to the signature. The pairing does not "see" such a point,
            // so that the outcome passes the check of the pairings; it has to be rejected when decoded.
            const pointOfOrderThree = bls12_381.G1.Point.fromAffine({ x: 0n, y: 2n });
            const signaturePoint = herumiBls.deserializeG1Point(signature)!;
            const forged = Buffer.from(herumiBls.serializeG1Point(signaturePoint.add(pointOfOrderThree)));

            assert.isTrue(pointOfOrderThree.multiplyUnsafe(3n).is0());
            assert.notEqual(forged.toString("hex"), signature.toString("hex"));

            assert.isTrue(referenceVerifies(publicKey.valueOf(), message, signature));
            assert.isTrue(referenceVerifies(publicKey.valueOf(), message, forged));

            assert.isTrue(await publicKey.verify(message, signature));
            assert.isFalse(await publicKey.verify(message, forged));
        });

        it("should produce the same public keys as the reference (smallest and largest keys)", () => {
            const values = [1n, 2n, 3n, order - 3n, order - 2n, order - 1n];

            for (let exponent = 1; exponent < 255; exponent++) {
                values.push(1n << BigInt(exponent), (1n << BigInt(exponent)) - 1n);
            }

            for (const value of values) {
                if (value >= order) {
                    continue;
                }

                const secretKeyBytes = Buffer.from(value.toString(16).padStart(64, "0"), "hex").reverse();
                const secretKey = new ValidatorSecretKey(secretKeyBytes);

                assert.equal(
                    secretKey.generatePublicKey().hex(),
                    reference.getPublicKey(secretKeyBytes).toString("hex"),
                    `secret key: ${secretKeyBytes.toString("hex")}`,
                );
                assert.equal(
                    secretKey.sign(Buffer.from("hello")).toString("hex"),
                    reference.sign(secretKeyBytes, Buffer.from("hello")).toString("hex"),
                    `secret key: ${secretKeyBytes.toString("hex")}`,
                );
            }
        });
    });
});
