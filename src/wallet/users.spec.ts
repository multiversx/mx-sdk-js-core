import { assert } from "chai";
import path from "path";
import * as vm from "vm";
import { Account } from "../accounts";
import {
    Address,
    ErrBadKeystore,
    ErrBadMnemonicEntropy,
    ErrBadType,
    ErrInvalidArgument,
    ErrInvariantFailed,
    ErrSignerCannotSign,
    Message,
    Transaction,
    TransactionComputer,
} from "../core";
import {
    DummyMnemonicOf12Words,
    loadMnemonic,
    loadPassword,
    loadTestKeystore,
    loadTestWallet,
    TestWallet,
} from "./../testutils/wallets";
import { Encryptor, Randomness } from "./crypto";
import { Mnemonic } from "./mnemonic";
import { UserSecretKey } from "./userKeys";
import { UserSigner } from "./userSigner";
import { UserVerifier } from "./userVerifier";
import { UserWallet } from "./userWallet";

describe("test user wallets", () => {
    let alice: TestWallet, bob: TestWallet, carol: TestWallet;
    let password: string;
    let dummyMnemonic: string;

    before(async function () {
        alice = await loadTestWallet("alice");
        bob = await loadTestWallet("bob");
        carol = await loadTestWallet("carol");
        password = await loadPassword();
        dummyMnemonic = await loadMnemonic();
    });

    it("should generate mnemonic", () => {
        let mnemonic = Mnemonic.generate();
        let words = mnemonic.getWords();
        assert.lengthOf(words, 24);
    });

    it("should convert entropy to mnemonic and back", () => {
        function testConversion(text: string, entropyHex: string) {
            const entropyFromMnemonic = Mnemonic.fromString(text).getEntropy();
            const mnemonicFromEntropy = Mnemonic.fromEntropy(Buffer.from(entropyHex, "hex"));

            assert.equal(Buffer.from(entropyFromMnemonic).toString("hex"), entropyHex);
            assert.equal(mnemonicFromEntropy.toString(), text);
        }

        testConversion(
            "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about",
            "00000000000000000000000000000000",
        );

        testConversion(
            "moral volcano peasant pass circle pen over picture flat shop clap goat never lyrics gather prepare woman film husband gravity behind test tiger improve",
            "8fbeb688d0529344e77d225898d4a73209510ad81d4ffceac9bfb30149bf387b",
        );

        assert.throws(
            () => {
                Mnemonic.fromEntropy(Buffer.from("abba", "hex"));
            },
            ErrBadMnemonicEntropy,
            `Bad mnemonic entropy`,
        );
    });

    it("should derive keys", async () => {
        let mnemonic = Mnemonic.fromString(dummyMnemonic);

        assert.equal(mnemonic.deriveKey(0).hex(), alice.secretKeyHex);
        assert.equal(mnemonic.deriveKey(1).hex(), bob.secretKeyHex);
        assert.equal(mnemonic.deriveKey(2).hex(), carol.secretKeyHex);
    });

    it("should derive keys (12 words)", async () => {
        const mnemonic = Mnemonic.fromString(DummyMnemonicOf12Words);

        assert.equal(
            mnemonic.deriveKey(0).generatePublicKey().toAddress().toBech32(),
            "erd1l8g9dk3gz035gkjhwegsjkqzdu3augrwhcfxrnucnyyrpc2220pqg4g7na",
        );
        assert.equal(
            mnemonic.deriveKey(1).generatePublicKey().toAddress().toBech32(),
            "erd1fmhwg84rldg0xzngf53m0y607wvefvamh07n2mkypedx27lcqnts4zs09p",
        );
        assert.equal(
            mnemonic.deriveKey(2).generatePublicKey().toAddress().toBech32(),
            "erd1tyuyemt4xz2yjvc7rxxp8kyfmk2n3h8gv3aavzd9ru4v2vhrkcksptewtj",
        );

        assert.equal(
            mnemonic.deriveKey(0).generatePublicKey().toAddress("test").toBech32(),
            "test1l8g9dk3gz035gkjhwegsjkqzdu3augrwhcfxrnucnyyrpc2220pqc6tnnf",
        );
        assert.equal(
            mnemonic.deriveKey(1).generatePublicKey().toAddress("xerd").toBech32(),
            "xerd1fmhwg84rldg0xzngf53m0y607wvefvamh07n2mkypedx27lcqntsj4adj4",
        );
        assert.equal(
            mnemonic.deriveKey(2).generatePublicKey().toAddress("yerd").toBech32(),
            "yerd1tyuyemt4xz2yjvc7rxxp8kyfmk2n3h8gv3aavzd9ru4v2vhrkcksn8p0n5",
        );
    });

    it("should create secret key", () => {
        const keyHex = alice.secretKeyHex;
        const fromBuffer = new UserSecretKey(Buffer.from(keyHex, "hex"));
        const fromArray = new UserSecretKey(Uint8Array.from(Buffer.from(keyHex, "hex")));
        const fromHex = UserSecretKey.fromString(keyHex);

        assert.equal(fromBuffer.hex(), keyHex);
        assert.equal(fromArray.hex(), keyHex);
        assert.equal(fromHex.hex(), keyHex);
    });

    it("should compute public key (and address)", () => {
        let secretKey: UserSecretKey;

        secretKey = new UserSecretKey(Buffer.from(alice.secretKeyHex, "hex"));
        assert.equal(secretKey.generatePublicKey().hex(), alice.address.toHex());
        assert.deepEqual(secretKey.generatePublicKey().toAddress(), alice.address);

        secretKey = new UserSecretKey(Buffer.from(bob.secretKeyHex, "hex"));
        assert.equal(secretKey.generatePublicKey().hex(), bob.address.toHex());
        assert.deepEqual(secretKey.generatePublicKey().toAddress(), bob.address);

        secretKey = new UserSecretKey(Buffer.from(carol.secretKeyHex, "hex"));
        assert.equal(secretKey.generatePublicKey().hex(), carol.address.toHex());
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

        assert.equal(aliceKeyFile.toJSON().bech32, alice.address.toBech32());
        assert.equal(bobKeyFile.toJSON().bech32, bob.address.toBech32());
        assert.equal(carolKeyFile.toJSON().bech32, carol.address.toBech32());

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
                salt: Buffer.from(alice.keyFileObject.crypto.kdfparams.salt, "hex"),
            }),
        });

        bobKeyFile = UserWallet.fromSecretKey({
            secretKey: bobSecretKey,
            password: password,
            randomness: new Randomness({
                id: bob.keyFileObject.id,
                iv: Buffer.from(bob.keyFileObject.crypto.cipherparams.iv, "hex"),
                salt: Buffer.from(bob.keyFileObject.crypto.kdfparams.salt, "hex"),
            }),
        });

        carolKeyFile = UserWallet.fromSecretKey({
            secretKey: carolSecretKey,
            password: password,
            randomness: new Randomness({
                id: carol.keyFileObject.id,
                iv: Buffer.from(carol.keyFileObject.crypto.cipherparams.iv, "hex"),
                salt: Buffer.from(carol.keyFileObject.crypto.kdfparams.salt, "hex"),
            }),
        });

        assert.deepEqual(aliceKeyFile.toJSON(), alice.keyFileObject);
        assert.deepEqual(bobKeyFile.toJSON(), bob.keyFileObject);
        assert.deepEqual(carolKeyFile.toJSON(), carol.keyFileObject);
    });

    it("should load keystore files (with secret keys, but without 'kind' field)", async function () {
        const keyFileObject = await loadTestKeystore("withoutKind.json");
        const secretKey = UserWallet.decryptSecretKey(keyFileObject, password);

        assert.equal(
            secretKey.generatePublicKey().toAddress().toBech32(),
            "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
        );
    });

    it("should create and load keystore files (with mnemonics)", async function () {
        this.timeout(10000);

        const wallet = UserWallet.fromMnemonic({ mnemonic: dummyMnemonic, password: password });
        const json = wallet.toJSON();

        assert.equal(json.version, 4);
        assert.equal(json.kind, "mnemonic");
        assert.isUndefined(json.toBech32);

        const mnemonic = UserWallet.decryptMnemonic(json, password);
        const mnemonicText = mnemonic.toString();

        assert.equal(mnemonicText, dummyMnemonic);
        assert.equal(mnemonic.deriveKey(0).generatePublicKey().toAddress().toBech32(), alice.address.toBech32());
        assert.equal(mnemonic.deriveKey(1).generatePublicKey().toAddress().toBech32(), bob.address.toBech32());
        assert.equal(mnemonic.deriveKey(2).generatePublicKey().toAddress().toBech32(), carol.address.toBech32());

        // With provided randomness, in order to reproduce our test wallets
        const expectedDummyWallet = await loadTestKeystore("withDummyMnemonic.json");
        const dummyWallet = UserWallet.fromMnemonic({
            mnemonic: dummyMnemonic,
            password: password,
            randomness: new Randomness({
                id: "5b448dbc-5c72-4d83-8038-938b1f8dff19",
                iv: Buffer.from("2da5620906634972d9a623bc249d63d4", "hex"),
                salt: Buffer.from("aa9e0ba6b188703071a582c10e5331f2756279feb0e2768f1ba0fd38ec77f035", "hex"),
            }),
        });

        assert.deepEqual(dummyWallet.toJSON(), expectedDummyWallet);
    });

    it("should create user wallet from secret key, but without 'kind' field", async function () {
        const keyFileObject = await loadTestKeystore("withoutKind.json");
        const secretKey = UserWallet.decrypt(keyFileObject, password);

        assert.equal(
            secretKey.generatePublicKey().toAddress().toBech32(),
            "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
        );
    });

    it("should loadSecretKey, but without 'kind' field", async function () {
        const testdataPath = path.resolve(__dirname, "..", "testdata/testwallets");
        const keystorePath = path.resolve(testdataPath, "withoutKind.json");
        const secretKey = UserWallet.loadSecretKey(keystorePath, password);

        assert.equal(
            secretKey.generatePublicKey().toAddress().toBech32(),
            "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
        );
    });

    it("should throw when calling loadSecretKey with unecessary address index", async function () {
        const keyFileObject = await loadTestKeystore("alice.json");

        assert.throws(
            () => UserWallet.decrypt(keyFileObject, password, 42),
            "addressIndex must not be provided when kind == 'secretKey'",
        );
    });

    it("should loadSecretKey with mnemonic", async function () {
        const keyFileObject = await loadTestKeystore("withDummyMnemonic.json");

        assert.equal(
            UserWallet.decrypt(keyFileObject, password, 0).generatePublicKey().toAddress().toBech32(),
            "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
        );
        assert.equal(
            UserWallet.decrypt(keyFileObject, password, 1).generatePublicKey().toAddress().toBech32(),
            "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx",
        );
        assert.equal(
            UserWallet.decrypt(keyFileObject, password, 2).generatePublicKey().toAddress().toBech32(),
            "erd1k2s324ww2g0yj38qn2ch2jwctdy8mnfxep94q9arncc6xecg3xaq6mjse8",
        );
    });

    it("should sign transactions", async () => {
        let signer = new Account(
            UserSecretKey.fromString("1a927e2af5306a9bb2ea777f73e06ecc0ac9aaa72fb4ea3fecf659451394cccf"),
        );
        let verifier = new UserVerifier(
            UserSecretKey.fromString(
                "1a927e2af5306a9bb2ea777f73e06ecc0ac9aaa72fb4ea3fecf659451394cccf",
            ).generatePublicKey(),
        );
        const transactionComputer = new TransactionComputer();

        // With data field
        let transaction = new Transaction({
            nonce: 0n,
            value: 0n,
            sender: Address.newFromBech32("erd1l453hd0gt5gzdp7czpuall8ggt2dcv5zwmfdf3sd3lguxseux2fsmsgldz"),
            receiver: Address.newFromBech32("erd1cux02zersde0l7hhklzhywcxk4u9n4py5tdxyx7vrvhnza2r4gmq4vw35r"),
            gasPrice: 1000000000n,
            gasLimit: 50000n,
            data: new TextEncoder().encode("foo"),
            chainID: "1",
        });

        let serialized = transactionComputer.computeBytesForSigning(transaction);
        let signature = await signer.sign(serialized);

        assert.deepEqual(await signer.sign(serialized), await signer.sign(Uint8Array.from(serialized)));

        assert.equal(
            Buffer.from(signature).toString("hex"),
            "a5db62c6186612d44094f83576aa6a664299315fb6e42d0c17a40e9cd33efa9a9df8b76943aeac7dceaff3d78a16a7414c914f03f7a88e786c2cf939eb111c06",
        );
        assert.isTrue(await verifier.verify(serialized, signature));

        // Without data field
        transaction = new Transaction({
            nonce: 8n,
            value: 10000000000000000000n,
            sender: Address.newFromBech32("erd1l453hd0gt5gzdp7czpuall8ggt2dcv5zwmfdf3sd3lguxseux2fsmsgldz"),
            receiver: Address.newFromBech32("erd1cux02zersde0l7hhklzhywcxk4u9n4py5tdxyx7vrvhnza2r4gmq4vw35r"),
            gasPrice: 1000000000n,
            gasLimit: 50000n,
            chainID: "1",
        });

        serialized = transactionComputer.computeBytesForSigning(transaction);
        signature = await signer.sign(serialized);

        assert.deepEqual(await signer.sign(serialized), await signer.sign(Uint8Array.from(serialized)));

        assert.equal(
            Buffer.from(signature).toString("hex"),
            "024f007f7eae87141b34708e33afd66c85a49ea8c8422e55292832ee870f879cdc033d2511c174d0f2ed62799b9f597c4a8399309578a258f558131d74374f0d",
        );
    });

    it("guardian should sign transactions from PEM", async () => {
        // bob is the guardian
        let signer = new UserSigner(
            UserSecretKey.fromString("1a927e2af5306a9bb2ea777f73e06ecc0ac9aaa72fb4ea3fecf659451394cccf"),
        );
        let verifier = new UserVerifier(
            UserSecretKey.fromString(
                "1a927e2af5306a9bb2ea777f73e06ecc0ac9aaa72fb4ea3fecf659451394cccf",
            ).generatePublicKey(),
        );
        let guardianSigner = new UserSigner(UserSecretKey.fromPem(bob.pemFileText));
        const transactionComputer = new TransactionComputer();

        // With data field
        let transaction = new Transaction({
            nonce: 0n,
            value: 0n,
            receiver: Address.newFromBech32("erd1cux02zersde0l7hhklzhywcxk4u9n4py5tdxyx7vrvhnza2r4gmq4vw35r"),
            sender: Address.newFromBech32("erd1l453hd0gt5gzdp7czpuall8ggt2dcv5zwmfdf3sd3lguxseux2fsmsgldz"),
            gasPrice: 1000000000n,
            gasLimit: 50000n,
            data: new TextEncoder().encode("foo"),
            chainID: "1",
            guardian: Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx"),
            options: 2,
            version: 2,
        });

        let serialized = transactionComputer.computeBytesForSigning(transaction);
        let signature = await signer.sign(serialized);
        let guardianSignature = await guardianSigner.sign(serialized);

        assert.equal(
            Buffer.from(signature).toString("hex"),
            "fa067dc9508ec9df04896665fc9c9e3e7e9cbdc6577c10d56128e3c891ea502572be637bd7cdfb466779cee3e208a2be1f32b0267af1710a6532848e5e5e6f0d",
        );
        assert.equal(
            Buffer.from(guardianSignature).toString("hex"),
            "5695fde5d9c77a94bb320438fbebe3bbd60b7cc4d633fb38e42bb65f83d253cbb82cc5ae40d701a7f0b839a5231320ca356018ced949885baae473e469ec770e",
        );
        assert.isTrue(await verifier.verify(serialized, signature));

        // Without data field
        transaction = new Transaction({
            nonce: 8n,
            value: 10000000000000000000n,
            receiver: Address.newFromBech32("erd1cux02zersde0l7hhklzhywcxk4u9n4py5tdxyx7vrvhnza2r4gmq4vw35r"),
            sender: Address.newFromBech32("erd1l453hd0gt5gzdp7czpuall8ggt2dcv5zwmfdf3sd3lguxseux2fsmsgldz"),
            gasPrice: 1000000000n,
            gasLimit: 50000n,
            chainID: "1",
            guardian: Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx"),
            options: 2,
            version: 2,
        });

        serialized = transactionComputer.computeBytesForSigning(transaction);
        signature = await signer.sign(serialized);
        guardianSignature = await guardianSigner.sign(serialized);

        assert.equal(
            Buffer.from(signature).toString("hex"),
            "50d61a408cf032b3e70b15ecc313dbea43e35a1b33ea89aadb42b25a672d3427147bcda0d911be539629fcd3183c22b30f8ac30023abb230b13abf2cd1befd04",
        );
        assert.equal(
            Buffer.from(guardianSignature).toString("hex"),
            "ea3b83adcc468b0c7d3613fca5f429a9764d5710137c34c27e15d06e625326724ccfa758968507acadb14345d19389ba6004a4f0a6c527799c01713e10cf650b",
        );
        assert.isTrue(await verifier.verify(serialized, signature));
    });

    it("should sign transactions using PEM files", async () => {
        const signer = UserSigner.fromPem(alice.pemFileText);
        const transactionComputer = new TransactionComputer();

        const transaction = new Transaction({
            nonce: 0n,
            value: 0n,
            sender: signer.getAddress(),
            receiver: Address.newFromBech32("erd1cux02zersde0l7hhklzhywcxk4u9n4py5tdxyx7vrvhnza2r4gmq4vw35r"),
            gasPrice: 1000000000n,
            gasLimit: 50000n,
            data: new TextEncoder().encode("foo"),
            chainID: "1",
        });

        const serialized = transactionComputer.computeBytesForSigning(transaction);
        const signature = await signer.sign(serialized);

        assert.deepEqual(await signer.sign(serialized), await signer.sign(Uint8Array.from(serialized)));
        assert.equal(
            Buffer.from(signature).toString("hex"),
            "b6feb8b50711cc8436040de561355e94585b2cf9e33e9e887125ad9c6877829dbc75afaf878c690e249455b738e89f63067930bc8c46fcf0779ac0bd3590a206",
        );
    });

    it("signs a general message", async function () {
        let signer = new UserSigner(
            UserSecretKey.fromString("1a927e2af5306a9bb2ea777f73e06ecc0ac9aaa72fb4ea3fecf659451394cccf"),
        );
        let verifier = new UserVerifier(
            UserSecretKey.fromString(
                "1a927e2af5306a9bb2ea777f73e06ecc0ac9aaa72fb4ea3fecf659451394cccf",
            ).generatePublicKey(),
        );

        const message = new Message({
            data: new TextEncoder().encode(JSON.stringify({ foo: "hello", bar: "world" })),
        });

        const signature = await signer.sign(message.data);

        assert.deepEqual(await signer.sign(message.data), await signer.sign(Uint8Array.from(message.data)));
        assert.isTrue(await verifier.verify(message.data, signature));
        assert.isTrue(await verifier.verify(Uint8Array.from(message.data), Uint8Array.from(signature)));
        assert.isFalse(await verifier.verify(Buffer.from("hello"), signature));
        assert.isFalse(await verifier.verify(new TextEncoder().encode("hello"), signature));
    });

    it("should create UserSigner from wallet", async function () {
        const keyFileObjectWithoutKind = await loadTestKeystore("withoutKind.json");
        const keyFileObjectWithMnemonic = await loadTestKeystore("withDummyMnemonic.json");
        const keyFileObjectWithSecretKey = await loadTestKeystore("withDummySecretKey.json");

        assert.equal(
            UserSigner.fromWallet(keyFileObjectWithoutKind, password).getAddress().toBech32(),
            "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
        );
        assert.equal(
            UserSigner.fromWallet(keyFileObjectWithMnemonic, password).getAddress().toBech32(),
            "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
        );
        assert.equal(
            UserSigner.fromWallet(keyFileObjectWithSecretKey, password).getAddress().toBech32(),
            "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
        );
        assert.equal(
            UserSigner.fromWallet(keyFileObjectWithMnemonic, password, 0).getAddress().toBech32(),
            "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
        );
        assert.equal(
            UserSigner.fromWallet(keyFileObjectWithMnemonic, password, 1).getAddress().toBech32(),
            "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx",
        );
        assert.equal(
            UserSigner.fromWallet(keyFileObjectWithMnemonic, password, 2).getAddress().toBech32(),
            "erd1k2s324ww2g0yj38qn2ch2jwctdy8mnfxep94q9arncc6xecg3xaq6mjse8",
        );

        assert.equal(
            UserSigner.fromWallet(keyFileObjectWithMnemonic, password, 0).getAddress("test").toBech32(),
            "test1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ss5hqhtr",
        );
        assert.equal(
            UserSigner.fromWallet(keyFileObjectWithMnemonic, password, 1).getAddress("xerd").toBech32(),
            "xerd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruq9thc9j",
        );
        assert.equal(
            UserSigner.fromWallet(keyFileObjectWithMnemonic, password, 2).getAddress("yerd").toBech32(),
            "yerd1k2s324ww2g0yj38qn2ch2jwctdy8mnfxep94q9arncc6xecg3xaqgh23pp",
        );
    });

    it("should throw error when decrypting secret key with keystore-mnemonic file", async function () {
        const userWallet = UserWallet.fromMnemonic({ mnemonic: dummyMnemonic, password: `` });
        const keystoreMnemonic = userWallet.toJSON();

        assert.throws(() => {
            UserWallet.decryptSecretKey(keystoreMnemonic, ``);
        }, `Expected keystore kind to be secretKey, but it was mnemonic.`);
    });
});

