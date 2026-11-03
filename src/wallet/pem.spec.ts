import { Buffer } from "buffer";
import { assert } from "chai";
import * as fs from "fs";
import path from "path";
import { Account } from "../accounts";
import { Address } from "../core/address";
import { ErrBadPEM, ErrInvalidArgument } from "../core/errors";
import { loadTestWallet, TestWallet } from "./../testutils/wallets";
import { parse, parseUserKey, parseValidatorKey, parseValidatorKeys } from "./pem";
import { PemEntry } from "./pemEntry";
import { UserSecretKey } from "./userKeys";
import { UserPem } from "./userPem";
import { UserSigner } from "./userSigner";
import { BLS, ValidatorSecretKey } from "./validatorKeys";
import { ValidatorPEM } from "./validatorPem";

describe("test PEMs", () => {
    let alice: TestWallet, bob: TestWallet, carol: TestWallet;

    before(async function () {
        alice = await loadTestWallet("alice");
        bob = await loadTestWallet("bob");
        carol = await loadTestWallet("carol");
    });

    it("should parseUserKey", () => {
        let aliceKey = parseUserKey(alice.pemFileText);

        assert.equal(aliceKey.hex(), alice.secretKeyHex);
        assert.equal(aliceKey.generatePublicKey().toAddress().toBech32(), alice.address.toBech32());
    });

    it("should parseValidatorKey", async () => {
        await BLS.initIfNecessary();

        let pem = `-----BEGIN PRIVATE KEY for e7beaa95b3877f47348df4dd1cb578a4f7cabf7a20bfeefe5cdd263878ff132b765e04fef6f40c93512b666c47ed7719b8902f6c922c04247989b7137e837cc81a62e54712471c97a2ddab75aa9c2f58f813ed4c0fa722bde0ab718bff382208-----
N2NmZjk5YmQ2NzE1MDJkYjdkMTViYzhhYmMwYzlhODA0ZmI5MjU0MDZmYmRkNTBm
MWU0YzE3YTRjZDc3NDI0Nw==
-----END PRIVATE KEY for e7beaa95b3877f47348df4dd1cb578a4f7cabf7a20bfeefe5cdd263878ff132b765e04fef6f40c93512b666c47ed7719b8902f6c922c04247989b7137e837cc81a62e54712471c97a2ddab75aa9c2f58f813ed4c0fa722bde0ab718bff382208-----`;

        let validatorKey = parseValidatorKey(pem);

        assert.equal(validatorKey.hex(), "7cff99bd671502db7d15bc8abc0c9a804fb925406fbdd50f1e4c17a4cd774247");
        assert.equal(
            validatorKey.generatePublicKey().hex(),
            "e7beaa95b3877f47348df4dd1cb578a4f7cabf7a20bfeefe5cdd263878ff132b765e04fef6f40c93512b666c47ed7719b8902f6c922c04247989b7137e837cc81a62e54712471c97a2ddab75aa9c2f58f813ed4c0fa722bde0ab718bff382208",
        );
    });

    it("should parse multi-key PEM files", () => {
        // The user PEM files encode both the seed and the pubkey in their payloads.
        let payloadAlice = Buffer.from(alice.secretKeyHex + alice.address.toHex()).toString("base64");
        let payloadBob = Buffer.from(bob.secretKeyHex + bob.address.toHex()).toString("base64");
        let payloadCarol = Buffer.from(carol.secretKeyHex + carol.address.toHex()).toString("base64");

        let expected = [
            Buffer.concat([alice.secretKey, alice.address.getPublicKey()]),
            Buffer.concat([bob.secretKey, bob.address.getPublicKey()]),
            Buffer.concat([carol.secretKey, carol.address.getPublicKey()]),
        ];

        let trivialContent = `-----BEGIN PRIVATE KEY for alice
${payloadAlice}
-----END PRIVATE KEY for alice
-----BEGIN PRIVATE KEY for bob
${payloadBob}
-----END PRIVATE KEY for bob
-----BEGIN PRIVATE KEY for carol
${payloadCarol}
-----END PRIVATE KEY for carol
`;

        assert.deepEqual(parse(trivialContent, 64), expected);

        let contentWithWhitespaces = `
-----BEGIN PRIVATE KEY for alice
        ${payloadAlice}
        -----END PRIVATE KEY for alice

        -----BEGIN PRIVATE KEY for bob
        ${payloadBob}
        -----END PRIVATE KEY for bob
        -----BEGIN PRIVATE KEY for carol


        ${payloadCarol}
        -----END PRIVATE KEY for carol
        `;

        assert.deepEqual(parse(contentWithWhitespaces, 64), expected);
    });

    it("should report parsing errors", () => {
        let contentWithoutEnd = `-----BEGIN PRIVATE KEY for alice
        NDEzZjQyNTc1ZjdmMjZmYWQzMzE3YTc3ODc3MTIxMmZkYjgwMjQ1ODUwOTgxZTQ4
        YjU4YTRmMjVlMzQ0ZThmOTAxMzk0NzJlZmY2ODg2NzcxYTk4MmYzMDgzZGE1ZDQy
        MWYyNGMyOTE4MWU2Mzg4ODIyOGRjODFjYTYwZDY5ZTE=`;

        assert.throw(() => parseUserKey(contentWithoutEnd), ErrBadPEM);

        let contentWithBadData = `-----BEGIN PRIVATE KEY for alice
        NDEzZjQyNTc1ZjdmMjZmYWQzMzE3YTc3ODc3MTIxMmZkYjgwMjQ1ODUwOTgxZTQ4
        YjU4YTRmMjVlMzQ0ZThmOTAxMzk0NzJlZmY2ODg2NzcxYTk4MmYzMDgzZGE1Zfoo
        -----END PRIVATE KEY for alice`;

        assert.throw(() => parseUserKey(contentWithBadData), ErrBadPEM);
    });
});

