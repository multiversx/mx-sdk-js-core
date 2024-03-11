import BigNumber from "bignumber.js";
import { assert } from "chai";
import { Address } from "./address";
import { TransactionOptions, TransactionVersion } from "./networkParams";
import { TestWallet, loadTestWallets } from "./testutils";
import { TokenTransfer } from "./tokenTransfer";
import { Transaction } from "./transaction";
import { TransactionPayload } from "./transactionPayload";

describe("test transaction construction", async () => {
    let wallets: Record<string, TestWallet>;
    let minGasLimit = 50000;
    let minGasPrice = 1000000000;

    before(async function () {
        wallets = await loadTestWallets();
    });

    it("with no data, no value", async () => {
        let transaction = new Transaction({
            nonce: 89,
            value: "0",
            sender: wallets.alice.address,
            receiver: wallets.bob.address,
            gasPrice: minGasPrice,
            gasLimit: minGasLimit,
            chainID: "local-testnet",
        });

        transaction.applySignature(await wallets.alice.signer.sign(transaction.serializeForSigning()));
        assert.equal(
            transaction.getSignature().toString("hex"),
            "3f08a1dd64fbb627d10b048e0b45b1390f29bb0e457762a2ccb710b029f299022a67a4b8e45cf62f4314afec2e56b5574c71e38df96cc41fae757b7ee5062503",
        );
        assert.equal(
            transaction.getHash().toString(),
            "1359fb9d5b0b47ca9f3b4adce6e4a524fa74099dd4732743b9226774a4cb0ad8",
        );
    });

    it("with data, no value", async () => {
        let transaction = new Transaction({
            nonce: 90,
            value: "0",
            sender: wallets.alice.address,
            receiver: wallets.bob.address,
            gasPrice: minGasPrice,
            gasLimit: 80000,
            data: new TransactionPayload("hello"),
            chainID: "local-testnet",
        });

        transaction.applySignature(await wallets.alice.signer.sign(transaction.serializeForSigning()));
        assert.equal(
            transaction.getSignature().toString("hex"),
            "f9e8c1caf7f36b99e7e76ee1118bf71b55cde11a2356e2b3adf15f4ad711d2e1982469cbba7eb0afbf74e8a8f78e549b9410cd86eeaa88fcba62611ac9f6e30e",
        );
        assert.equal(
            transaction.getHash().toString(),
            "10a2bd6f9c358d2c9645368081999efd2a4cc7f24bdfdd75e8f57485fd702001",
        );
    });

    it("with data, with opaque, unused options (the protocol ignores the options when version == 1)", async () => {
        let transaction = new Transaction({
            nonce: 89,
            value: "0",
            sender: wallets.alice.address,
            receiver: wallets.bob.address,
            gasPrice: minGasPrice,
            gasLimit: minGasLimit,
            chainID: "local-testnet",
            version: new TransactionVersion(1),
            options: new TransactionOptions(1),
        });

        transaction.applySignature(await wallets.alice.signer.sign(transaction.serializeForSigning()));
        assert.equal(
            "c83e69b853a891bf2130c1839362fe2a7a8db327dcc0c9f130497a4f24b0236140b394801bb2e04ce061a6f873cb432bf1bb1e6072e295610904662ac427a30a",
            transaction.getSignature().toString("hex"),
        );
        assert.equal(
            transaction.getHash().toString(),
            "32fb1681bd532b226b5bdeed61ae62ce9416bf5e92e48caf96253ff72d1670ac",
        );
    });

    it("with data, with value", async () => {
        let transaction = new Transaction({
            nonce: 91,
            value: TokenTransfer.egldFromAmount(10),
            sender: wallets.alice.address,
            receiver: wallets.bob.address,
            gasPrice: minGasPrice,
            gasLimit: 100000,
            data: new TransactionPayload("for the book"),
            chainID: "local-testnet",
        });

        transaction.applySignature(await wallets.alice.signer.sign(transaction.serializeForSigning()));
        assert.equal(
            transaction.getSignature().toString("hex"),
            "b45f22e9f57a6df22670fcc3566723a0711a05ac2547456de59fd222a54940e4a1d99bd414897ccbf5c02a842ad86e638989b7f4d30edd26c99a8cd1eb092304",
        );
        assert.equal(
            transaction.getHash().toString(),
            "84125d7154d81a723642100bdf74e6df99f7c069c016d1e6bbeb408fd4e961bf",
        );
    });

    it("with data, with large value", async () => {
        let transaction = new Transaction({
            nonce: 92,
            value: TokenTransfer.egldFromBigInteger("123456789000000000000000000000"),
            sender: wallets.alice.address,
            receiver: wallets.bob.address,
            gasPrice: minGasPrice,
            gasLimit: 100000,
            data: new TransactionPayload("for the spaceship"),
            chainID: "local-testnet",
        });

        transaction.applySignature(await wallets.alice.signer.sign(transaction.serializeForSigning()));
        assert.equal(
            transaction.getSignature().toString("hex"),
            "01f05aa8cb0614e12a94ab9dcbde5e78370a4e05d23ef25a1fb9d5fcf1cb3b1f33b919cd8dafb1704efb18fa233a8aa0d3344fb6ee9b613a7d7a403786ffbd0a",
        );
        assert.equal(
            transaction.getHash().toString(),
            "321e1f1a0e3d06edade34fd0fdf3b4859e4328a73706a442c2439968a074113c",
        );
    });

    it("with nonce = 0", async () => {
        let transaction = new Transaction({
            nonce: 0,
            value: 0,
            sender: wallets.alice.address,
            receiver: wallets.bob.address,
            gasPrice: minGasPrice,
            gasLimit: 80000,
            data: new TransactionPayload("hello"),
            chainID: "local-testnet",
            version: new TransactionVersion(1),
        });

        transaction.applySignature(await wallets.alice.signer.sign(transaction.serializeForSigning()));
        assert.equal(
            transaction.getSignature().toString("hex"),
            "dfa3e9f2fdec60dcb353bac3b3435b4a2ff251e7e98eaf8620f46c731fc70c8ba5615fd4e208b05e75fe0f7dc44b7a99567e29f94fcd91efac7e67b182cd2a04",
        );
        assert.equal(
            transaction.getHash().toString(),
            "6ffa1a75f98aaf336bfb87ef13b9b5a477a017158285d34ee2a503668767e69e",
        );
    });

    it("without options field, should be omitted", async () => {
        let transaction = new Transaction({
            nonce: 89,
            value: 0,
            sender: wallets.alice.address,
            receiver: wallets.bob.address,
            gasPrice: minGasPrice,
            gasLimit: minGasLimit,
            chainID: "local-testnet",
        });

        transaction.applySignature(await wallets.alice.signer.sign(transaction.serializeForSigning()));
        assert.equal(
            transaction.getSignature().toString("hex"),
            "3f08a1dd64fbb627d10b048e0b45b1390f29bb0e457762a2ccb710b029f299022a67a4b8e45cf62f4314afec2e56b5574c71e38df96cc41fae757b7ee5062503",
        );
        assert.equal(
            transaction.getHash().toString(),
            "1359fb9d5b0b47ca9f3b4adce6e4a524fa74099dd4732743b9226774a4cb0ad8",
        );

        let result = transaction.serializeForSigning();
        assert.isFalse(result.toString().includes("options"));
    });

    it("with guardian field, should be omitted", async () => {
        let transaction = new Transaction({
            nonce: 89,
            value: 0,
            sender: wallets.alice.address,
            receiver: wallets.bob.address,
            gasPrice: minGasPrice,
            gasLimit: minGasLimit,
            chainID: "local-testnet",
        });

        transaction.applySignature(await wallets.alice.signer.sign(transaction.serializeForSigning()));
        assert.equal(
            transaction.getSignature().toString("hex"),
            "3f08a1dd64fbb627d10b048e0b45b1390f29bb0e457762a2ccb710b029f299022a67a4b8e45cf62f4314afec2e56b5574c71e38df96cc41fae757b7ee5062503",
        );
        assert.equal(
            transaction.getHash().toString(),
            "1359fb9d5b0b47ca9f3b4adce6e4a524fa74099dd4732743b9226774a4cb0ad8",
        );

        let result = transaction.serializeForSigning();
        assert.isFalse(result.toString().includes("options"));
    });

    it("with usernames", async () => {
        const transaction = new Transaction({
            nonce: 204,
            value: "1000000000000000000",
            sender: Address.fromBech32("erd1k2s324ww2g0yj38qn2ch2jwctdy8mnfxep94q9arncc6xecg3xaq6mjse8"),
            receiver: Address.fromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th"),
            senderUsername: "carol",
            receiverUsername: "alice",
            gasLimit: 50000,
            chainID: "T",
        });

        transaction.applySignature(await wallets.carol.signer.sign(transaction.serializeForSigning()));
        assert.equal(
            transaction.getSignature().toString("hex"),
            "51e6cd78fb3ab4b53ff7ad6864df27cb4a56d70603332869d47a5cf6ea977c30e696103e41e8dddf2582996ad335229fdf4acb726564dbc1a0bc9e705b511f06",
        );
        assert.equal(
            transaction.getHash().toString(),
            "edc84d776bfd655ddbd6fce24a83e379496ac47890d00be9c8bb2c6666fa3fd8",
        );
    });

    it("computes correct fee", () => {
        let transaction = new Transaction({
            nonce: 92,
            value: TokenTransfer.egldFromBigInteger("123456789000000000000000000000"),
            sender: wallets.alice.address,
            receiver: wallets.bob.address,
            gasPrice: 500,
            gasLimit: 20,
            chainID: "local-testnet",
        });

        let networkConfig = {
            MinGasLimit: 10,
            GasPerDataByte: 1500,
            GasPriceModifier: 0.01,
            ChainID: "local-testnet",
        };

        let fee = transaction.computeFee(networkConfig);
        assert.equal(fee.toString(), "5050");
    });

    it("computes correct fee with data field", () => {
        let transaction = new Transaction({
            nonce: 92,
            value: TokenTransfer.egldFromBigInteger("123456789000000000000000000000"),
            sender: wallets.alice.address,
            receiver: wallets.bob.address,
            data: new TransactionPayload("testdata"),
            gasPrice: 500,
            gasLimit: 12010,
            chainID: "local-testnet",
        });

        let networkConfig = {
            MinGasLimit: 10,
            GasPerDataByte: 1500,
            GasPriceModifier: 0.01,
            ChainID: "T",
        };

        let fee = transaction.computeFee(networkConfig);
        assert.equal(fee.toString(), "6005000");
    });

    it("should convert transaction to plain object and back", () => {
        const sender = wallets.alice.address;
        const transaction = new Transaction({
            nonce: 90,
            value: "123456789000000000000000000000",
            sender: sender,
            receiver: wallets.bob.address,
            senderUsername: "alice",
            receiverUsername: "bob",
            gasPrice: minGasPrice,
            gasLimit: 80000,
            data: new TransactionPayload("hello"),
            chainID: "local-testnet",
        });

        const plainObject = transaction.toPlainObject();
        const restoredTransaction = Transaction.fromPlainObject(plainObject);
        assert.deepEqual(restoredTransaction, transaction);
    });

    it("should handle large values", () => {
        const tx1 = new Transaction({
            value: "123456789000000000000000000000",
            sender: wallets.alice.address,
            receiver: wallets.bob.address,
            gasLimit: 50000,
            chainID: "local-testnet",
        });
        assert.equal(tx1.getValue().toString(), "123456789000000000000000000000");

        const tx2 = new Transaction({
            value: TokenTransfer.egldFromBigInteger("123456789000000000000000000000"),
            sender: wallets.alice.address,
            receiver: wallets.bob.address,
            gasLimit: 50000,
            chainID: "local-testnet",
        });
        assert.equal(tx2.getValue().toString(), "123456789000000000000000000000");

        const tx3 = new Transaction({
            // Passing a BigNumber is not recommended.
            // However, ITransactionValue interface is permissive, and developers may mistakenly pass such objects as values.
            // TokenTransfer objects or simple strings (see above) are preferred, instead.
            value: new BigNumber("123456789000000000000000000000"),
            sender: wallets.alice.address,
            receiver: wallets.bob.address,
            gasLimit: 50000,
            chainID: "local-testnet",
        });
        assert.equal(tx3.getValue().toString(), "123456789000000000000000000000");
    });

    it("checks correctly the version and options of the transaction", async () => {
        let transaction = new Transaction({
            nonce: 90,
            value: new BigNumber("1000000000000000000"),
            sender: wallets.alice.address,
            receiver: wallets.bob.address,
            gasPrice: minGasPrice,
            gasLimit: 80000,
            data: new TransactionPayload("hello"),
            chainID: "local-testnet",
            version: new TransactionVersion(1),
            options: TransactionOptions.withDefaultOptions(),
        });
        assert.isFalse(transaction.isGuardedTransaction());

        transaction = new Transaction({
            nonce: 90,
            value: new BigNumber("1000000000000000000"),
            sender: wallets.alice.address,
            receiver: wallets.bob.address,
            gasPrice: minGasPrice,
            gasLimit: 80000,
            data: new TransactionPayload("hello"),
            chainID: "local-testnet",
            version: new TransactionVersion(1),
            options: TransactionOptions.withOptions({ guarded: true }),
        });
        assert.isFalse(transaction.isGuardedTransaction());

        transaction = new Transaction({
            nonce: 90,
            value: new BigNumber("1000000000000000000"),
            sender: wallets.alice.address,
            receiver: wallets.bob.address,
            gasPrice: minGasPrice,
            gasLimit: 80000,
            data: new TransactionPayload("hello"),
            chainID: "local-testnet",
            version: new TransactionVersion(2),
            options: TransactionOptions.withOptions({ guarded: true }),
        });
        assert.isFalse(transaction.isGuardedTransaction());

        transaction = new Transaction({
            nonce: 90,
            value: new BigNumber("1000000000000000000"),
            sender: wallets.alice.address,
            receiver: wallets.bob.address,
            gasPrice: minGasPrice,
            gasLimit: 80000,
            data: new TransactionPayload("hello"),
            chainID: "local-testnet",
            version: new TransactionVersion(2),
            options: TransactionOptions.withOptions({ guarded: true }),
        });
        assert.isFalse(transaction.isGuardedTransaction());

        transaction = new Transaction({
            nonce: 90,
            value: new BigNumber("1000000000000000000"),
            sender: wallets.alice.address,
            receiver: wallets.bob.address,
            gasPrice: minGasPrice,
            guardian: wallets.bob.address,
            gasLimit: 80000,
            data: new TransactionPayload("hello"),
            chainID: "local-testnet",
            version: new TransactionVersion(2),
            options: TransactionOptions.withOptions({ guarded: true }),
        });
        assert.isFalse(transaction.isGuardedTransaction());

        transaction = new Transaction({
            nonce: 90,
            value: new BigNumber("1000000000000000000"),
            sender: wallets.alice.address,
            receiver: wallets.bob.address,
            gasPrice: minGasPrice,
            guardian: wallets.bob.address,
            gasLimit: 80000,
            data: new TransactionPayload("hello"),
            chainID: "local-testnet",
            version: new TransactionVersion(2),
            options: TransactionOptions.withOptions({ guarded: true }),
        });
        transaction.applySignature(await wallets.alice.signer.sign(transaction.serializeForSigning()));
        transaction.applyGuardianSignature(transaction.getSignature());
        assert.isTrue(transaction.isGuardedTransaction());
    });
});