describe("test keystore files that are damaged or tampered with", () => {
    let alice: TestWallet, bob: TestWallet;
    let password: string;
    let dummyMnemonic: string;

    before(async function () {
        alice = await loadTestWallet("alice");
        bob = await loadTestWallet("bob");
        password = await loadPassword();
        dummyMnemonic = await loadMnemonic();
    });

    function clone(keyFileObject: any): any {
        return JSON.parse(JSON.stringify(keyFileObject));
    }

    // Creates a keystore of kind "secretKey", holding an arbitrary plaintext, and having the "address" and "bech32" fields of the given wallet.
    function createKeystoreWithPlaintext(plaintext: Buffer, wallet: TestWallet): any {
        const encryptedData = Encryptor.encrypt(plaintext, password);

        return {
            version: encryptedData.version,
            kind: "secretKey",
            id: encryptedData.id,
            address: wallet.address.toHex(),
            bech32: wallet.address.toBech32(),
            crypto: encryptedData.toJSON().crypto,
        };
    }

    it("should load a keystore holding the secret key only (without the public key)", async function () {
        const keyFileObject = createKeystoreWithPlaintext(Buffer.from(alice.secretKeyHex, "hex"), alice);
        const secretKey = UserWallet.decryptSecretKey(keyFileObject, password);

        assert.equal(secretKey.hex(), alice.secretKeyHex);
    });

    it("should load a keystore saved with a custom HRP", async function () {
        const secretKey = UserSecretKey.fromString(alice.secretKeyHex);
        const keyFileObject = UserWallet.fromSecretKey({ secretKey, password }).toJSON("test");

        assert.isTrue(keyFileObject.bech32.startsWith("test1"));
        assert.equal(UserWallet.decryptSecretKey(keyFileObject, password).hex(), alice.secretKeyHex);
    });

    it("should still throw on wrong password", async function () {
        assert.throws(
            () => UserWallet.decryptSecretKey(alice.keyFileObject, "wrong password"),
            "MAC mismatch, possibly wrong password",
        );
    });

    it("should reject a keystore with a modified IV", async function () {
        // The MAC doesn't cover the IV, so the decryption succeeds, but yields a different secret key.
        const keyFileObject = clone(alice.keyFileObject);
        const iv = Buffer.from(keyFileObject.crypto.cipherparams.iv, "hex");
        iv[0] ^= 0x01;
        keyFileObject.crypto.cipherparams.iv = iv.toString("hex");

        assert.throws(
            () => UserWallet.decryptSecretKey(keyFileObject, password),
            ErrBadKeystore,
            "the embedded public key does not match the secret key",
        );
    });

    it("should reject a keystore whose 'address' field does not match", async function () {
        const keyFileObject = clone(alice.keyFileObject);
        keyFileObject.address = bob.address.toHex();

        assert.throws(
            () => UserWallet.decryptSecretKey(keyFileObject, password),
            ErrBadKeystore,
            "the 'address' field does not match the secret key",
        );
    });

    it("should reject a keystore whose 'bech32' field does not match", async function () {
        const keyFileObject = clone(alice.keyFileObject);
        keyFileObject.bech32 = bob.address.toBech32();

        assert.throws(
            () => UserWallet.decryptSecretKey(keyFileObject, password),
            ErrBadKeystore,
            "the 'bech32' field does not match the secret key",
        );

        keyFileObject.bech32 = "not a bech32 address";

        assert.throws(
            () => UserWallet.decryptSecretKey(keyFileObject, password),
            ErrBadKeystore,
            "the 'bech32' field does not match the secret key",
        );
    });

    it("should reject a keystore without 'address' or 'bech32' field", async function () {
        for (const field of ["address", "bech32"]) {
            const keyFileObject = clone(alice.keyFileObject);
            delete keyFileObject[field];

            assert.throws(
                () => UserWallet.decryptSecretKey(keyFileObject, password),
                ErrBadKeystore,
                "missing 'address' or 'bech32' field",
            );
        }
    });

    it("should reject a keystore whose decrypted data has an unexpected length", async function () {
        for (const plaintext of [Buffer.from([1, 2, 3, 4, 5]), Buffer.alloc(33, 1), Buffer.alloc(65, 1)]) {
            const keyFileObject = createKeystoreWithPlaintext(plaintext, alice);

            assert.throws(
                () => UserWallet.decryptSecretKey(keyFileObject, password),
                ErrBadKeystore,
                `unexpected length of decrypted data: ${plaintext.length}`,
            );
        }
    });

    it("should reject a keystore whose embedded public key does not match", async function () {
        const plaintext = Buffer.concat([Buffer.from(alice.secretKeyHex, "hex"), bob.address.getPublicKey()]);
        const keyFileObject = createKeystoreWithPlaintext(plaintext, alice);

        assert.throws(
            () => UserWallet.decryptSecretKey(keyFileObject, password),
            ErrBadKeystore,
            "the embedded public key does not match the secret key",
        );
    });

    it("should reject a mnemonic keystore without 'kind' field", async function () {
        this.timeout(10000);

        // Without the "kind" field, the file is treated as a keystore of kind "secretKey".
        // The decrypted mnemonic must not be interpreted as a secret key.
        const keyFileObject = UserWallet.fromMnemonic({ mnemonic: dummyMnemonic, password }).toJSON();
        delete keyFileObject.kind;

        assert.throws(
            () => UserWallet.decrypt(keyFileObject, password),
            ErrBadKeystore,
            "missing 'address' or 'bech32' field",
        );

        keyFileObject.address = alice.address.toHex();
        keyFileObject.bech32 = alice.address.toBech32();

        assert.throws(
            () => UserWallet.decrypt(keyFileObject, password),
            ErrBadKeystore,
            "unexpected length of decrypted data",
        );
    });
});

