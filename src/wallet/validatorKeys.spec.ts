import { assert } from "chai";
import * as fs from "fs";
import path from "path";
import { ErrBadPEM, ErrBadType, ErrInvariantFailed } from "../core/errors";
import { getTestWalletsPath } from "../testutils";
import {
    VALIDATOR_PUBKEY_LENGTH,
    VALIDATOR_SECRETKEY_LENGTH,
    ValidatorPublicKey,
    ValidatorSecretKey,
} from "./validatorKeys";

// The behaviour of the validator keys, as seen through the public API (see "validators.spec.ts", as well).
// These tests must pass, unchanged, on any implementation of the BLS operations.
describe("test validator secret key", () => {
    const secretKeyHex = "7cff99bd671502db7d15bc8abc0c9a804fb925406fbdd50f1e4c17a4cd774247";
    const publicKeyHex =
        "e7beaa95b3877f47348df4dd1cb578a4f7cabf7a20bfeefe5cdd263878ff132b765e04fef6f40c93512b666c47ed7719b8902f6c922c04247989b7137e837cc81a62e54712471c97a2ddab75aa9c2f58f813ed4c0fa722bde0ab718bff382208";
    const signatureOfHelloHex =
        "84fd0a3a9d4f1ea2d4b40c6da67f9b786284a1c3895b7253fec7311597cda3f757862bb0690a92a13ce612c33889fd86";
    const signatureOfNothingHex =
        "e4afbdfee382f863b5b37df2c6c7b8142490dcb38fee310841a7161c98c268d202ace286e044a268f92b82a7d8b04395";

    const otherSecretKeyHex = "8085ba1d7f7c3db938ad70595a2bdab09644f1ec3803be171c33f14bc80d4e3b";
    const otherSignatureOfHelloHex =
        "be2e593ff10899a2ee8e1d5c8094e36c9f48e04b87e129991ff09475808743e07bb41bf6e7bc1463fa554c4b46594b98";

    /**
     * Places the bytes in the middle of a larger buffer, so that the returned views have a non-zero offset.
     */
    function createViewsWithOffset(bytes: Buffer): Uint8Array[] {
        const larger = Buffer.alloc(bytes.length + 24, 0xee);
        bytes.copy(larger, 7);

        const arrayBuffer = new ArrayBuffer(bytes.length + 24);
        new Uint8Array(arrayBuffer).fill(0xdd);
        new Uint8Array(arrayBuffer).set(bytes, 13);

        return [larger.subarray(7, 7 + bytes.length), new Uint8Array(arrayBuffer, 13, bytes.length)];
    }

    it("should have the expected lengths", () => {
        assert.equal(VALIDATOR_SECRETKEY_LENGTH, 32);
        assert.equal(VALIDATOR_PUBKEY_LENGTH, 96);
    });

    it("should reject secret keys of a wrong length", () => {
        for (const length of [0, 1, 31, 33, 48, 64, 96]) {
            assert.throws(
                () => new ValidatorSecretKey(Buffer.alloc(length, 1)),
                ErrInvariantFailed,
                `wrong length, expected: 32, actual: ${length}`,
            );
        }

        // A hex-encoded key (64 characters) is not a key.
        assert.throws(() => new ValidatorSecretKey(secretKeyHex as any), ErrInvariantFailed);
        assert.throws(() => new ValidatorSecretKey(undefined as any));
        assert.throws(() => new ValidatorSecretKey(null as any));
    });

    it("should hold the same key, however the bytes are given", () => {
        const bytes = Buffer.from(secretKeyHex, "hex");
        const inputs: Uint8Array[] = [bytes, Uint8Array.from(bytes), ...createViewsWithOffset(bytes)];

        for (const input of inputs) {
            const secretKey = new ValidatorSecretKey(input);

            assert.equal(secretKey.hex(), secretKeyHex);
            assert.equal(secretKey.generatePublicKey().hex(), publicKeyHex);
            assert.equal(secretKey.sign(Buffer.from("hello")).toString("hex"), signatureOfHelloHex);
        }
    });

    it("should not be affected by later changes of the bytes it was created from", () => {
        const bytes = Buffer.from(secretKeyHex, "hex");
        const secretKey = new ValidatorSecretKey(bytes);

        bytes.fill(1);

        assert.equal(secretKey.hex(), secretKeyHex);
        assert.equal(secretKey.generatePublicKey().hex(), publicKeyHex);
        assert.equal(secretKey.sign(Buffer.from("hello")).toString("hex"), signatureOfHelloHex);
    });

    it("should export the key as hex and as a buffer", () => {
        const secretKey = new ValidatorSecretKey(Buffer.from(secretKeyHex, "hex"));

        assert.equal(secretKey.hex(), secretKeyHex);
        assert.isTrue(Buffer.isBuffer(secretKey.valueOf()));
        assert.lengthOf(secretKey.valueOf(), 32);
        assert.equal(secretKey.valueOf().toString("hex"), secretKeyHex);

        // Round-trip.
        const again = new ValidatorSecretKey(secretKey.valueOf());
        assert.equal(again.hex(), secretKeyHex);
        assert.equal(again.generatePublicKey().hex(), publicKeyHex);
    });

    it("should generate the public key", () => {
        const secretKey = new ValidatorSecretKey(Buffer.from(secretKeyHex, "hex"));
        const publicKey = secretKey.generatePublicKey();

        assert.instanceOf(publicKey, ValidatorPublicKey);
        assert.equal(publicKey.hex(), publicKeyHex);
        assert.lengthOf(publicKey.valueOf(), 96);

        // Each time, the same key.
        assert.equal(secretKey.generatePublicKey().hex(), publicKeyHex);
        assert.equal(secretKey.generatePublicKey().hex(), publicKeyHex);

        // Signing does not alter the keys.
        secretKey.sign(Buffer.from("hello"));
        assert.equal(secretKey.hex(), secretKeyHex);
        assert.equal(secretKey.generatePublicKey().hex(), publicKeyHex);
    });

    it("should sign, and return a buffer of 48 bytes", () => {
        const secretKey = new ValidatorSecretKey(Buffer.from(secretKeyHex, "hex"));
        const signature = secretKey.sign(Buffer.from("hello"));

        assert.isTrue(Buffer.isBuffer(signature));
        assert.lengthOf(signature, 48);
        assert.equal(signature.toString("hex"), signatureOfHelloHex);
    });

    it("should sign deterministically", () => {
        const secretKey = new ValidatorSecretKey(Buffer.from(secretKeyHex, "hex"));
        const sameSecretKey = new ValidatorSecretKey(Buffer.from(secretKeyHex, "hex"));

        for (let i = 0; i < 5; i++) {
            assert.equal(secretKey.sign(Buffer.from("hello")).toString("hex"), signatureOfHelloHex);
            assert.equal(sameSecretKey.sign(Buffer.from("hello")).toString("hex"), signatureOfHelloHex);
        }
    });

    it("should produce different signatures for different messages, and for different keys", () => {
        const secretKey = new ValidatorSecretKey(Buffer.from(secretKeyHex, "hex"));
        const otherSecretKey = new ValidatorSecretKey(Buffer.from(otherSecretKeyHex, "hex"));

        const signatures = [
            secretKey.sign(Buffer.from("hello")),
            secretKey.sign(Buffer.from("hello ")),
            secretKey.sign(Buffer.from("Hello")),
            secretKey.sign(Buffer.from("hello\0")),
            secretKey.sign(Buffer.from("")),
            otherSecretKey.sign(Buffer.from("hello")),
        ].map((signature) => signature.toString("hex"));

        assert.equal(new Set(signatures).size, signatures.length);
        assert.equal(signatures[0], signatureOfHelloHex);
        assert.equal(signatures[5], otherSignatureOfHelloHex);
    });

    it("should sign the empty message", () => {
        const secretKey = new ValidatorSecretKey(Buffer.from(secretKeyHex, "hex"));

        assert.equal(secretKey.sign(Buffer.alloc(0)).toString("hex"), signatureOfNothingHex);
        assert.equal(secretKey.sign(new Uint8Array(0)).toString("hex"), signatureOfNothingHex);
    });

    it("should sign the same, however the bytes of the message are given", () => {
        const secretKey = new ValidatorSecretKey(Buffer.from(secretKeyHex, "hex"));
        const message = Buffer.from("hello");
        const inputs: Uint8Array[] = [message, Uint8Array.from(message), ...createViewsWithOffset(message)];

        for (const input of inputs) {
            assert.equal(secretKey.sign(input).toString("hex"), signatureOfHelloHex);
        }
    });

    it("should not alter the message while signing", () => {
        const secretKey = new ValidatorSecretKey(Buffer.from(secretKeyHex, "hex"));
        const message = Buffer.from("hello");

        secretKey.sign(message);

        assert.equal(message.toString(), "hello");
    });

    it("should not hand out the same buffer for two signatures", () => {
        const secretKey = new ValidatorSecretKey(Buffer.from(secretKeyHex, "hex"));
        const signature = secretKey.sign(Buffer.from("hello"));

        signature.fill(0);

        assert.equal(secretKey.sign(Buffer.from("hello")).toString("hex"), signatureOfHelloHex);
    });

    it("should keep keys apart, when several of them are in use at the same time", async () => {
        const text = fs.readFileSync(path.join(getTestWalletsPath(), "multipleValidatorKeys.pem"), "utf-8");
        const secretKeys = [0, 1, 2, 3].map((index) => ValidatorSecretKey.fromPem(text, index));
        const messages = ["a", "b", "c"].map((item) => Buffer.from(item));

        // First, each key on its own.
        const expected = secretKeys.map((secretKey) => ({
            publicKey: new ValidatorSecretKey(secretKey.valueOf()).generatePublicKey().hex(),
            signatures: messages.map((message) =>
                new ValidatorSecretKey(secretKey.valueOf()).sign(message).toString("hex"),
            ),
        }));

        // Then, interleaved.
        for (let round = 0; round < 3; round++) {
            for (const [messageIndex, message] of messages.entries()) {
                for (const [keyIndex, secretKey] of secretKeys.entries()) {
                    assert.equal(secretKey.sign(message).toString("hex"), expected[keyIndex].signatures[messageIndex]);
                    assert.equal(secretKey.generatePublicKey().hex(), expected[keyIndex].publicKey);
                }
            }
        }

        assert.equal(new Set(expected.map((item) => item.publicKey)).size, 4);
        assert.equal(new Set(expected.flatMap((item) => item.signatures)).size, 12);
    });

    // The declared type of the message is "Buffer | Uint8Array". JavaScript callers aren't held to it, though.
    describe("messages that aren't of the declared type", () => {
        it("should sign an array of bytes as the bytes", () => {
            const secretKey = new ValidatorSecretKey(Buffer.from(secretKeyHex, "hex"));
            const signature = secretKey.sign(Array.from(Buffer.from("hello")) as any);

            assert.equal(signature.toString("hex"), signatureOfHelloHex);
        });

        it("should sign an ASCII string as its bytes", () => {
            const secretKey = new ValidatorSecretKey(Buffer.from(secretKeyHex, "hex"));

            assert.equal(secretKey.sign("hello" as any).toString("hex"), signatureOfHelloHex);
            assert.equal(secretKey.sign("" as any).toString("hex"), signatureOfNothingHex);
        });

        it("should sign a string as one byte per character (the low byte of its code), not as UTF-8", () => {
            const secretKey = new ValidatorSecretKey(Buffer.from(secretKeyHex, "hex"));

            for (const text of ["é", "héllo", "€", "🔐", "aĀb"]) {
                const lowBytes = Buffer.alloc(text.length);
                for (let i = 0; i < text.length; i++) {
                    lowBytes[i] = text.charCodeAt(i) & 0xff;
                }

                const signature = secretKey.sign(text as any).toString("hex");

                assert.equal(signature, secretKey.sign(lowBytes).toString("hex"), text);
                assert.notEqual(signature, secretKey.sign(Buffer.from(text, "utf-8")).toString("hex"), text);
            }

            assert.equal(
                secretKey.sign("héllo" as any).toString("hex"),
                secretKey.sign(Buffer.from([0x68, 0xe9, 0x6c, 0x6c, 0x6f])).toString("hex"),
            );
        });

        it("should sign an array as if converted by Uint8Array.from()", () => {
            const secretKey = new ValidatorSecretKey(Buffer.from(secretKeyHex, "hex"));
            const arrays: any[][] = [[256, 257, -1, 1.9, 104], [104, undefined, null, "7", NaN], [104, , 108], []];
            const expectedBytes = ["0001ff0168", "6800000700", "68006c", ""];

            for (const [index, array] of arrays.entries()) {
                const bytes = Uint8Array.from(array);

                assert.equal(Buffer.from(bytes).toString("hex"), expectedBytes[index]);
                assert.equal(secretKey.sign(array as any).toString("hex"), secretKey.sign(bytes).toString("hex"));
            }
        });

        it("should not sign something that isn't binary data", () => {
            const secretKey = new ValidatorSecretKey(Buffer.from(secretKeyHex, "hex"));

            for (const message of [
                undefined,
                null,
                42,
                {},
                true,
                new ArrayBuffer(5),
                new Uint16Array(5),
                new Uint8ClampedArray(5),
                new DataView(new ArrayBuffer(5)),
                { length: 5 },
            ]) {
                assert.throws(() => secretKey.sign(message as any));
            }
        });
    });

    describe("loading from PEM", () => {
        const text = fs.readFileSync(path.join(getTestWalletsPath(), "multipleValidatorKeys.pem"), "utf-8");

        it("should load the key at the given index (by default, the first one)", () => {
            const expected = [
                "7c19bf3a0c57cdd1fb08e4607cebaa3647d6b9261b4693f61e96e54b218d442a",
                "3034b1d58628a842984da0c70da0b5a251ebb2aebf51afc5b586e2839b5e5263",
                "de7e1b385edbb0e1e8f9fc25d91bd8eed71a1da7caab732e6b47a48042d8523d",
                "8ebeb07d296ad2529400b40687a741a135f8357f79f39fcb2894a6f9703a5816",
            ];

            assert.equal(ValidatorSecretKey.fromPem(text).hex(), expected[0]);

            for (const [index, secretKeyHex] of expected.entries()) {
                assert.equal(ValidatorSecretKey.fromPem(text, index).hex(), secretKeyHex);
            }
        });

        it("should reject entries that don't hold a validator key", () => {
            const userPem = fs.readFileSync(path.join(getTestWalletsPath(), "alice.pem"), "utf-8");

            assert.throws(
                () => ValidatorSecretKey.fromPem(userPem),
                ErrBadPEM,
                "incorrect key length: expected 32, found 64",
            );
        });
    });
});

