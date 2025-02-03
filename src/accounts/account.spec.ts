import { assert } from "chai";
import { Address, Message, Transaction } from "../core";
import { getTestWalletsPath } from "../testutils/utils";
import { KeyPair, UserSecretKey } from "../wallet";
import { Account } from "./account";

describe("test account methods", function () {
    const DUMMY_MNEMONIC =
        "moral volcano peasant pass circle pen over picture flat shop clap goat never lyrics gather prepare woman film husband gravity behind test tiger improve";
    const alice = `${getTestWalletsPath()}/alice.pem`;
    it("should create account from pem file", async function () {
        const account = await Account.newFromPem(alice);

        assert.equal(
            account.secretKey.valueOf().toString("hex"),
            "413f42575f7f26fad3317a778771212fdb80245850981e48b58a4f25e344e8f9",
        );
        assert.equal(account.address.toBech32(), "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
    });

    it("should create account from keystore", async function () {
        const account = Account.newFromKeystore(`${getTestWalletsPath()}/withDummyMnemonic.json`, "password");

        assert.equal(
            account.secretKey.valueOf().toString("hex"),
            "413f42575f7f26fad3317a778771212fdb80245850981e48b58a4f25e344e8f9",
        );
        assert.equal(account.address.toBech32(), "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
    });

    it("should create account from mnemonic", async function () {
        const account = Account.newFromMnemonic(DUMMY_MNEMONIC);

        assert.equal(
            account.secretKey.valueOf().toString("hex"),
            "413f42575f7f26fad3317a778771212fdb80245850981e48b58a4f25e344e8f9",
        );
        assert.equal(account.address.toBech32(), "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
    });

    it("should create account from keypair", async function () {
        const secretKey = UserSecretKey.fromString("413f42575f7f26fad3317a778771212fdb80245850981e48b58a4f25e344e8f9");
        const keypair = new KeyPair(secretKey);
        const account = Account.newFromKeypair(keypair);

        assert.deepEqual(account.secretKey, secretKey);
        assert.equal(account.address.toBech32(), "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
    });

    it("should increase nonce on account", async function () {
        const account = Account.newFromMnemonic(DUMMY_MNEMONIC);
        account.nonce = 42n;

        assert.equal(account.getNonceThenIncrement(), 42n);
        assert.equal(account.getNonceThenIncrement(), 43n);
    });

    it("should sign transaction", async function () {
        const transaction = new Transaction({
            nonce: 89n,
            value: 0n,
            receiver: Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx"),
            sender: Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th"),
            gasPrice: 1000000000n,
            gasLimit: 50000n,
            data: new Uint8Array(),
            chainID: "local-testnet",
            version: 1,
            options: 0,
        });

        const account = Account.newFromMnemonic(DUMMY_MNEMONIC);
        transaction.signature = await account.signTransaction(transaction);

        assert.equal(
            Buffer.from(transaction.signature).toString("hex"),
            "b56769014f2bdc5cf9fc4a05356807d71fcf8775c819b0f1b0964625b679c918ffa64862313bfef86f99b38cb84fcdb16fa33ad6eb565276616723405cd8f109",
        );
    });

    it("should sign message", async function () {
        const message = new Message({
            data: new Uint8Array(Buffer.from("hello")),
        });

        const account = Account.newFromMnemonic(DUMMY_MNEMONIC);
        message.signature = await account.signMessage(message);

        assert.equal(
            Buffer.from(message.signature).toString("hex"),
            "561bc58f1dc6b10de208b2d2c22c9a474ea5e8cabb59c3d3ce06bbda21cc46454aa71a85d5a60442bd7784effa2e062fcb8fb421c521f898abf7f5ec165e5d0f",
        );
    });

    it("should verify message", async function () {
        const message = new Message({
            data: new Uint8Array(Buffer.from("hello")),
        });

        const account = Account.newFromMnemonic(DUMMY_MNEMONIC);
        message.signature = await account.signMessage(message);
        const isVerified = await account.verifyMessageSignature(message, message.signature);

        assert.isTrue(isVerified);
    });

    it("should sign and verify transaction", async function () {
        const transaction = new Transaction({
            nonce: 89n,
            value: 0n,
            receiver: Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx"),
            sender: Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th"),
            gasPrice: 1000000000n,
            gasLimit: 50000n,
            data: new Uint8Array(),
            chainID: "local-testnet",
            version: 1,
            options: 0,
        });

        const account = Account.newFromMnemonic(DUMMY_MNEMONIC);
        transaction.signature = await account.signTransaction(transaction);

        assert.equal(
            Buffer.from(transaction.signature).toString("hex"),
            "b56769014f2bdc5cf9fc4a05356807d71fcf8775c819b0f1b0964625b679c918ffa64862313bfef86f99b38cb84fcdb16fa33ad6eb565276616723405cd8f109",
        );

        const isVerified = await account.verifyTransactionSignature(transaction, transaction.signature);
        assert.isTrue(isVerified);
    });
});