describe("test signing and verifying, with bad input", () => {
    const secretKey = new UserSecretKey(
        Buffer.from("413f42575f7f26fad3317a778771212fdb80245850981e48b58a4f25e344e8f9", "hex"),
    );
    const publicKey = secretKey.generatePublicKey();
    const data = Buffer.from("hello");
    const signatureOfData = secretKey.sign(data);
    const signatureOfEmpty = secretKey.sign(new Uint8Array());

    // "new Uint8Array(value)" would have silently converted these to the empty message (or to zero bytes).
    const badInputs: [string, any][] = [
        ["string", "hello"],
        ["empty string", ""],
        ["numeric string", "5"],
        ["number", 5],
        ["null", null],
        ["undefined", undefined],
        ["object", { data: "hello" }],
        ["serialized Buffer", Buffer.from("hello").toJSON()],
        ["Int16Array", new Int16Array([258])],
        ["DataView", new DataView(new ArrayBuffer(2))],
        ["array with out-of-range values", [300, -1]],
        ["array with non-integers", [1.5]],
        ["array with strings", ["h", "e"]],
        ["sparse array", [104, , 105]],
    ];

    let originalConsoleError: any;

    beforeEach(() => {
        // "verify" logs the errors it handles.
        originalConsoleError = console.error;
        console.error = () => {};
    });

    afterEach(() => {
        console.error = originalConsoleError;
    });

    it("should throw when signing bad input", async () => {
        for (const [label, input] of badInputs) {
            let error: any;
            try {
                secretKey.sign(input);
            } catch (err) {
                error = err;
            }
            assert.instanceOf(error, ErrBadType, label);

            const signerError = await new UserSigner(secretKey).sign(input).catch((err) => err);
            assert.instanceOf(signerError, ErrSignerCannotSign, label);

            const accountError = await new Account(secretKey).sign(input).catch((err) => err);
            assert.instanceOf(accountError, ErrBadType, label);
        }
    });

    it("should return false when verifying bad input (data)", async () => {
        for (const [label, input] of badInputs) {
            assert.isFalse(await publicKey.verify(input, signatureOfEmpty), label);
            assert.isFalse(await publicKey.verify(input, signatureOfData), label);
        }
    });

    it("should not accept the signature of the empty message (or of zero bytes) for strings", async () => {
        const verifier = new UserVerifier(publicKey);
        const account = new Account(secretKey);

        for (const input of ["hello", "anything at all", ""]) {
            assert.isFalse(await publicKey.verify(input as any, signatureOfEmpty), input);
            assert.isFalse(await verifier.verify(input as any, signatureOfEmpty), input);
            assert.isFalse(await account.verify(input as any, signatureOfEmpty), input);
        }

        assert.isFalse(await publicKey.verify("5" as any, secretKey.sign(Buffer.alloc(5))));
    });

    it("should return false when verifying bad input (signature)", async () => {
        const signatureAsHex = Buffer.from(signatureOfData).toString("hex");

        assert.isFalse(await publicKey.verify(data, signatureAsHex as any));
        assert.isFalse(await publicKey.verify(data, null as any));
        assert.isFalse(await publicKey.verify(data, Array.from(signatureOfData).concat([300]) as any));
    });

    it("should sign and verify binary data given in any of the supported forms (backwards compatibility)", async () => {
        // Signature of "hello", as computed before adding the input checks.
        const expectedSignature =
            "66dd503199222d3104cb5381da953b14c895ca564579f98934c4e54a45d75f097da2a0c30060c0e7d014928b8e54509335cadc69b2bb1940cd59bd0c1bb80b0b";

        const forms = (bytes: Buffer): [string, any][] => [
            ["Buffer", bytes],
            ["Uint8Array", new Uint8Array(bytes)],
            ["Uint8Array (view with offset)", new Uint8Array(Buffer.concat([Buffer.from("__"), bytes])).subarray(2)],
            [
                "Uint8Array (from another realm)",
                vm.runInNewContext("(bytes) => new Uint8Array(bytes)")(Array.from(bytes)),
            ],
            ["ArrayBuffer", new Uint8Array(bytes).buffer],
            ["array of bytes", Array.from(bytes)],
        ];

        for (const [label, input] of forms(data)) {
            assert.equal(Buffer.from(secretKey.sign(input)).toString("hex"), expectedSignature, label);
            assert.isTrue(await publicKey.verify(input, Buffer.from(expectedSignature, "hex")), label);
        }

        for (const [label, input] of forms(Buffer.from(expectedSignature, "hex"))) {
            assert.isTrue(await publicKey.verify(data, input), label);
        }

        assert.isTrue(await publicKey.verify(new Uint8Array(), signatureOfEmpty));
    });
});

