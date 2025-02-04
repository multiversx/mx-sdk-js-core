import { assert } from "chai";
import { Account } from "../accounts";
import { getTestWalletsPath } from "../testutils/utils";
import { DEFAULT_MESSAGE_VERSION, SDK_JS_SIGNER, UNKNOWN_SIGNER } from "./constants";
import { Message, MessageComputer } from "./message";

describe("test message", () => {
    let alice: Account;
    const messageComputer = new MessageComputer();

    before(async function () {
        alice = await Account.newFromPem(`${getTestWalletsPath()}/alice.pem`);
    });

    it("should test message compute bytes for signing", async () => {
        const data = Buffer.from("test message");

        const message = new Message({
            data: data,
        });

        const serialized = messageComputer.computeBytesForSigning(message);

        assert.equal(
            Buffer.from(serialized).toString("hex"),
            "2162d6271208429e6d3e664139e98ba7c5f1870906fb113e8903b1d3f531004d",
        );
    });

    it("should create, sign, pack, unpack and verify message", async () => {
        const data = Buffer.from("test");

        const message = new Message({
            data: data,
            address: alice.address,
        });

        message.signature = await alice.signMessage(message);

        assert.equal(
            Buffer.from(message.signature).toString("hex"),
            "7aff43cd6e3d880a65033bf0a1b16274854fd7dfa9fe5faa7fa9a665ee851afd4c449310f5f1697d348e42d1819eaef69080e33e7652d7393521ed50d7427a0e",
        );

        const packedMessage = messageComputer.packMessage(message);
        assert.deepEqual(packedMessage, {
            address: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
            message: "74657374",
            signature:
                "7aff43cd6e3d880a65033bf0a1b16274854fd7dfa9fe5faa7fa9a665ee851afd4c449310f5f1697d348e42d1819eaef69080e33e7652d7393521ed50d7427a0e",
            version: 1,
            signer: SDK_JS_SIGNER,
        });

        const unpackedMessage = messageComputer.unpackMessage(packedMessage);
        assert.deepEqual(unpackedMessage.address, alice.address);
        assert.deepEqual(unpackedMessage.data, message.data);
        assert.deepEqual(unpackedMessage.signature, message.signature);
        assert.deepEqual(unpackedMessage.version, message.version);
        assert.deepEqual(unpackedMessage.signer, message.signer);

        const isValid = await alice.verifyMessageSignature(unpackedMessage, Buffer.from(unpackedMessage.signature!));
        assert.isTrue(isValid);
    });

    it("should unpack legacy message", async () => {
        const legacyMessage = {
            address: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
            message: "0x7468697320697320612074657374206d657373616765",
            signature:
                "0xb16847437049986f936dd4a0917c869730cbf29e40a0c0821ca70db33f44758c3d41bcbea446dee70dea13d50942343bb78e74979dc434bbb2b901e0f4fd1809",
            version: 1,
            signer: "ErdJS",
        };

        const message = messageComputer.unpackMessage(legacyMessage);
        assert.deepEqual(message.address, alice.address);
        assert.deepEqual(Buffer.from(message.data).toString(), "this is a test message");
        assert.deepEqual(
            Buffer.from(message.signature!).toString("hex"),
            "b16847437049986f936dd4a0917c869730cbf29e40a0c0821ca70db33f44758c3d41bcbea446dee70dea13d50942343bb78e74979dc434bbb2b901e0f4fd1809",
        );
        assert.deepEqual(message.version, DEFAULT_MESSAGE_VERSION);
        assert.equal(message.signer, "ErdJS");
    });

    it("should unpack message", async () => {
        const packedMessage = {
            address: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
            message: "0x7468697320697320612074657374206d657373616765",
            signature:
                "0xb16847437049986f936dd4a0917c869730cbf29e40a0c0821ca70db33f44758c3d41bcbea446dee70dea13d50942343bb78e74979dc434bbb2b901e0f4fd1809",
        };

        const message = messageComputer.unpackMessage(packedMessage);
        assert.deepEqual(message.address, alice.address);
        assert.deepEqual(Buffer.from(message.data).toString(), "this is a test message");
        assert.deepEqual(
            Buffer.from(message.signature!).toString("hex"),
            "b16847437049986f936dd4a0917c869730cbf29e40a0c0821ca70db33f44758c3d41bcbea446dee70dea13d50942343bb78e74979dc434bbb2b901e0f4fd1809",
        );
        assert.deepEqual(message.version, DEFAULT_MESSAGE_VERSION);
        assert.equal(message.signer, UNKNOWN_SIGNER);
    });
});
