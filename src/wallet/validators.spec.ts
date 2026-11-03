import { assert } from "chai";
import * as fs from "fs";
import path from "path";
import { ErrBadType, ErrInvalidArgument } from "../core/errors";
import { getTestWalletsPath } from "../testutils";
import { BLS, ValidatorSecretKey } from "./validatorKeys";
import { ValidatorPEM } from "./validatorPem";

describe("test BLS initialization", () => {
    // Puts the class back into its "never initialized" state, so that the next call goes through a cold start.
    function resetBLS() {
        (BLS as any).isInitialized = false;
        (BLS as any).initPromise = undefined;
    }

    it("should initialize the BLS module only once, even if called concurrently", async () => {
        await BLS.initIfNecessary();

        const originalInit = BLS.bls.init;
        let numCalls = 0;
        BLS.bls.init = (...args: any[]) => {
            numCalls++;
            return originalInit(...args);
        };

        try {
            resetBLS();
            await Promise.all([BLS.initIfNecessary(), BLS.initIfNecessary(), BLS.initIfNecessary()]);
            await BLS.initIfNecessary();
        } finally {
            BLS.bls.init = originalInit;
        }

        assert.equal(numCalls, 1);
        assert.doesNotThrow(() => BLS.guardInitialized());
    });

    it("should load the correct keys when validator PEMs are loaded concurrently, on first use", async () => {
        const text = fs.readFileSync(path.join(getTestWalletsPath(), "multipleValidatorKeys.pem"), "utf-8").trim();
        const blocks = text.split(/\n(?=-----BEGIN)/);
        const data = Buffer.from("hello");

        resetBLS();
        const pems = await Promise.all(blocks.map((block) => ValidatorPEM.fromText(block)));

        assert.lengthOf(pems, 4);

        for (let i = 0; i < pems.length; i++) {
            const pem = pems[i];
            const freshlyLoadedKey = ValidatorSecretKey.fromPem(blocks[i]);

            // The label of each entry is the public key.
            assert.equal(pem.secretKey.generatePublicKey().hex(), pem.label);
            assert.equal(pem.secretKey.hex(), freshlyLoadedKey.hex());
            assert.deepEqual(pem.secretKey.sign(data), freshlyLoadedKey.sign(data));
            assert.equal(pem.toText(), blocks[i]);
        }
    });

    it("should allow a retry after a failed initialization", async () => {
        const originalInit = BLS.bls.init;
        BLS.bls.init = () => Promise.reject(new Error("init failed"));

        let error: any;
        try {
            resetBLS();
            await BLS.initIfNecessary();
        } catch (err) {
            error = err;
        } finally {
            BLS.bls.init = originalInit;
        }

        assert.equal(error?.message, "init failed");
        assert.throws(() => BLS.guardInitialized());

        await BLS.initIfNecessary();
        assert.doesNotThrow(() => BLS.guardInitialized());
    });
});