describe("test PEM validation", () => {
    let alice: TestWallet, bob: TestWallet;
    const walletsPath = path.join("src", "testdata", "testwallets");

    before(async function () {
        alice = await loadTestWallet("alice");
        bob = await loadTestWallet("bob");
    });

    function createEntry(label: string, messageHex: string, footerLabel: string = label): string {
        const body = Buffer.from(messageHex).toString("base64");
        return `-----BEGIN PRIVATE KEY for ${label}-----\n${body}\n-----END PRIVATE KEY for ${footerLabel}-----`;
    }

    // Both "UserSecretKey.fromPem()" (and the functions built on it) and "UserPem" use the same parser.
    function loadUserKeyInAllWays(text: string, index: number = 0): string[] {
        return [
            parseUserKey(text, index).hex(),
            UserSecretKey.fromPem(text, index).hex(),
            UserSigner.fromPem(text, index).secretKey.hex(),
            UserPem.fromText(text, index).secretKey.hex(),
        ];
    }

    function assertRejectedInAllWays(text: string, errorType: any, message: string, index: number = 0) {
        assert.throws(() => parseUserKey(text, index), errorType, message);
        assert.throws(() => UserSecretKey.fromPem(text, index), errorType, message);
        assert.throws(() => UserSigner.fromPem(text, index), errorType, message);
        assert.throws(() => UserPem.fromText(text, index), errorType, message);
    }

    it("should load all test wallets, in all ways", () => {
        for (const file of fs.readdirSync(walletsPath).filter((file) => file.endsWith(".pem"))) {
            const text = fs.readFileSync(path.join(walletsPath, file), "utf-8");

            if (file.toLowerCase().includes("validator")) {
                assert.deepEqual(parseValidatorKeys(text).length, PemEntry.fromTextAll(text).length, file);
                continue;
            }

            const entries = PemEntry.fromTextAll(text);
            for (let i = 0; i < entries.length; i++) {
                const expected = Buffer.from(entries[i].message.slice(0, 32)).toString("hex");
                assert.deepEqual(loadUserKeyInAllWays(text, i), Array(4).fill(expected), file);
            }
        }
    });

    it("should reject an index out of range", async () => {
        const text = alice.pemFileText + "\n" + bob.pemFileText;
        assert.deepEqual(loadUserKeyInAllWays(text, 1), Array(4).fill(bob.secretKeyHex));

        for (const index of [2, 100, -1, 0.5, NaN]) {
            assertRejectedInAllWays(text, ErrInvalidArgument, `PEM entry index ${index} is out of range`, index);
        }

        assertRejectedInAllWays("", ErrInvalidArgument, "PEM entry index 0 is out of range (number of entries: 0)");
        assert.throws(() => UserPem.fromFile(path.join(walletsPath, "alice.pem"), 1), ErrInvalidArgument);

        const error = await Account.newFromPem(path.join(walletsPath, "alice.pem"), 1).catch((err) => err);
        assert.instanceOf(error, ErrInvalidArgument);
    });

    it("should reject a validator key index out of range", async () => {
        await BLS.initIfNecessary();

        const text = fs.readFileSync(path.join(walletsPath, "multipleValidatorKeys.pem"), "utf-8");
        assert.equal((await ValidatorPEM.fromText(text, 3)).secretKey.hex(), parseValidatorKey(text, 3).hex());

        for (const index of [4, -1]) {
            assert.throws(() => parseValidatorKey(text, index), ErrInvalidArgument);
            assert.throws(() => ValidatorSecretKey.fromPem(text, index), ErrInvalidArgument);

            const error = await ValidatorPEM.fromText(text, index).catch((err) => err);
            assert.instanceOf(error, ErrInvalidArgument);
        }
    });

    it("should reject a label (address) that does not match the secret key", () => {
        const text = createEntry(bob.address.toBech32(), alice.secretKeyHex + alice.address.toHex());
        assertRejectedInAllWays(text, ErrBadPEM, "the label (address) does not match the secret key");
    });

    it("should accept labels that aren't addresses, and addresses with a custom HRP", () => {
        for (const label of [
            "alice",
            "my key",
            "my-label",
            alice.address.toHex(),
            new Address(alice.address.getPublicKey(), "test").toBech32(),
        ]) {
            const text = createEntry(label, alice.secretKeyHex + alice.address.toHex());
            assert.deepEqual(loadUserKeyInAllWays(text), Array(4).fill(alice.secretKeyHex), label);
            assert.equal(UserPem.fromText(text).label, label);
        }
    });

    it("should reject an embedded public key that does not match the secret key", () => {
        const text = createEntry(alice.address.toBech32(), alice.secretKeyHex + bob.address.toHex());
        assertRejectedInAllWays(text, ErrBadPEM, "the embedded public key does not match the secret key");
    });

    it("should accept a message holding the secret key only", () => {
        const text = createEntry(alice.address.toBech32(), alice.secretKeyHex);
        assert.deepEqual(loadUserKeyInAllWays(text), Array(4).fill(alice.secretKeyHex));
    });

    it("should reject a message of unexpected length", () => {
        for (const messageHex of [
            alice.secretKeyHex.slice(0, 32),
            alice.secretKeyHex + "00",
            alice.secretKeyHex + alice.address.toHex() + alice.address.toHex(),
        ]) {
            const text = createEntry("alice", messageHex);
            assertRejectedInAllWays(
                text,
                ErrBadPEM,
                `incorrect key length: expected 32 or 64, found ${messageHex.length / 2}`,
            );
        }
    });

    it("should reject content that is not properly encoded", () => {
        const goodBody = Buffer.from(alice.secretKeyHex + alice.address.toHex()).toString("base64");
        const nonHexBody = Buffer.from(alice.secretKeyHex + "zz" + alice.address.toHex().slice(2)).toString("base64");

        for (const body of [goodBody.slice(0, 10) + "!!" + goodBody.slice(12), goodBody.slice(0, -1), nonHexBody]) {
            const text = `-----BEGIN PRIVATE KEY for alice-----\n${body}\n-----END PRIVATE KEY for alice-----`;
            assertRejectedInAllWays(text, ErrBadPEM, "the content of an entry is not properly encoded");
        }
    });

    it("should reject a bad structure", () => {
        const entry = createEntry("alice", alice.secretKeyHex + alice.address.toHex());
        const [header, body, footer] = entry.split("\n");

        const cases: [string, string][] = [
            ["hello\n" + entry, "unexpected line outside of an entry"],
            [entry + "\nhello", "unexpected line outside of an entry"],
            [
                createEntry("alice", alice.secretKeyHex + alice.address.toHex(), "bob"),
                "the END line does not match the BEGIN line",
            ],
            [`-----BEGIN foo\n${body}\n-----END bar`, "the END line does not match the BEGIN line"],
            [`${header}\n${body}`, "missing END line"],
            [`${header}\n${body}\n${header}\n${body}\n${footer}`, "missing END line"],
            [`${body}\n${footer}`, "unexpected line outside of an entry"],
            [footer, "missing BEGIN line"],
            [`${header}\n${footer}`, "an entry has no content"],
        ];

        for (const [text, message] of cases) {
            assertRejectedInAllWays(text, ErrBadPEM, message);
        }
    });

    it("should be lenient, as before, with respect to whitespace, line endings and delimiters", () => {
        const texts = [
            alice.pemFileText.replace(/\n/g, "\r\n"),
            alice.pemFileText.replace(/-----$/gm, "---"),
            "\n\n   " + alice.pemFileText.split("\n").join("\n\n   ") + "\n\n",
        ];

        for (const text of texts) {
            assert.deepEqual(loadUserKeyInAllWays(text), Array(4).fill(alice.secretKeyHex));
        }
    });

    it("should accept any kind of entry (e.g. 'BEGIN foobar'), as 'fromPem()' did before", () => {
        const text = alice.pemFileText.replace(/(BEGIN|END) PRIVATE KEY for erd1\w+/g, "$1 foobar");

        assert.deepEqual(loadUserKeyInAllWays(text), Array(4).fill(alice.secretKeyHex));
        assert.equal(UserPem.fromText(text).label, "foobar");
    });

    it("should refuse to write labels that would break the structure of the file", () => {
        const secretKey = UserSecretKey.fromString(alice.secretKeyHex);

        for (const label of [
            "x-----\n-----BEGIN PRIVATE KEY for " + bob.address.toBech32(),
            "my-----label",
            "a\nb",
            "a\rb",
        ]) {
            assert.throws(
                () => new UserPem(label, secretKey).toText(),
                ErrBadPEM,
                "the label must not contain line breaks or '-----'",
            );
            assert.throws(() => new PemEntry(label, Buffer.alloc(32)).toText(), ErrBadPEM);
        }

        const text = new UserPem("my-label", secretKey).toText();
        assert.equal(UserPem.fromText(text).label, "my-label");
    });
});
