import { Buffer } from "buffer";
import { assert } from "chai";
import { ErrBadPEM } from "../core/errors";
import { loadTestWallet, TestWallet } from "./../testutils/wallets";
import { parse, parseUserKey, parseValidatorKey } from "./pem";
import { BLS } from "./validatorKeys";

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
