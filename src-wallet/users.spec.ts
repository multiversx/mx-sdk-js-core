import { assert } from "chai";
import { Randomness } from "./crypto";
import { ErrInvariantFailed } from "./errors";
import { Mnemonic } from "./mnemonic";
import { TestMessage } from "./testutils/message";
import { TestTransaction } from "./testutils/transaction";
import { DummyMnemonic, DummyMnemonicOf12Words, DummyPassword, loadTestWallet, TestWallet } from "./testutils/wallets";
import { UserAddress } from "./userAddress";
import { UserSecretKey } from "./userKeys";
import { UserSigner } from "./userSigner";
import { UserVerifier } from "./userVerifier";
import { EnvelopeVersion, UserWallet } from "./userWallet";

describe("test user wallets", () => {
    let alice: TestWallet, bob: TestWallet, carol: TestWallet;
    let password: string = DummyPassword;

    before(async function () {
        alice = await loadTestWallet("alice");
        bob = await loadTestWallet("bob");
        carol = await loadTestWallet("carol");
    });

    it("should generate mnemonic", () => {
        let mnemonic = Mnemonic.generate();
        let words = mnemonic.getWords();
        assert.lengthOf(words, 24);
    });

    it("should derive keys", async () => {
        let mnemonic = Mnemonic.fromString(DummyMnemonic);

        assert.equal(mnemonic.deriveKey(0).hex(), alice.secretKeyHex);
        assert.equal(mnemonic.deriveKey(1).hex(), bob.secretKeyHex);
        assert.equal(mnemonic.deriveKey(2).hex(), carol.secretKeyHex);
    });

    it("should derive keys (12 words)", async () => {
        const mnemonic = Mnemonic.fromString(DummyMnemonicOf12Words);

        assert.equal(mnemonic.deriveKey(0).generatePublicKey().toAddress().bech32(), "erd1l8g9dk3gz035gkjhwegsjkqzdu3augrwhcfxrnucnyyrpc2220pqg4g7na");
        assert.equal(mnemonic.deriveKey(1).generatePublicKey().toAddress().bech32(), "erd1fmhwg84rldg0xzngf53m0y607wvefvamh07n2mkypedx27lcqnts4zs09p");
        assert.equal(mnemonic.deriveKey(2).generatePublicKey().toAddress().bech32(), "erd1tyuyemt4xz2yjvc7rxxp8kyfmk2n3h8gv3aavzd9ru4v2vhrkcksptewtj");
    });

    it("should create secret key", () => {
        let keyHex = alice.secretKeyHex;
        let fromBuffer = new UserSecretKey(Buffer.from(keyHex, "hex"));
        let fromHex = UserSecretKey.fromString(keyHex);

        assert.equal(fromBuffer.hex(), keyHex);
        assert.equal(fromHex.hex(), keyHex);
    });

    it("should compute public key (and address)", () => {
        let secretKey: UserSecretKey;

        secretKey = new UserSecretKey(Buffer.from(alice.secretKeyHex, "hex"));
        assert.equal(secretKey.generatePublicKey().hex(), alice.address.hex());
        assert.deepEqual(secretKey.generatePublicKey().toAddress(), alice.address);

        secretKey = new UserSecretKey(Buffer.from(bob.secretKeyHex, "hex"));
        assert.equal(secretKey.generatePublicKey().hex(), bob.address.hex());
        assert.deepEqual(secretKey.generatePublicKey().toAddress(), bob.address);

        secretKey = new UserSecretKey(Buffer.from(carol.secretKeyHex, "hex"));
        assert.equal(secretKey.generatePublicKey().hex(), carol.address.hex());
        assert.deepEqual(secretKey.generatePublicKey().toAddress(), carol.address);
    });

    it("should throw error when invalid input", () => {
        assert.throw(() => new UserSecretKey(Buffer.alloc(42)), ErrInvariantFailed);
        assert.throw(() => UserSecretKey.fromString("foobar"), ErrInvariantFailed);
    });

    it("should handle PEM files", () => {
        assert.equal(UserSecretKey.fromPem(alice.pemFileText).hex(), alice.secretKeyHex);
        assert.equal(UserSecretKey.fromPem(bob.pemFileText).hex(), bob.secretKeyHex);
        assert.equal(UserSecretKey.fromPem(carol.pemFileText).hex(), carol.secretKeyHex);
    });

    it("should create and load keystore files (with secret keys)", function () {
        this.timeout(10000);

        let aliceSecretKey = UserSecretKey.fromString(alice.secretKeyHex);
        let bobSecretKey = UserSecretKey.fromString(bob.secretKeyHex);
        let carolSecretKey = UserSecretKey.fromString(carol.secretKeyHex);

        console.time("encrypt");
        let aliceKeyFile = UserWallet.fromSecretKey({ secretKey: aliceSecretKey, password: password });
        let bobKeyFile = UserWallet.fromSecretKey({ secretKey: bobSecretKey, password: password });
        let carolKeyFile = UserWallet.fromSecretKey({ secretKey: carolSecretKey, password: password });
        console.timeEnd("encrypt");

        assert.equal(aliceKeyFile.toJSON().bech32, alice.address.bech32());
        assert.equal(bobKeyFile.toJSON().bech32, bob.address.bech32());
        assert.equal(carolKeyFile.toJSON().bech32, carol.address.bech32());

        console.time("decrypt");
        assert.deepEqual(UserWallet.decryptSecretKey(aliceKeyFile.toJSON(), password), aliceSecretKey);
        assert.deepEqual(UserWallet.decryptSecretKey(bobKeyFile.toJSON(), password), bobSecretKey);
        assert.deepEqual(UserWallet.decryptSecretKey(carolKeyFile.toJSON(), password), carolSecretKey);
        console.timeEnd("decrypt");

        // With provided randomness, in order to reproduce our development wallets

        aliceKeyFile = UserWallet.fromSecretKey({
            secretKey: aliceSecretKey,
            password: password,
            randomness: new Randomness({
                id: alice.keyFileObject.id,
                iv: Buffer.from(alice.keyFileObject.crypto.cipherparams.iv, "hex"),
                salt: Buffer.from(alice.keyFileObject.crypto.kdfparams.salt, "hex")
            })
        });

        bobKeyFile = UserWallet.fromSecretKey({
            secretKey: bobSecretKey,
            password: password,
            randomness: new Randomness({
                id: bob.keyFileObject.id,
                iv: Buffer.from(bob.keyFileObject.crypto.cipherparams.iv, "hex"),
                salt: Buffer.from(bob.keyFileObject.crypto.kdfparams.salt, "hex")
            })
        });

        carolKeyFile = UserWallet.fromSecretKey({
            secretKey: carolSecretKey,
            password: password,
            randomness: new Randomness({
                id: carol.keyFileObject.id,
                iv: Buffer.from(carol.keyFileObject.crypto.cipherparams.iv, "hex"),
                salt: Buffer.from(carol.keyFileObject.crypto.kdfparams.salt, "hex")
            })
        });

        assert.deepEqual(aliceKeyFile.toJSON(), alice.keyFileObject);
        assert.deepEqual(bobKeyFile.toJSON(), bob.keyFileObject);
        assert.deepEqual(carolKeyFile.toJSON(), carol.keyFileObject);
    });

    it("should create and load keystore files both as V4 and V5", function () {
        this.timeout(10000);

        const aliceSecretKey = UserSecretKey.fromString(alice.secretKeyHex);
        const walletV4 = UserWallet.fromSecretKey({ secretKey: aliceSecretKey, password: password });
        const walletV5 = UserWallet.fromSecretKey({ envelopeVersion: EnvelopeVersion.V5, secretKey: aliceSecretKey, password: password });
        const jsonV4 = walletV4.toJSON();
        const jsonV5 = walletV5.toJSON();

        assert.equal(jsonV4.version, 4);
        assert.isUndefined(jsonV4.kind);
        assert.equal(jsonV4.bech32, alice.address.bech32());

        assert.equal(jsonV5.version, 5);
        assert.equal(jsonV5.kind, "secretKey");
        assert.equal(jsonV5.bech32, alice.address.bech32());

        const secretKeyV4 = UserWallet.decryptSecretKey(jsonV4, password);
        const secretKeyV5 = UserWallet.decryptSecretKey(jsonV5, password);
        assert.equal(secretKeyV4.hex(), alice.secretKeyHex);
        assert.equal(secretKeyV5.hex(), alice.secretKeyHex);
    });

    it("should create and load keystore files (with mnemonics)", function () {
        this.timeout(10000);

        const wallet = UserWallet.fromMnemonic({ mnemonic: DummyMnemonic, password: password });
        const json = wallet.toJSON();

        assert.equal(json.version, 5);
        assert.equal(json.kind, "mnemonic");
        assert.isUndefined(json.bech32);

        const mnemonicText = UserWallet.decryptMnemonic(json, password);
        const mnemonic = Mnemonic.fromString(mnemonicText);

        assert.equal(mnemonicText, DummyMnemonic);
        assert.equal(mnemonic.deriveKey(0).generatePublicKey().toAddress().bech32(), alice.address.bech32());
        assert.equal(mnemonic.deriveKey(1).generatePublicKey().toAddress().bech32(), bob.address.bech32());
        assert.equal(mnemonic.deriveKey(2).generatePublicKey().toAddress().bech32(), carol.address.bech32());
    });

    it("should create and load keystore files (with arbitrary data)", function () {
        const data = Buffer.from("hello");
        const wallet = UserWallet.fromArbitrary({ arbitraryData: data, password: password });
        const json = wallet.toJSON();

        assert.equal(json.version, 5);
        assert.equal(json.kind, "arbitrary");
        assert.isUndefined(json.bech32);

        const decryptedData = UserWallet.decryptArbitrary(json, password);
        assert.deepEqual(decryptedData, data);
    });

    it("should fail if using bad versions", function () {
        const aliceSecretKey = UserSecretKey.fromString(alice.secretKeyHex);

        assert.throws(() => UserWallet.fromSecretKey({ envelopeVersion: 7, secretKey: aliceSecretKey, password: password }), "Envelope version must be one of: [4, 5].");
        assert.throws(() => UserWallet.fromMnemonic({ envelopeVersion: 4, mnemonic: DummyMnemonic, password: password }), "Envelope version must be one of: [5].");
        assert.throws(() => UserWallet.fromArbitrary({ envelopeVersion: 4, arbitraryData: Buffer.from(""), password: password }), "Envelope version must be one of: [5].");

        assert.throws(() => UserWallet.decryptSecretKey({ version: 3, crypto: {} }, password), "Envelope version must be one of: [4, 5].");
        assert.throws(() => UserWallet.decryptMnemonic({ version: 6, crypto: {} }, password), "Envelope version must be one of: [5].");
        assert.throws(() => UserWallet.decryptArbitrary({ version: 7, crypto: {} }, password), "Envelope version must be one of: [5].");
    });

    it("should sign transactions", async () => {
        let signer = new UserSigner(UserSecretKey.fromString("1a927e2af5306a9bb2ea777f73e06ecc0ac9aaa72fb4ea3fecf659451394cccf"));
        let verifier = new UserVerifier(UserSecretKey.fromString("1a927e2af5306a9bb2ea777f73e06ecc0ac9aaa72fb4ea3fecf659451394cccf").generatePublicKey());
        let sender = UserAddress.fromBech32("erd1l453hd0gt5gzdp7czpuall8ggt2dcv5zwmfdf3sd3lguxseux2fsmsgldz");

        // With data field
        let transaction = new TestTransaction({
            nonce: 0,
            value: "0",
            receiver: "erd1cux02zersde0l7hhklzhywcxk4u9n4py5tdxyx7vrvhnza2r4gmq4vw35r",
            gasPrice: 1000000000,
            gasLimit: 50000,
            data: "foo",
            chainID: "1"
        });

        let serialized = transaction.serializeForSigning(sender).toString();
        await signer.sign(transaction);

        assert.equal(serialized, `{"nonce":0,"value":"0","receiver":"erd1cux02zersde0l7hhklzhywcxk4u9n4py5tdxyx7vrvhnza2r4gmq4vw35r","sender":"erd1l453hd0gt5gzdp7czpuall8ggt2dcv5zwmfdf3sd3lguxseux2fsmsgldz","gasPrice":1000000000,"gasLimit":50000,"data":"Zm9v","chainID":"1","version":1}`);
        assert.equal(transaction.getSignature().hex(), "b5fddb8c16fa7f6123cb32edc854f1e760a3eb62c6dc420b5a4c0473c58befd45b621b31a448c5b59e21428f2bc128c80d0ee1caa4f2bf05a12be857ad451b00");
        assert.isTrue(verifier.verify(transaction));
        // Without data field
        transaction = new TestTransaction({
            nonce: 8,
            value: "10000000000000000000",
            receiver: "erd1cux02zersde0l7hhklzhywcxk4u9n4py5tdxyx7vrvhnza2r4gmq4vw35r",
            gasPrice: 1000000000,
            gasLimit: 50000,
            chainID: "1"
        });

        serialized = transaction.serializeForSigning(sender).toString();
        await signer.sign(transaction);

        assert.equal(serialized, `{"nonce":8,"value":"10000000000000000000","receiver":"erd1cux02zersde0l7hhklzhywcxk4u9n4py5tdxyx7vrvhnza2r4gmq4vw35r","sender":"erd1l453hd0gt5gzdp7czpuall8ggt2dcv5zwmfdf3sd3lguxseux2fsmsgldz","gasPrice":1000000000,"gasLimit":50000,"chainID":"1","version":1}`);
        assert.equal(transaction.getSignature().hex(), "4a6d8186eae110894e7417af82c9bf9592696c0600faf110972e0e5310d8485efc656b867a2336acec2b4c1e5f76c9cc70ba1803c6a46455ed7f1e2989a90105");
    });

    it("should sign transactions using PEM files", async () => {
        let signer = UserSigner.fromPem(alice.pemFileText);

        let transaction = new TestTransaction({
            nonce: 0,
            value: "0",
            receiver: "erd1cux02zersde0l7hhklzhywcxk4u9n4py5tdxyx7vrvhnza2r4gmq4vw35r",
            gasPrice: 1000000000,
            gasLimit: 50000,
            data: "foo",
            chainID: "1"
        });

        await signer.sign(transaction);
        assert.equal(transaction.getSignature().hex(), "c0bd2b3b33a07b9cc5ee7435228acb0936b3829c7008aacabceea35163e555e19a34def2c03a895cf36b0bcec30a7e11215c11efc0da29294a11234eb2b3b906");
    });

    it("signs a general message", function () {
        let signer = new UserSigner(UserSecretKey.fromString("1a927e2af5306a9bb2ea777f73e06ecc0ac9aaa72fb4ea3fecf659451394cccf"));
        let verifier = new UserVerifier(UserSecretKey.fromString("1a927e2af5306a9bb2ea777f73e06ecc0ac9aaa72fb4ea3fecf659451394cccf").generatePublicKey());
        const message = new TestMessage({
            foo: "hello",
            bar: "world"
        });

        signer.sign(message);
        assert.isNotEmpty(message.signature);
        assert.isTrue(verifier.verify(message));
    });
});
