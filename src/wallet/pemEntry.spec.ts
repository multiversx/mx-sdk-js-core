import { assert } from "chai";
import { readFileSync } from "fs";
import path from "path";
import { PemEntry } from "./pemEntry";
import { USER_SEED_LENGTH } from "./userKeys";

describe("test pem entry", () => {
    const walletsPath = path.join("src", "testdata", "testwallets");

    it("should create from text all", () => {
        let text = readFileSync(path.join(walletsPath, "alice.pem"), "utf-8");
        let entries = PemEntry.fromTextAll(text);
        let entry = entries[0];

        assert.lengthOf(entries, 1);
        assert.equal(entry.label, "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        assert.equal(
            Buffer.from(entry.message.slice(0, USER_SEED_LENGTH)).toString("hex"),
            "413f42575f7f26fad3317a778771212fdb80245850981e48b58a4f25e344e8f9",
        );

        text = readFileSync(path.join(walletsPath, "multipleUserKeys.pem"), "utf-8");
        entries = PemEntry.fromTextAll(text);
        entry = entries[0];

        assert.lengthOf(entries, 3);
        assert.equal(entry.label, "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        assert.equal(
            Buffer.from(entry.message.slice(0, USER_SEED_LENGTH)).toString("hex"),
            "413f42575f7f26fad3317a778771212fdb80245850981e48b58a4f25e344e8f9",
        );

        entry = entries[1];
        assert.equal(entry.label, "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx");
        assert.equal(
            Buffer.from(entry.message.slice(0, USER_SEED_LENGTH)).toString("hex"),
            "b8ca6f8203fb4b545a8e83c5384da033c415db155b53fb5b8eba7ff5a039d639",
        );

        entry = entries[2];
        assert.equal(entry.label, "erd1k2s324ww2g0yj38qn2ch2jwctdy8mnfxep94q9arncc6xecg3xaq6mjse8");
        assert.equal(
            Buffer.from(entry.message.slice(0, USER_SEED_LENGTH)).toString("hex"),
            "e253a571ca153dc2aee845819f74bcc9773b0586edead15a94cb7235a5027436",
        );
    });

    it("should create from text all for validators", () => {
        let text = readFileSync(path.join(walletsPath, "validatorKey00.pem"), "utf-8");
        let entries = PemEntry.fromTextAll(text);
        let entry = entries[0];

        assert.lengthOf(entries, 1);
        assert.equal(
            entry.label,
            "e7beaa95b3877f47348df4dd1cb578a4f7cabf7a20bfeefe5cdd263878ff132b765e04fef6f40c93512b666c47ed7719b8902f6c922c04247989b7137e837cc81a62e54712471c97a2ddab75aa9c2f58f813ed4c0fa722bde0ab718bff382208",
        );
        assert.equal(
            Buffer.from(entry.message.slice(0, USER_SEED_LENGTH)).toString("hex"),
            "7cff99bd671502db7d15bc8abc0c9a804fb925406fbdd50f1e4c17a4cd774247",
        );

        text = readFileSync(path.join(walletsPath, "multipleValidatorKeys.pem"), "utf-8");
        entries = PemEntry.fromTextAll(text);
        entry = entries[0];

        assert.lengthOf(entries, 4);
        assert.equal(
            entry.label,
            "f8910e47cf9464777c912e6390758bb39715fffcb861b184017920e4a807b42553f2f21e7f3914b81bcf58b66a72ab16d97013ae1cff807cefc977ef8cbf116258534b9e46d19528042d16ef8374404a89b184e0a4ee18c77c49e454d04eae8d",
        );
        assert.equal(
            Buffer.from(entry.message).toString("hex"),
            "7c19bf3a0c57cdd1fb08e4607cebaa3647d6b9261b4693f61e96e54b218d442a",
        );

        entry = entries[1];
        assert.equal(
            entry.label,
            "1b4e60e6d100cdf234d3427494dac55fbac49856cadc86bcb13a01b9bb05a0d9143e86c186c948e7ae9e52427c9523102efe9019a2a9c06db02993f2e3e6756576ae5a3ec7c235d548bc79de1a6990e1120ae435cb48f7fc436c9f9098b92a0d",
        );
        assert.equal(
            Buffer.from(entry.message).toString("hex"),
            "3034b1d58628a842984da0c70da0b5a251ebb2aebf51afc5b586e2839b5e5263",
        );

        entry = entries[2];
        assert.equal(
            entry.label,
            "e5dc552b4b170cdec4405ff8f9af20313bf0e2756d06c35877b6fbcfa6b354a7b3e2d439ea87999befb09a8fa1b3f014e57ec747bf738c4199338fcd4a87b373dd62f5c8329f1f5f245956bbb06685596a2e83dc38befa63e4a2b5c4ce408506",
        );
        assert.equal(
            Buffer.from(entry.message).toString("hex"),
            "de7e1b385edbb0e1e8f9fc25d91bd8eed71a1da7caab732e6b47a48042d8523d",
        );

        entry = entries[3];
        assert.equal(
            entry.label,
            "12773304cb718250edd89770cedcbf675ccdb7fe2b30bd3185ca65ffa0d516879768ed03f92e41a6e5bc5340b78a9d02655e3b727c79730ead791fb68eaa02b84e1be92a816a9604a1ab9a6d3874b638487e2145239438a4bafac3889348d405",
        );
        assert.equal(
            Buffer.from(entry.message).toString("hex"),
            "8ebeb07d296ad2529400b40687a741a135f8357f79f39fcb2894a6f9703a5816",
        );
    });

    it("should create from text all for validators with extra lines in pem file", () => {
        let text = readFileSync(path.join(walletsPath, "validatorKey00WithExtraLines.pem"), "utf-8");
        let entries = PemEntry.fromTextAll(text);
        let entry = entries[0];

        assert.lengthOf(entries, 1);
        assert.equal(
            entry.label,
            "e7beaa95b3877f47348df4dd1cb578a4f7cabf7a20bfeefe5cdd263878ff132b765e04fef6f40c93512b666c47ed7719b8902f6c922c04247989b7137e837cc81a62e54712471c97a2ddab75aa9c2f58f813ed4c0fa722bde0ab718bff382208",
        );
        assert.equal(
            Buffer.from(entry.message.slice(0, USER_SEED_LENGTH)).toString("hex"),
            "7cff99bd671502db7d15bc8abc0c9a804fb925406fbdd50f1e4c17a4cd774247",
        );

        text = readFileSync(path.join(walletsPath, "multipleValidatorKeys.pem"), "utf-8");
        entries = PemEntry.fromTextAll(text);
        entry = entries[0];

        assert.lengthOf(entries, 4);
        assert.equal(
            entry.label,
            "f8910e47cf9464777c912e6390758bb39715fffcb861b184017920e4a807b42553f2f21e7f3914b81bcf58b66a72ab16d97013ae1cff807cefc977ef8cbf116258534b9e46d19528042d16ef8374404a89b184e0a4ee18c77c49e454d04eae8d",
        );
        assert.equal(
            Buffer.from(entry.message).toString("hex"),
            "7c19bf3a0c57cdd1fb08e4607cebaa3647d6b9261b4693f61e96e54b218d442a",
        );

        entry = entries[1];
        assert.equal(
            entry.label,
            "1b4e60e6d100cdf234d3427494dac55fbac49856cadc86bcb13a01b9bb05a0d9143e86c186c948e7ae9e52427c9523102efe9019a2a9c06db02993f2e3e6756576ae5a3ec7c235d548bc79de1a6990e1120ae435cb48f7fc436c9f9098b92a0d",
        );
        assert.equal(
            Buffer.from(entry.message).toString("hex"),
            "3034b1d58628a842984da0c70da0b5a251ebb2aebf51afc5b586e2839b5e5263",
        );

        entry = entries[2];
        assert.equal(
            entry.label,
            "e5dc552b4b170cdec4405ff8f9af20313bf0e2756d06c35877b6fbcfa6b354a7b3e2d439ea87999befb09a8fa1b3f014e57ec747bf738c4199338fcd4a87b373dd62f5c8329f1f5f245956bbb06685596a2e83dc38befa63e4a2b5c4ce408506",
        );
        assert.equal(
            Buffer.from(entry.message).toString("hex"),
            "de7e1b385edbb0e1e8f9fc25d91bd8eed71a1da7caab732e6b47a48042d8523d",
        );

        entry = entries[3];
        assert.equal(
            entry.label,
            "12773304cb718250edd89770cedcbf675ccdb7fe2b30bd3185ca65ffa0d516879768ed03f92e41a6e5bc5340b78a9d02655e3b727c79730ead791fb68eaa02b84e1be92a816a9604a1ab9a6d3874b638487e2145239438a4bafac3889348d405",
        );
        assert.equal(
            Buffer.from(entry.message).toString("hex"),
            "8ebeb07d296ad2529400b40687a741a135f8357f79f39fcb2894a6f9703a5816",
        );
    });
    it("should convert to text", () => {
        let text = readFileSync(path.join(walletsPath, "alice.pem"), "utf-8").trim();
        assert.deepEqual(PemEntry.fromTextAll(text)[0].toText(), text);

        text = readFileSync(path.join(walletsPath, "validatorKey00.pem"), "utf-8").trim();
        assert.deepEqual(PemEntry.fromTextAll(text)[0].toText(), text);

        text = readFileSync(path.join(walletsPath, "multipleUserKeys.pem"), "utf-8").trim();
        let entries = PemEntry.fromTextAll(text);
        let actualText = entries.map((entry) => entry.toText()).join("\n");
        assert.deepEqual(actualText, text);

        text = readFileSync(path.join(walletsPath, "multipleValidatorKeys.pem"), "utf-8").trim();
        entries = PemEntry.fromTextAll(text);
        actualText = entries.map((entry) => entry.toText()).join("\n");
        assert.deepEqual(actualText, text);
    });
});