describe("test the buffers returned by the keys", () => {
    let alice: TestWallet;

    before(async function () {
        alice = await loadTestWallet("alice");
    });

    it("should return copies, so that the keys can't be altered through them", async () => {
        const secretKey = UserSecretKey.fromString(alice.secretKeyHex);
        const publicKey = secretKey.generatePublicKey();
        const data = Buffer.from("hello");
        const signature = secretKey.sign(data);

        assert.deepEqual(secretKey.valueOf(), Buffer.from(alice.secretKeyHex, "hex"));
        assert.deepEqual(publicKey.valueOf(), alice.address.getPublicKey());
        assert.notStrictEqual(secretKey.valueOf(), secretKey.valueOf());
        assert.notStrictEqual(publicKey.valueOf(), publicKey.valueOf());

        secretKey.valueOf().fill(0);
        publicKey.valueOf()[0] ^= 1;

        assert.equal(secretKey.hex(), alice.secretKeyHex);
        assert.deepEqual(secretKey.sign(data), signature);
        assert.equal(publicKey.toAddress().toBech32(), alice.address.toBech32());
        assert.isTrue(await publicKey.verify(data, signature));
    });

    it("should not allow altering the keys of an account or signer", async () => {
        const account = await Account.newFromPem(path.resolve(__dirname, "..", "testdata/testwallets/alice.pem"));
        const signer = UserSigner.fromPem(alice.pemFileText);
        const data = Buffer.from("hello");
        const signature = await signer.sign(data);

        account.secretKey.valueOf().fill(0);
        account.publicKey.valueOf().fill(0);
        signer.secretKey.valueOf().fill(0);

        assert.deepEqual(await account.sign(data), signature);
        assert.isTrue(await account.verify(data, signature));
        assert.equal(account.address.toBech32(), alice.address.toBech32());
        assert.deepEqual(await signer.sign(data), signature);
        assert.equal(signer.getAddress().toBech32(), alice.address.toBech32());
    });
});

