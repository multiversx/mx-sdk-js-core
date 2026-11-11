import { assert } from "chai";
import { randomBytes, randomInt } from "crypto";
import * as fs from "fs";
import path from "path";
import { getTestWalletsPath } from "../testutils";
import { ReferenceBls } from "../testutils/blsReference";
import { IBlsExtendedVector, IBlsVector, loadBlsExtendedVectors, loadBlsVectors } from "../testutils/blsVectors";
import { BLS, ValidatorSecretKey } from "./validatorKeys";
import { ValidatorPEM } from "./validatorPem";

// The SDK, compared against the reference implementation (Herumi, as WebAssembly), which is loaded directly by the tests.
//
// While the SDK itself computes on the reference implementation, the tests that compare the outcomes of the two
// ("should produce the same ... as the reference") cannot fail. They become the actual safety net once the SDK
// switches to another implementation. The tests that verify signatures are meaningful in both situations.
describe("test validator keys against the reference BLS implementation", function () {
    this.timeout(300000);

    // The order of the group (BLS12-381).
    const order = BigInt("0x73eda753299d7d483339d80809a1d80553bda402fffe5bfeffffffff00000001");

    let reference: ReferenceBls;
    let vectors: IBlsVector[];
    let extendedVectors: IBlsExtendedVector[];

    before(async () => {
        await BLS.initIfNecessary();

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
                if (index % 10 != 0) {
                    continue;
                }

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
            for (const vector of extendedVectors.filter((_, index) => index % 4 == 0)) {
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
            for (const vector of extendedVectors.filter(
                (vector, index) => vector.group == "edge-keys" || index % 3 == 0,
            )) {
                const secretKey = new ValidatorSecretKey(fromHex(vector.secretKey));
                const publicKey = secretKey.generatePublicKey().valueOf();
                const message = fromHex(vector.messageHex);
                const signature = secretKey.sign(message);

                assert.isTrue(referenceVerifies(publicKey, message, signature), vector.note);
            }
        });

        it("should produce the same public keys and signatures as the reference (random keys and messages)", function () {
            if (reference.isUsedBySdk()) {
                console.info(
                    "        (the SDK computes on the reference implementation: this comparison is trivial, for now)",
                );
            }

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

                if (i % 10 == 0) {
                    assert.isTrue(referenceVerifies(publicKey, message, signature), context);
                }
            }
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
