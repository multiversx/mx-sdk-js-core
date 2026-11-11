import { assert } from "chai";
import * as fs from "fs";
import path from "path";
import { ErrInvariantFailed } from "../core/errors";
import { getTestWalletsPath } from "../testutils";
import { BLS, ValidatorSecretKey } from "./validatorKeys";
import { ValidatorPEM } from "./validatorPem";

describe("test ValidatorPEMs", () => {
    const walletsPath = path.join("src", "testdata", "testwallets");
    const pemPath = `${getTestWalletsPath()}/validatorKey00.pem`;
    const savedPath = pemPath.replace(".pem", "-saved.pem");

    afterEach(() => {
        if (fs.existsSync(savedPath)) {
            fs.unlinkSync(savedPath); // cleanup
        }
    });

    it("should save pem from file", async function () {
        const contentExpected = fs.readFileSync(pemPath, "utf-8").trim();

        // fromFile is async → await
        const pem = await ValidatorPEM.fromFile(pemPath);
        pem.save(savedPath);

        const contentActual = fs.readFileSync(savedPath, "utf-8").trim();
        assert.deepEqual(contentActual, contentExpected);
    });

    it("should create from text all", async function () {
        let text = fs.readFileSync(path.join(walletsPath, "validatorKey00.pem"), "utf-8");

        let entries = await ValidatorPEM.fromTextAll(text);
        let entry = entries[0];

        assert.lengthOf(entries, 1);
        assert.equal(
            entry.label,
            "e7beaa95b3877f47348df4dd1cb578a4f7cabf7a20bfeefe5cdd263878ff132b765e04fef6f40c93512b666c47ed7719b8902f6c922c04247989b7137e837cc81a62e54712471c97a2ddab75aa9c2f58f813ed4c0fa722bde0ab718bff382208",
        );
        assert.equal(entry.secretKey.hex(), "7cff99bd671502db7d15bc8abc0c9a804fb925406fbdd50f1e4c17a4cd774247");

        text = fs.readFileSync(path.join(walletsPath, "validators.pem"), "utf-8");
        entries = await ValidatorPEM.fromTextAll(text);
        entry = entries[0];

        assert.lengthOf(entries, 2);
        assert.equal(
            entry.label,
            "f8910e47cf9464777c912e6390758bb39715fffcb861b184017920e4a807b42553f2f21e7f3914b81bcf58b66a72ab16d97013ae1cff807cefc977ef8cbf116258534b9e46d19528042d16ef8374404a89b184e0a4ee18c77c49e454d04eae8d",
        );
        assert.equal(entry.secretKey.hex(), "7c19bf3a0c57cdd1fb08e4607cebaa3647d6b9261b4693f61e96e54b218d442a");

        entry = entries[1];
        assert.equal(
            entry.label,
            "1b4e60e6d100cdf234d3427494dac55fbac49856cadc86bcb13a01b9bb05a0d9143e86c186c948e7ae9e52427c9523102efe9019a2a9c06db02993f2e3e6756576ae5a3ec7c235d548bc79de1a6990e1120ae435cb48f7fc436c9f9098b92a0d",
        );
        assert.equal(entry.secretKey.hex(), "3034b1d58628a842984da0c70da0b5a251ebb2aebf51afc5b586e2839b5e5263");
    });

    it("should load the entry at the given index (by default, the first one)", async function () {
        const multiplePath = path.join(walletsPath, "multipleValidatorKeys.pem");
        const text = fs.readFileSync(multiplePath, "utf-8");
        const expectedSecretKeys = [
            "7c19bf3a0c57cdd1fb08e4607cebaa3647d6b9261b4693f61e96e54b218d442a",
            "3034b1d58628a842984da0c70da0b5a251ebb2aebf51afc5b586e2839b5e5263",
            "de7e1b385edbb0e1e8f9fc25d91bd8eed71a1da7caab732e6b47a48042d8523d",
            "8ebeb07d296ad2529400b40687a741a135f8357f79f39fcb2894a6f9703a5816",
        ];

        assert.equal((await ValidatorPEM.fromFile(multiplePath)).secretKey.hex(), expectedSecretKeys[0]);
        assert.equal((await ValidatorPEM.fromText(text)).secretKey.hex(), expectedSecretKeys[0]);

        const all = await ValidatorPEM.fromFileAll(multiplePath);
        assert.lengthOf(all, 4);
        assert.deepEqual(
            all.map((item) => item.secretKey.hex()),
            expectedSecretKeys,
        );

        for (const [index, secretKeyHex] of expectedSecretKeys.entries()) {
            const fromFile = await ValidatorPEM.fromFile(multiplePath, index);
            const fromText = await ValidatorPEM.fromText(text, index);

            assert.equal(fromFile.secretKey.hex(), secretKeyHex);
            assert.equal(fromText.secretKey.hex(), secretKeyHex);

            // In the test files, the label of an entry is the public key.
            assert.equal(fromFile.label, fromFile.secretKey.generatePublicKey().hex());
            assert.equal(fromText.label, all[index].label);
        }
    });

    it("should load nothing from an empty text", async function () {
        assert.deepEqual(await ValidatorPEM.fromTextAll(""), []);
    });

    it("should reject entries that don't hold a validator key", async function () {
        const userKeyError = await ValidatorPEM.fromFile(path.join(walletsPath, "alice.pem")).catch((err) => err);
        assert.instanceOf(userKeyError, ErrInvariantFailed);
        assert.include(userKeyError.message, "wrong length, expected: 32, actual: 64");

        const shortKey = `-----BEGIN PRIVATE KEY for foo-----\n${Buffer.from("aabb").toString("base64")}\n-----END PRIVATE KEY for foo-----`;
        const shortKeyError = await ValidatorPEM.fromText(shortKey).catch((err) => err);
        assert.instanceOf(shortKeyError, ErrInvariantFailed);
    });

    it("should create the text from a label and a secret key", async function () {
        await BLS.initIfNecessary();

        const expectedText = fs.readFileSync(pemPath, "utf-8").trim();
        const secretKey = new ValidatorSecretKey(
            Buffer.from("7cff99bd671502db7d15bc8abc0c9a804fb925406fbdd50f1e4c17a4cd774247", "hex"),
        );
        const pem = new ValidatorPEM(secretKey.generatePublicKey().hex(), secretKey);

        assert.equal(pem.toText(), expectedText);

        // Round-trip.
        const loaded = await ValidatorPEM.fromText(pem.toText());
        assert.equal(loaded.label, pem.label);
        assert.equal(loaded.secretKey.hex(), secretKey.hex());
        assert.equal(loaded.secretKey.generatePublicKey().hex(), pem.label);
        assert.deepEqual(loaded.secretKey.sign(Buffer.from("hello")), secretKey.sign(Buffer.from("hello")));
    });

    it("should convert to text", async function () {
        let text = fs.readFileSync(path.join(walletsPath, "validatorKey00.pem"), "utf-8").trim();
        const entry = await ValidatorPEM.fromTextAll(text);
        assert.deepEqual(entry[0].toText(), text);

        text = fs.readFileSync(path.join(walletsPath, "multipleValidatorKeys.pem"), "utf-8").trim();
        const entries = await ValidatorPEM.fromTextAll(text);
        const actualText = entries.map((entry) => entry.toText()).join("\n");
        assert.deepEqual(actualText, text);
    });
});
