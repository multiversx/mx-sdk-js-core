import { assert } from "chai";
import * as fs from "fs";
import path from "path";
import { getTestWalletsPath } from "../testutils";
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