describe("test validator keys", () => {
    it("should return copies of the internal buffers, so that the keys can't be altered through them", async () => {
        await BLS.initIfNecessary();

        const secretKeyHex = "7cff99bd671502db7d15bc8abc0c9a804fb925406fbdd50f1e4c17a4cd774247";
        const secretKey = new ValidatorSecretKey(Buffer.from(secretKeyHex, "hex"));
        const publicKey = secretKey.generatePublicKey();
        const publicKeyHex = publicKey.hex();

        assert.notStrictEqual(publicKey.valueOf(), publicKey.valueOf());

        secretKey.valueOf().fill(0);
        publicKey.valueOf().fill(0);

        assert.equal(secretKey.hex(), secretKeyHex);
        assert.equal(publicKey.hex(), publicKeyHex);
        assert.equal(secretKey.generatePublicKey().hex(), publicKeyHex);
    });

    it("should create secret key and sign a message", async () => {
        await BLS.initIfNecessary();

        let secretKey = Buffer.from(
            Buffer.from(
                "N2NmZjk5YmQ2NzE1MDJkYjdkMTViYzhhYmMwYzlhODA0ZmI5MjU0MDZmYmRkNTBmMWU0YzE3YTRjZDc3NDI0Nw==",
                "base64",
            ).toString(),
            "hex",
        );
        let key = new ValidatorSecretKey(secretKey);

        assert.deepEqual(new ValidatorSecretKey(secretKey), new ValidatorSecretKey(Uint8Array.from(secretKey)));
        assert.equal(
            key.generatePublicKey().hex(),
            "e7beaa95b3877f47348df4dd1cb578a4f7cabf7a20bfeefe5cdd263878ff132b765e04fef6f40c93512b666c47ed7719b8902f6c922c04247989b7137e837cc81a62e54712471c97a2ddab75aa9c2f58f813ed4c0fa722bde0ab718bff382208",
        );

        const data = Buffer.from("hello");

        let signature = key.sign(data);

        assert.deepEqual(key.sign(data), key.sign(Uint8Array.from(data)));
        assert.equal(
            Buffer.from(signature).toString("hex"),
            "84fd0a3a9d4f1ea2d4b40c6da67f9b786284a1c3895b7253fec7311597cda3f757862bb0690a92a13ce612c33889fd86",
        );

        secretKey = Buffer.from(
            Buffer.from(
                "ODA4NWJhMWQ3ZjdjM2RiOTM4YWQ3MDU5NWEyYmRhYjA5NjQ0ZjFlYzM4MDNiZTE3MWMzM2YxNGJjODBkNGUzYg==",
                "base64",
            ).toString(),
            "hex",
        );
        key = new ValidatorSecretKey(secretKey);
        assert.equal(
            key.generatePublicKey().hex(),
            "78689fd4b1e2e434d567fe01e61598a42717d83124308266bd09ccc15d2339dd318c019914b86ac29adbae5dd8a02d0307425e9bd85a296e94943708c72f8c670f0b7c50a890a5719088dbd9f1d062cad9acffa06df834106eebe1a4257ef00d",
        );

        signature = key.sign(data);

        assert.deepEqual(key.sign(data), key.sign(Uint8Array.from(data)));
        assert.equal(
            Buffer.from(signature).toString("hex"),
            "be2e593ff10899a2ee8e1d5c8094e36c9f48e04b87e129991ff09475808743e07bb41bf6e7bc1463fa554c4b46594b98",
        );
    });

    it("should handle PEM files", async () => {
        await BLS.initIfNecessary();

        let text = `-----BEGIN foobar
N2NmZjk5YmQ2NzE1MDJkYjdkMTViYzhhYmMwYzlhODA0ZmI5MjU0MDZmYmRkNTBmMWU0YzE3YTRjZDc3NDI0Nw==
-----END foobar`;
        assert.equal(
            ValidatorSecretKey.fromPem(text).hex(),
            "7cff99bd671502db7d15bc8abc0c9a804fb925406fbdd50f1e4c17a4cd774247",
        );
        assert.equal(
            ValidatorSecretKey.fromPem(text).generatePublicKey().hex(),
            "e7beaa95b3877f47348df4dd1cb578a4f7cabf7a20bfeefe5cdd263878ff132b765e04fef6f40c93512b666c47ed7719b8902f6c922c04247989b7137e837cc81a62e54712471c97a2ddab75aa9c2f58f813ed4c0fa722bde0ab718bff382208",
        );
    });
});

