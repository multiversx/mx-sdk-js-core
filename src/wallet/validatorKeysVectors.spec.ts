import { assert } from "chai";
import { IBlsExtendedVector, IBlsVector, loadBlsExtendedVectors, loadBlsVectors } from "../testutils/blsVectors";
import { BLS, ValidatorSecretKey } from "./validatorKeys";

// These tests go through the public API only, so they must pass, unchanged, on any implementation of the validator keys.
// See "src/testdata/README.md" for where the vectors come from.
describe("test validator keys against the BLS test vectors", function () {
    // The pure JavaScript implementations are slower than the WebAssembly one.
    this.timeout(300000);

    // With the secret key 1, the signature is the message itself, hashed and mapped to G1.
    const secretKeyOne = Buffer.from("01" + "00".repeat(31), "hex");

    let vectors: IBlsVector[];
    let extendedVectors: IBlsExtendedVector[];

    before(async () => {
        await BLS.initIfNecessary();

        vectors = loadBlsVectors();
        extendedVectors = loadBlsExtendedVectors();
    });

    function fromHex(value: string): Buffer {
        return Buffer.from(value, "hex");
    }

    describe("vectors generated with the Go implementation", () => {
        it("should have loaded all the vectors", () => {
            assert.lengthOf(vectors, 1250);
            assert.equal(new Set(vectors.map((vector) => vector.secretKey)).size, 610);
            assert.equal(new Set(vectors.map((vector) => vector.message)).size, 5);
        });

        it("should derive the public keys", () => {
            const seen = new Set<string>();

            for (const [index, vector] of vectors.entries()) {
                if (seen.has(vector.secretKey)) {
                    continue;
                }

                seen.add(vector.secretKey);

                const secretKey = new ValidatorSecretKey(fromHex(vector.secretKey));
                assert.equal(secretKey.hex(), vector.secretKey, `vector ${index}`);
                assert.equal(secretKey.generatePublicKey().hex(), vector.publicKey, `vector ${index}`);
            }
        });

        it("should produce the signatures", () => {
            for (const [index, vector] of vectors.entries()) {
                const secretKey = new ValidatorSecretKey(fromHex(vector.secretKey));
                const signature = secretKey.sign(Buffer.from(vector.message));
                assert.equal(signature.toString("hex"), vector.signature, `vector ${index}`);
            }
        });

        it("should hash and map the messages to G1 (seen through the secret key 1)", () => {
            const mappedByMessage = new Map(vectors.map((vector) => [vector.message, vector.messageMapped]));
            const secretKey = new ValidatorSecretKey(secretKeyOne);

            for (const [message, messageMapped] of mappedByMessage) {
                assert.equal(secretKey.sign(Buffer.from(message)).toString("hex"), messageMapped, message);
            }
        });
    });

    describe("extended vectors (edge keys, message lengths, all the paths of the map to G1)", () => {
        it("should have loaded all the vectors, and they should cover what they are meant to", () => {
            assert.lengthOf(extendedVectors, 335);

            const countByGroup: Record<string, number> = {};
            for (const vector of extendedVectors) {
                countByGroup[vector.group] = (countByGroup[vector.group] || 0) + 1;
            }

            assert.deepEqual(countByGroup, { "edge-keys": 34, "message-lengths": 266, "structured-messages": 35 });

            // Every message length between 0 and 255 bytes (this crosses the block boundaries of SHA-512).
            const lengths = new Set(extendedVectors.map((vector) => vector.messageHex.length / 2));
            for (let length = 0; length <= 255; length++) {
                assert.isTrue(lengths.has(length), `no vector for a message of ${length} bytes`);
            }

            // Every path of the hash-and-map to G1.
            const paths = new Set(
                extendedVectors.map(({ hashToCurve }) =>
                    [hashToCurve.maskedTwice, hashToCurve.candidate, hashToCurve.negated].join(),
                ),
            );
            assert.equal(paths.size, 12);

            // Both values of the flag (the parity of "y") carried by the last byte of the public keys and of the signatures.
            for (const field of ["publicKey", "signature"] as const) {
                const flags = new Set(extendedVectors.map((vector) => parseInt(vector[field].slice(-2), 16) >> 7));
                assert.equal(flags.size, 2, field);
            }
        });

        it("should derive the public keys", () => {
            for (const vector of extendedVectors) {
                const secretKey = new ValidatorSecretKey(fromHex(vector.secretKey));
                assert.equal(secretKey.hex(), vector.secretKey, vector.note);
                assert.equal(secretKey.generatePublicKey().hex(), vector.publicKey, vector.note);
            }
        });

        it("should produce the signatures", () => {
            for (const vector of extendedVectors) {
                const secretKey = new ValidatorSecretKey(fromHex(vector.secretKey));
                const signature = secretKey.sign(fromHex(vector.messageHex));
                assert.equal(signature.toString("hex"), vector.signature, vector.note);
            }
        });

        it("should hash and map the messages to G1 (seen through the secret key 1)", () => {
            const secretKey = new ValidatorSecretKey(secretKeyOne);

            for (const vector of extendedVectors) {
                const mapped = secretKey.sign(fromHex(vector.messageHex));
                assert.equal(mapped.toString("hex"), vector.messageMapped, vector.note);
            }
        });

        it("should produce the same signatures when the messages are given as Uint8Array", () => {
            for (const vector of extendedVectors.filter((_, index) => index % 5 == 0)) {
                const secretKey = new ValidatorSecretKey(Uint8Array.from(fromHex(vector.secretKey)));
                const signature = secretKey.sign(Uint8Array.from(fromHex(vector.messageHex)));
                assert.equal(Buffer.from(signature).toString("hex"), vector.signature, vector.note);
            }
        });
    });

    describe("large messages", () => {
        const secretKeyHex = "7cff99bd671502db7d15bc8abc0c9a804fb925406fbdd50f1e4c17a4cd774247";

        it("should sign 64 KiB", () => {
            const signature = new ValidatorSecretKey(fromHex(secretKeyHex)).sign(Buffer.alloc(65536, 0xab));

            assert.equal(
                signature.toString("hex"),
                "507c21e9395f3be5272ed3b61a3e5b486ba8cc3b5f3491534649fdc026c9a82b59d7078fc7259a511c3fa95c8ebe0009",
            );
        });

        it("should sign 300000 bytes that aren't all the same", () => {
            const message = Buffer.alloc(300000);
            for (let i = 0; i < message.length; i++) {
                message[i] = i % 251;
            }

            const signature = new ValidatorSecretKey(fromHex(secretKeyHex)).sign(message);

            assert.equal(
                signature.toString("hex"),
                "2a0e633f994aed5a7abd5102b3db542701d2a1c371657e3511e4fa37c01be4eb12eed183aeb71aecaca5319018543d89",
            );
        });

        it("should sign 1 MB", () => {
            const signature = new ValidatorSecretKey(fromHex(secretKeyHex)).sign(Buffer.alloc(1000000, 0x07));

            assert.equal(
                signature.toString("hex"),
                "51f4c6e3edeb35188f60777ee761b23137d1a751566d7d73291912ddc36be386300f38f90819f54e01df91856cd68714",
            );
        });
    });
});