describe("test address index validation", () => {
    let mnemonic: Mnemonic;
    let mnemonicText: string;
    let password: string;
    let keyFileObject: any;

    // Such values were either silently treated as index 0 or 1 (e.g. NaN, "1"), or inserted as text in the derivation path (e.g. "0'/1").
    const badIndexes: any[] = [
        -1,
        2 ** 31,
        2 ** 32,
        1.5,
        NaN,
        Infinity,
        -Infinity,
        "1",
        "01",
        "0'/1",
        "",
        null,
        1n,
        true,
        [1],
        {},
    ];

    before(async function () {
        this.timeout(10000);

        mnemonicText = await loadMnemonic();
        mnemonic = Mnemonic.fromString(mnemonicText);
        password = await loadPassword();
        keyFileObject = UserWallet.fromMnemonic({ mnemonic: mnemonicText, password }).toJSON();
    });

    function catchError(fn: () => any): any {
        try {
            fn();
        } catch (err) {
            return err;
        }
    }

    it("should derive keys for indexes in range (including the largest)", () => {
        assert.equal(mnemonic.deriveKey().hex(), "413f42575f7f26fad3317a778771212fdb80245850981e48b58a4f25e344e8f9");
        assert.equal(mnemonic.deriveKey(0).hex(), "413f42575f7f26fad3317a778771212fdb80245850981e48b58a4f25e344e8f9");
        assert.equal(mnemonic.deriveKey(1).hex(), "b8ca6f8203fb4b545a8e83c5384da033c415db155b53fb5b8eba7ff5a039d639");

        // Same as computed by mx-sdk-py.
        assert.equal(
            mnemonic.deriveKey(2 ** 31 - 1).hex(),
            "7ee7bce4e4e4a5aa73184bc759684b3b613f1e18af8caa8c0cc6b2530a112765",
        );
    });

    it("should reject bad indexes when deriving keys", () => {
        for (const index of badIndexes) {
            const error = catchError(() => mnemonic.deriveKey(index));
            assert.instanceOf(error, ErrInvalidArgument, String(index));
            assert.include(error.message, "invalid address index", String(index));

            assert.instanceOf(
                catchError(() => Account.newFromMnemonic(mnemonicText, index)),
                ErrInvalidArgument,
                String(index),
            );
        }
    });

    it("should reject bad indexes when loading keystores (instead of falling back to index 0)", async function () {
        this.timeout(20000);

        for (const index of [NaN, "", "0'/1", -1]) {
            assert.instanceOf(
                catchError(() => UserWallet.decrypt(keyFileObject, password, index as any)),
                ErrInvalidArgument,
            );
            assert.instanceOf(
                catchError(() => UserSigner.fromWallet(keyFileObject, password, index as any)),
                ErrInvalidArgument,
            );
        }

        const keystorePath = path.resolve(__dirname, "..", "testdata/testwallets/withDummyMnemonic.json");
        assert.instanceOf(
            catchError(() => UserWallet.loadSecretKey(keystorePath, password, NaN)),
            ErrInvalidArgument,
        );
    });

    it("should still use index 0 when no index is given (undefined or null), as before", async function () {
        this.timeout(20000);

        const expected = mnemonic.deriveKey(0).hex();
        assert.equal(UserWallet.decrypt(keyFileObject, password).hex(), expected);
        assert.equal(UserWallet.decrypt(keyFileObject, password, undefined).hex(), expected);
        assert.equal(UserWallet.decrypt(keyFileObject, password, null as any).hex(), expected);
        assert.equal(UserWallet.decrypt(keyFileObject, password, 1).hex(), mnemonic.deriveKey(1).hex());
    });
});