describe("test validator secret keys that are not valid", () => {
    // The order of the group (BLS12-381), as little-endian bytes (as the secret keys are given).
    const orderHex = "01000000fffffffffe5bfeff02a4bd5305d8a10908d83933487d9d2953a7ed73";
    const order = BigInt("0x" + Buffer.from(orderHex, "hex").reverse().toString("hex"));
    const normalKeyHex = "7cff99bd671502db7d15bc8abc0c9a804fb925406fbdd50f1e4c17a4cd774247";

    function toLittleEndianHex(value: bigint): string {
        return Buffer.from(value.toString(16).padStart(64, "0"), "hex").reverse().toString("hex");
    }

    function fromLittleEndianHex(value: string): bigint {
        return BigInt("0x" + Buffer.from(value, "hex").reverse().toString("hex"));
    }

    function createPem(secretKeyHex: string): string {
        const body = Buffer.from(secretKeyHex).toString("base64");
        return `-----BEGIN PRIVATE KEY for foo-----\n${body}\n-----END PRIVATE KEY for foo-----`;
    }

    function catchError(fn: () => any): any {
        try {
            fn();
        } catch (err) {
            return err;
        }
    }

    before(async () => {
        await BLS.initIfNecessary();
    });

    it("should reject the zero key", async () => {
        const zeroHex = "00".repeat(32);

        assert.throws(
            () => new ValidatorSecretKey(Buffer.alloc(32)),
            ErrInvalidArgument,
            "the validator secret key must not be zero",
        );
        assert.throws(() => ValidatorSecretKey.fromPem(createPem(zeroHex)), ErrInvalidArgument);

        const error = await ValidatorPEM.fromText(createPem(zeroHex)).catch((err) => err);
        assert.instanceOf(error, ErrInvalidArgument);
    });

    it("should reject a key given as a string (instead of turning it into the zero key)", async () => {
        const error = catchError(() => new ValidatorSecretKey("a".repeat(32) as any));
        assert.instanceOf(error, ErrBadType);
    });

    it("should accept a key given as an array of bytes, as before", async () => {
        const keyHex = "7cff99bd671502db7d15bc8abc0c9a804fb925406fbdd50f1e4c17a4cd774247";
        const secretKey = new ValidatorSecretKey(Array.from(Buffer.from(keyHex, "hex")) as any);
        assert.equal(secretKey.hex(), keyHex);
    });

    it("should reject keys that are not lower than the order of the group (instead of silently changing them)", async () => {
        const keys = [
            orderHex,
            toLittleEndianHex(order + 1n),
            toLittleEndianHex(order + fromLittleEndianHex(normalKeyHex)),
            toLittleEndianHex(2n ** 255n),
            "ff".repeat(32),
        ];

        for (const keyHex of keys) {
            const constructorError = catchError(() => new ValidatorSecretKey(Buffer.from(keyHex, "hex")));
            assert.instanceOf(constructorError, ErrInvalidArgument, keyHex);
            assert.include(constructorError.message, "the validator secret key is out of range", keyHex);

            const fromPemError = catchError(() => ValidatorSecretKey.fromPem(createPem(keyHex)));
            assert.instanceOf(fromPemError, ErrInvalidArgument, keyHex);

            const error = await ValidatorPEM.fromText(createPem(keyHex)).catch((err) => err);
            assert.instanceOf(error, ErrInvalidArgument, keyHex);
        }
    });

    it("should accept the keys in range, unchanged (including the smallest and the largest)", async () => {
        // Same public keys as computed by mx-sdk-py (with the native library used by the Node, as well).
        const cases: [string, string][] = [
            [
                toLittleEndianHex(1n),
                "cc1ef2d9d8c53b60568548e55c1a3ae34e07ce638182fcbd6476c381db2806dfbb612c123cab0a1400cf1af81a013d0fb3a4f19603d35ca16f6709162ca8fc9e5ffbbdbfa6dc2ad8f655660e3f4c928ce26401a98e65c2168a900f08a5f71d97",
            ],
            [
                toLittleEndianHex(order - 1n),
                "cc1ef2d9d8c53b60568548e55c1a3ae34e07ce638182fcbd6476c381db2806dfbb612c123cab0a1400cf1af81a013d0fb3a4f19603d35ca16f6709162ca8fc9e5ffbbdbfa6dc2ad8f655660e3f4c928ce26401a98e65c2168a900f08a5f71d17",
            ],
            [
                toLittleEndianHex(2n ** 254n),
                "65ab4e72c42aae5211a25d6f611b5b66c5d3ff72c95df453701234b3e9577219d4fd0718dffe60c1a4ff1d6ca0f11e09983874a2ea8d2dc0d378f4aa755d42a38f7e50ca8a86e4036446f31d3cdc53333adc905fcf5ede650620ccedeb7b5d81",
            ],
            [
                normalKeyHex,
                "e7beaa95b3877f47348df4dd1cb578a4f7cabf7a20bfeefe5cdd263878ff132b765e04fef6f40c93512b666c47ed7719b8902f6c922c04247989b7137e837cc81a62e54712471c97a2ddab75aa9c2f58f813ed4c0fa722bde0ab718bff382208",
            ],
        ];

        for (const [keyHex, publicKeyHex] of cases) {
            const secretKey = new ValidatorSecretKey(Buffer.from(keyHex, "hex"));
            assert.equal(secretKey.hex(), keyHex);
            assert.equal(secretKey.generatePublicKey().hex(), publicKeyHex);
            assert.equal(ValidatorSecretKey.fromPem(createPem(keyHex)).hex(), keyHex);
        }
    });

    it("should accept all the validator keys in the test wallets", async () => {
        const walletsPath = path.join("src", "testdata", "testwallets");

        for (const file of [
            "validatorKey00.pem",
            "validatorKey00WithExtraLines.pem",
            "validators.pem",
            "multipleValidatorKeys.pem",
        ]) {
            const text = fs.readFileSync(path.join(walletsPath, file), "utf-8");
            for (const pem of await ValidatorPEM.fromTextAll(text)) {
                assert.equal(pem.secretKey.generatePublicKey().hex(), pem.label, file);
            }
        }
    });
});
