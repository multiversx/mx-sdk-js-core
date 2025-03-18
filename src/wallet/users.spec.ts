import { assert } from "chai";
import path from "path";
import { Account } from "../accounts";
import { Address, ErrBadMnemonicEntropy, ErrInvariantFailed, Message, Transaction } from "../core";
import {
    DummyMnemonicOf12Words,
    loadMnemonic,
    loadPassword,
    loadTestKeystore,
    loadTestWallet,
    TestWallet,
} from "./../testutils/wallets";
import { Randomness } from "./crypto";
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

        let serialized = transaction.serializeForSigning();
        let signature = await signer.sign(serialized);

        assert.deepEqual(await signer.sign(serialized), await signer.sign(Uint8Array.from(serialized)));
        assert.deepEqual(
            serialized.toString(),
            `{"nonce":0,"value":"0","receiver":"erd1cux02zersde0l7hhklzhywcxk4u9n4py5tdxyx7vrvhnza2r4gmq4vw35r","sender":"erd1l453hd0gt5gzdp7czpuall8ggt2dcv5zwmfdf3sd3lguxseux2fsmsgldz","gasPrice":1000000000,"gasLimit":50000,"data":"Zm9v","chainID":"1","version":2}`,
        );
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

        serialized = transaction.serializeForSigning();
        signature = await signer.sign(serialized);

        assert.deepEqual(await signer.sign(serialized), await signer.sign(Uint8Array.from(serialized)));
        assert.equal(
            serialized.toString(),
            `{"nonce":8,"value":"10000000000000000000","receiver":"erd1cux02zersde0l7hhklzhywcxk4u9n4py5tdxyx7vrvhnza2r4gmq4vw35r","sender":"erd1l453hd0gt5gzdp7czpuall8ggt2dcv5zwmfdf3sd3lguxseux2fsmsgldz","gasPrice":1000000000,"gasLimit":50000,"chainID":"1","version":2}`,
        );
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

        let serialized = transaction.serializeForSigning();
        let signature = await signer.sign(serialized);
        let guardianSignature = await guardianSigner.sign(serialized);

        assert.deepEqual(
            serialized.toString(),
            `{"nonce":0,"value":"0","receiver":"erd1cux02zersde0l7hhklzhywcxk4u9n4py5tdxyx7vrvhnza2r4gmq4vw35r","sender":"erd1l453hd0gt5gzdp7czpuall8ggt2dcv5zwmfdf3sd3lguxseux2fsmsgldz","gasPrice":1000000000,"gasLimit":50000,"data":"Zm9v","chainID":"1","version":2,"options":2,"guardian":"erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx"}`,
        );
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

        serialized = transaction.serializeForSigning();
        signature = await signer.sign(serialized);
        guardianSignature = await guardianSigner.sign(serialized);

        assert.equal(
            serialized.toString(),
            `{"nonce":8,"value":"10000000000000000000","receiver":"erd1cux02zersde0l7hhklzhywcxk4u9n4py5tdxyx7vrvhnza2r4gmq4vw35r","sender":"erd1l453hd0gt5gzdp7czpuall8ggt2dcv5zwmfdf3sd3lguxseux2fsmsgldz","gasPrice":1000000000,"gasLimit":50000,"chainID":"1","version":2,"options":2,"guardian":"erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx"}`,
        );
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

        const serialized = transaction.serializeForSigning();
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