describe("test validator public key", () => {
    const publicKeyHex =
        "e7beaa95b3877f47348df4dd1cb578a4f7cabf7a20bfeefe5cdd263878ff132b765e04fef6f40c93512b666c47ed7719b8902f6c922c04247989b7137e837cc81a62e54712471c97a2ddab75aa9c2f58f813ed4c0fa722bde0ab718bff382208";

    it("should reject public keys of a wrong length", () => {
        for (const length of [0, 1, 32, 48, 95, 97, 192]) {
            assert.throws(
                () => new ValidatorPublicKey(Buffer.alloc(length, 1)),
                ErrInvariantFailed,
                `wrong length, expected: 96, actual: ${length}`,
            );
        }

        assert.throws(() => new ValidatorPublicKey(undefined as any));
        assert.throws(() => new ValidatorPublicKey(null as any));
    });

    it("should hold the same key, however the bytes are given", () => {
        const bytes = Buffer.from(publicKeyHex, "hex");
        const larger = Buffer.concat([Buffer.alloc(5, 0xee), bytes, Buffer.alloc(5, 0xee)]);

        for (const input of [bytes, Uint8Array.from(bytes), larger.subarray(5, 5 + 96)]) {
            const publicKey = new ValidatorPublicKey(input);

            assert.equal(publicKey.hex(), publicKeyHex);
            assert.isTrue(Buffer.isBuffer(publicKey.valueOf()));
            assert.lengthOf(publicKey.valueOf(), 96);
            assert.equal(publicKey.valueOf().toString("hex"), publicKeyHex);
        }
    });

    it("should not be affected by later changes of the bytes it was created from", () => {
        const bytes = Buffer.from(publicKeyHex, "hex");
        const publicKey = new ValidatorPublicKey(bytes);

        bytes.fill(0);

        assert.equal(publicKey.hex(), publicKeyHex);
    });

    it("should be usable where bytes are expected (as the transactions factories do)", () => {
        const publicKey = new ValidatorPublicKey(Buffer.from(publicKeyHex, "hex"));

        assert.equal(Buffer.from(publicKey as any).toString("hex"), publicKeyHex);
    });

    it("should hold any 96 bytes, without checking that they are a point on the curve (as before)", () => {
        for (const bytes of [Buffer.alloc(96), Buffer.alloc(96, 0xff), Buffer.alloc(96, 1)]) {
            assert.equal(new ValidatorPublicKey(bytes).hex(), bytes.toString("hex"));
        }
    });

    describe("verifying signatures", function () {
        this.timeout(60000);

        const secretKeyHex = "7cff99bd671502db7d15bc8abc0c9a804fb925406fbdd50f1e4c17a4cd774247";
        const signatureOfHelloHex =
            "84fd0a3a9d4f1ea2d4b40c6da67f9b786284a1c3895b7253fec7311597cda3f757862bb0690a92a13ce612c33889fd86";
        const signatureOfNothingHex =
            "e4afbdfee382f863b5b37df2c6c7b8142490dcb38fee310841a7161c98c268d202ace286e044a268f92b82a7d8b04395";

        const otherSecretKeyHex = "8085ba1d7f7c3db938ad70595a2bdab09644f1ec3803be171c33f14bc80d4e3b";
        const otherSignatureOfHelloHex =
            "be2e593ff10899a2ee8e1d5c8094e36c9f48e04b87e129991ff09475808743e07bb41bf6e7bc1463fa554c4b46594b98";

        const hello = Buffer.from("hello");
        const publicKey = new ValidatorPublicKey(Buffer.from(publicKeyHex, "hex"));
        const signatureOfHello = Buffer.from(signatureOfHelloHex, "hex");

        function flipBit(bytes: Uint8Array, byteIndex: number, bit: number): Buffer {
            const copy = Buffer.from(bytes);
            copy[byteIndex] ^= 1 << bit;
            return copy;
        }

        it("should verify a signature, and resolve to a boolean", async () => {
            assert.instanceOf(publicKey.verify(hello, signatureOfHello), Promise);

            assert.strictEqual(await publicKey.verify(hello, signatureOfHello), true);
            assert.strictEqual(
                await publicKey.verify(Buffer.alloc(0), Buffer.from(signatureOfNothingHex, "hex")),
                true,
            );
            assert.strictEqual(await publicKey.verify(Buffer.from("hello!"), signatureOfHello), false);
        });

        it("should verify what the secret key signs", async () => {
            const secretKey = new ValidatorSecretKey(Buffer.from(secretKeyHex, "hex"));
            const otherSecretKey = new ValidatorSecretKey(Buffer.from(otherSecretKeyHex, "hex"));

            const messages = [
                Buffer.alloc(0),
                Buffer.from([0]),
                Buffer.from("hello"),
                Buffer.alloc(127, 7),
                Buffer.alloc(128, 7),
                Buffer.alloc(129, 7),
                Buffer.alloc(100000, 0xab),
            ];

            for (const message of messages) {
                for (const key of [secretKey, otherSecretKey]) {
                    const signature = key.sign(message);

                    assert.isTrue(
                        await key.generatePublicKey().verify(message, signature),
                        `length: ${message.length}`,
                    );
                }

                // The signature of one key is not valid under the public key of the other.
                assert.isFalse(await otherSecretKey.generatePublicKey().verify(message, secretKey.sign(message)));
            }
        });

        it("should not verify when the message, the public key or the signature is another one", async () => {
            const otherPublicKey = new ValidatorSecretKey(Buffer.from(otherSecretKeyHex, "hex")).generatePublicKey();
            const otherSignatureOfHello = Buffer.from(otherSignatureOfHelloHex, "hex");

            assert.isTrue(await otherPublicKey.verify(hello, otherSignatureOfHello));

            assert.isFalse(await publicKey.verify(hello, otherSignatureOfHello));
            assert.isFalse(await otherPublicKey.verify(hello, signatureOfHello));
            assert.isFalse(await publicKey.verify(hello, Buffer.from(signatureOfNothingHex, "hex")));

            assert.isFalse(await publicKey.verify(Buffer.from("Hello"), signatureOfHello));
            assert.isFalse(await publicKey.verify(Buffer.from("hell"), signatureOfHello));
            assert.isFalse(await publicKey.verify(Buffer.from("hello\0"), signatureOfHello));
            assert.isFalse(await publicKey.verify(Buffer.alloc(0), signatureOfHello));
        });

        it("should not verify a signature that was altered (any single bit)", async () => {
            for (let byteIndex = 0; byteIndex < 48; byteIndex++) {
                for (const bit of [0, 7]) {
                    const altered = flipBit(signatureOfHello, byteIndex, bit);
                    assert.isFalse(await publicKey.verify(hello, altered), `byte ${byteIndex}, bit ${bit}`);
                }
            }
        });

        it("should not verify under a public key that was altered", async () => {
            for (let byteIndex = 0; byteIndex < 96; byteIndex += 5) {
                const altered = new ValidatorPublicKey(flipBit(publicKey.valueOf(), byteIndex, 0));
                assert.isFalse(await altered.verify(hello, signatureOfHello), `byte ${byteIndex}`);
            }

            // The highest bit of the last byte carries the parity of "y": when flipped, the point is the opposite one.
            assert.isFalse(
                await new ValidatorPublicKey(flipBit(publicKey.valueOf(), 95, 7)).verify(hello, signatureOfHello),
            );
        });

        it("should verify the same, however the bytes are given", async () => {
            const larger = Buffer.concat([Buffer.alloc(9, 0xee), hello, signatureOfHello, Buffer.alloc(9, 0xee)]);
            const messageView = larger.subarray(9, 9 + hello.length);
            const signatureView = new Uint8Array(larger.buffer, larger.byteOffset + 9 + hello.length, 48);

            assert.isTrue(await publicKey.verify(messageView, signatureView));
            assert.isTrue(await publicKey.verify(Uint8Array.from(hello), Uint8Array.from(signatureOfHello)));

            // As for signing, arrays of bytes and ASCII strings are accepted as messages, even though they aren't of the declared type.
            assert.isTrue(await publicKey.verify([...hello] as any, signatureOfHello));
            assert.isTrue(await publicKey.verify("hello" as any, signatureOfHello));
            assert.isTrue(await publicKey.verify(hello, [...signatureOfHello] as any));
        });

        it("should not alter the message, the signature or the public key", async () => {
            const message = Buffer.from(hello);
            const signature = Buffer.from(signatureOfHello);

            assert.isTrue(await publicKey.verify(message, signature));
            assert.isFalse(await publicKey.verify(message, flipBit(signature, 3, 3)));

            assert.equal(message.toString(), "hello");
            assert.equal(signature.toString("hex"), signatureOfHelloHex);
            assert.equal(publicKey.hex(), publicKeyHex);
            assert.isTrue(await publicKey.verify(message, signature));
        });

        it("should not verify (and not reject) when the signature is malformed", async () => {
            const malformed = [
                Buffer.alloc(0),
                signatureOfHello.subarray(0, 47),
                Buffer.concat([signatureOfHello, Buffer.from([0])]),
                Buffer.concat([signatureOfHello, signatureOfHello]),
                publicKey.valueOf(),
                // Not the encoding of a point of the curve.
                Buffer.alloc(48, 0xff),
                Buffer.alloc(48, 0x01),
                // The point at infinity.
                Buffer.alloc(48),
            ];

            for (const signature of malformed) {
                assert.isFalse(await publicKey.verify(hello, signature), signature.toString("hex"));
            }
        });

        it("should not verify (and not reject) when the public key is not a valid one", async () => {
            for (const bytes of [Buffer.alloc(96), Buffer.alloc(96, 0xff), Buffer.alloc(96, 1)]) {
                assert.isFalse(
                    await new ValidatorPublicKey(bytes).verify(hello, signatureOfHello),
                    bytes.toString("hex"),
                );
            }
        });

        it("should not accept the 'zero' signature under the 'zero' public key", async () => {
            // Otherwise, anyone could produce a "valid" signature, for any message.
            const zeroPublicKey = new ValidatorPublicKey(Buffer.alloc(96));

            for (const message of [hello, Buffer.alloc(0), Buffer.alloc(300, 1)]) {
                assert.isFalse(await zeroPublicKey.verify(message, Buffer.alloc(48)));
            }
        });

        it("should reject when the message or the signature isn't binary data", async () => {
            for (const message of [undefined, null, 5, {}, true]) {
                const error = await publicKey.verify(message as any, signatureOfHello).catch((err) => err);
                assert.instanceOf(error, ErrBadType);
            }

            // A hex-encoded signature is not a signature.
            for (const signature of [undefined, null, 5, {}, signatureOfHelloHex, ["84"]]) {
                const error = await publicKey.verify(hello, signature as any).catch((err) => err);
                assert.instanceOf(error, ErrBadType);
            }
        });
    });
});
