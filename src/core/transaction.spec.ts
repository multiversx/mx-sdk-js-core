import { Buffer } from "buffer";
import { assert } from "chai";
import { Account } from "../accounts";
import { ProtoSerializer } from "../proto";
import { getTestWalletsPath } from "../testutils/utils";
import { Address } from "./address";
import { MIN_TRANSACTION_VERSION_THAT_SUPPORTS_OPTIONS, TRANSACTION_OPTIONS_DEFAULT } from "./constants";
import { INetworkConfig } from "./interfaces";
import { Transaction } from "./transaction";
import { TransactionComputer } from "./transactionComputer";

describe("test transaction", async () => {
    let alice: Account;
    let bob: Account;
    let carol: Account;
    const minGasLimit = 50000;
    const minGasPrice = 1000000000;

    const transactionComputer = new TransactionComputer();

    const networkConfig: INetworkConfig = {
        minGasLimit: 50000n,
        gasPerDataByte: 1500n,
        gasPriceModifier: 0.01,
        chainID: "D",
    };

    before(async function () {
        alice = await Account.newFromPem(`${getTestWalletsPath()}/alice.pem`);
        bob = await Account.newFromPem(`${getTestWalletsPath()}/bob.pem`);
        carol = await Account.newFromPem(`${getTestWalletsPath()}/carol.pem`);
    });

    it("should serialize transaction for signing (without data)", async () => {
        const transaction = new Transaction({
            chainID: networkConfig.chainID,
            sender: alice.address,
            receiver: bob.address,
            gasLimit: 50000n,
            value: 0n,
            version: 2,
            nonce: 89n,
        });

        const serializedTransactionBytes = transactionComputer.computeBytesForSigning(transaction);
        const serializedTransaction = Buffer.from(serializedTransactionBytes).toString();

        assert.equal(
            serializedTransaction,
            `{"nonce":89,"value":"0","receiver":"erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx","sender":"erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th","gasPrice":1000000000,"gasLimit":50000,"chainID":"D","version":2}`,
        );
    });

    it("should serialize transaction for signing (with data)", async () => {
        const transaction = new Transaction({
            chainID: networkConfig.chainID,
            sender: alice.address,
            receiver: bob.address,
            gasLimit: 70000n,
            value: 1000000000000000000n,
            version: 2,
            nonce: 90n,
            data: new Uint8Array(Buffer.from("hello")),
        });

        const serializedTransactionBytes = transactionComputer.computeBytesForSigning(transaction);
        const serializedTransaction = Buffer.from(serializedTransactionBytes).toString();

        assert.equal(
            serializedTransaction,
            `{"nonce":90,"value":"1000000000000000000","receiver":"erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx","sender":"erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th","gasPrice":1000000000,"gasLimit":70000,"data":"aGVsbG8=","chainID":"D","version":2}`,
        );
    });

    it("should sign transaction (with no data, no value) (legacy)", async () => {
        const transaction = new Transaction({
            nonce: 89n,
            value: 0n,
            sender: alice.address,
            receiver: bob.address,
            gasPrice: BigInt(minGasPrice),
            gasLimit: BigInt(minGasLimit),
            chainID: "local-testnet",
        });

        transaction.signature = await alice.signTransaction(transaction);

        assert.equal(
            Buffer.from(transaction.signature).toString("hex"),
            "3f08a1dd64fbb627d10b048e0b45b1390f29bb0e457762a2ccb710b029f299022a67a4b8e45cf62f4314afec2e56b5574c71e38df96cc41fae757b7ee5062503",
        );
        assert.equal(
            transactionComputer.computeTransactionHash(transaction),
            "1359fb9d5b0b47ca9f3b4adce6e4a524fa74099dd4732743b9226774a4cb0ad8",
        );
    });

    it("should sign transaction (with data, no value) (legacy)", async () => {
        const transaction = new Transaction({
            nonce: 90n,
            value: 0n,
            sender: alice.address,
            receiver: bob.address,
            gasPrice: BigInt(minGasPrice),
            gasLimit: 80000n,
            data: Buffer.from("hello"),
            chainID: "local-testnet",
        });

        transaction.signature = await alice.signTransaction(transaction);

        assert.equal(
            Buffer.from(transaction.signature).toString("hex"),
            "f9e8c1caf7f36b99e7e76ee1118bf71b55cde11a2356e2b3adf15f4ad711d2e1982469cbba7eb0afbf74e8a8f78e549b9410cd86eeaa88fcba62611ac9f6e30e",
        );
        assert.equal(
            transactionComputer.computeTransactionHash(transaction),
            "10a2bd6f9c358d2c9645368081999efd2a4cc7f24bdfdd75e8f57485fd702001",
        );
    });

    it("should sign transaction (with usernames)", async () => {
        const transaction = new Transaction({
            chainID: "T",
            sender: carol.address,
            receiver: alice.address,
            gasLimit: 50000n,
            value: 1000000000000000000n,
            version: 2,
            nonce: 204n,
            senderUsername: "carol",
            receiverUsername: "alice",
        });

        transaction.signature = await carol.signTransaction(transaction);

        assert.equal(
            Buffer.from(transaction.signature).toString("hex"),
            "51e6cd78fb3ab4b53ff7ad6864df27cb4a56d70603332869d47a5cf6ea977c30e696103e41e8dddf2582996ad335229fdf4acb726564dbc1a0bc9e705b511f06",
        );
    });

    it("should compute hash", async () => {
        const transaction = new Transaction({
            chainID: networkConfig.chainID,
            sender: alice.address,
            receiver: alice.address,
            gasLimit: 100000n,
            value: 1000000000000n,
            version: 2,
            nonce: 17243n,
            data: Buffer.from("testtx"),
        });

        transaction.signature = Buffer.from(
            "eaa9e4dfbd21695d9511e9754bde13e90c5cfb21748a339a79be11f744c71872e9fe8e73c6035c413f5f08eef09e5458e9ea6fc315ff4da0ab6d000b450b2a07",
            "hex",
        );

        const hash = transactionComputer.computeTransactionHash(transaction);

        assert.equal(hash, "169b76b752b220a76a93aeebc462a1192db1dc2ec9d17e6b4d7b0dcc91792f03");
    });

    it("should compute hash (with usernames)", async () => {
        const transaction = new Transaction({
            chainID: networkConfig.chainID,
            sender: alice.address,
            receiver: alice.address,
            gasLimit: 100000n,
            value: 1000000000000n,
            version: 2,
            nonce: 17244n,
            data: Buffer.from("testtx"),
            senderUsername: "alice",
            receiverUsername: "alice",
        });

        transaction.signature = Buffer.from(
            "807bcd7de5553ea6dfc57c0510e84d46813c5963d90fec50991c500091408fcf6216dca48dae16a579a1611ed8b2834bae8bd0027dc17eb557963f7151b82c07",
            "hex",
        );

        const hash = transactionComputer.computeTransactionHash(transaction);

        assert.equal(hash, "41b5acf7ebaf4a9165a64206b6ebc02021b3adda55ffb2a2698aac2e7004dc29");
    });

    it("should sign & compute hash (with data, with opaque, unused options) (legacy)", async () => {
        const transaction = new Transaction({
            nonce: 89n,
            value: 0n,
            sender: alice.address,
            receiver: bob.address,
            gasPrice: BigInt(minGasPrice),
            gasLimit: BigInt(minGasLimit),
            chainID: "local-testnet",
            // The protocol ignores the options when version == 1
            version: 1,
            options: 1,
        });

        assert.throws(() => {
            transactionComputer.computeBytesForSigning(transaction);
        }, `Non-empty transaction options requires transaction version >= ${MIN_TRANSACTION_VERSION_THAT_SUPPORTS_OPTIONS}`);
    });

    it("should sign & compute hash (with data, with value) (legacy)", async () => {
        const transaction = new Transaction({
            nonce: 91n,
            value: 10000000000000000000n,
            sender: alice.address,
            receiver: bob.address,
            gasPrice: BigInt(minGasPrice),
            gasLimit: 100000n,
            data: Buffer.from("for the book"),
            chainID: "local-testnet",
        });

        transaction.signature = await alice.signTransaction(transaction);

        assert.equal(
            Buffer.from(transaction.signature).toString("hex"),
            "b45f22e9f57a6df22670fcc3566723a0711a05ac2547456de59fd222a54940e4a1d99bd414897ccbf5c02a842ad86e638989b7f4d30edd26c99a8cd1eb092304",
        );
        assert.equal(
            transactionComputer.computeTransactionHash(transaction).toString(),
            "84125d7154d81a723642100bdf74e6df99f7c069c016d1e6bbeb408fd4e961bf",
        );
    });

    it("should sign & compute hash (with data, with large value) (legacy)", async () => {
        const transaction = new Transaction({
            nonce: 92n,
            value: BigInt("123456789000000000000000000000"),
            sender: alice.address,
            receiver: bob.address,
            gasPrice: BigInt(minGasPrice),
            gasLimit: 100000n,
            data: Buffer.from("for the spaceship"),
            chainID: "local-testnet",
        });

        transaction.signature = await alice.signTransaction(transaction);

        assert.equal(
            Buffer.from(transaction.signature).toString("hex"),
            "01f05aa8cb0614e12a94ab9dcbde5e78370a4e05d23ef25a1fb9d5fcf1cb3b1f33b919cd8dafb1704efb18fa233a8aa0d3344fb6ee9b613a7d7a403786ffbd0a",
        );
        assert.equal(
            transactionComputer.computeTransactionHash(transaction),
            "321e1f1a0e3d06edade34fd0fdf3b4859e4328a73706a442c2439968a074113c",
        );
    });

    it("should sign & compute hash (with nonce = 0) (legacy)", async () => {
        const transaction = new Transaction({
            nonce: 0n,
            value: 0n,
            sender: alice.address,
            receiver: bob.address,
            gasPrice: BigInt(minGasPrice),
            gasLimit: 80000n,
            data: Buffer.from("hello"),
            chainID: "local-testnet",
            version: 1,
        });

        transaction.signature = await alice.signTransaction(transaction);

        assert.equal(
            Buffer.from(transaction.signature).toString("hex"),
            "dfa3e9f2fdec60dcb353bac3b3435b4a2ff251e7e98eaf8620f46c731fc70c8ba5615fd4e208b05e75fe0f7dc44b7a99567e29f94fcd91efac7e67b182cd2a04",
        );
        assert.equal(
            transactionComputer.computeTransactionHash(transaction),
            "6ffa1a75f98aaf336bfb87ef13b9b5a477a017158285d34ee2a503668767e69e",
        );
    });

    it("should sign & compute hash (without options field, should be omitted) (legacy)", async () => {
        const transaction = new Transaction({
            nonce: 89n,
            value: 0n,
            sender: alice.address,
            receiver: bob.address,
            gasPrice: BigInt(minGasPrice),
            gasLimit: BigInt(minGasLimit),
            chainID: "local-testnet",
        });

        transaction.signature = await alice.signTransaction(transaction);

        assert.equal(
            Buffer.from(transaction.signature).toString("hex"),
            "3f08a1dd64fbb627d10b048e0b45b1390f29bb0e457762a2ccb710b029f299022a67a4b8e45cf62f4314afec2e56b5574c71e38df96cc41fae757b7ee5062503",
        );
        assert.equal(
            transactionComputer.computeTransactionHash(transaction),
            "1359fb9d5b0b47ca9f3b4adce6e4a524fa74099dd4732743b9226774a4cb0ad8",
        );

        const result = transactionComputer.computeBytesForSigning(transaction);
        assert.isFalse(result.toString().includes("options"));
    });

    it("should sign & compute hash (with guardian field, should be omitted) (legacy)", async () => {
        const transaction = new Transaction({
            nonce: 89n,
            value: 0n,
            sender: alice.address,
            receiver: bob.address,
            gasPrice: BigInt(minGasPrice),
            gasLimit: BigInt(minGasLimit),
            chainID: "local-testnet",
        });

        transaction.signature = await alice.signTransaction(transaction);

        assert.equal(
            Buffer.from(transaction.signature).toString("hex"),
            "3f08a1dd64fbb627d10b048e0b45b1390f29bb0e457762a2ccb710b029f299022a67a4b8e45cf62f4314afec2e56b5574c71e38df96cc41fae757b7ee5062503",
        );
        assert.equal(
            transactionComputer.computeTransactionHash(transaction),
            "1359fb9d5b0b47ca9f3b4adce6e4a524fa74099dd4732743b9226774a4cb0ad8",
        );

        const result = transactionComputer.computeBytesForSigning(transaction);
        assert.isFalse(result.toString().includes("options"));
    });

    it("should sign & compute hash (with usernames) (legacy)", async () => {
        const transaction = new Transaction({
            nonce: 204n,
            value: 1000000000000000000n,
            sender: Address.newFromBech32("erd1k2s324ww2g0yj38qn2ch2jwctdy8mnfxep94q9arncc6xecg3xaq6mjse8"),
            receiver: Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th"),
            senderUsername: "carol",
            receiverUsername: "alice",
            gasLimit: 50000n,
            chainID: "T",
        });

        transaction.signature = await carol.signTransaction(transaction);

        assert.equal(
            Buffer.from(transaction.signature).toString("hex"),
            "51e6cd78fb3ab4b53ff7ad6864df27cb4a56d70603332869d47a5cf6ea977c30e696103e41e8dddf2582996ad335229fdf4acb726564dbc1a0bc9e705b511f06",
        );
        assert.equal(
            transactionComputer.computeTransactionHash(transaction),
            "edc84d776bfd655ddbd6fce24a83e379496ac47890d00be9c8bb2c6666fa3fd8",
        );
    });

    it("should sign & compute hash (guarded transaction)", async () => {
        const transaction = new Transaction({
            chainID: "local-testnet",
            sender: alice.address,
            receiver: bob.address,
            gasLimit: 150000n,
            gasPrice: 1000000000n,
            data: new Uint8Array(Buffer.from("test data field")),
            version: 2,
            options: 2,
            nonce: 92n,
            value: 123456789000000000000000000000n,
            guardian: Address.newFromBech32("erd1x23lzn8483xs2su4fak0r0dqx6w38enpmmqf2yrkylwq7mfnvyhsxqw57y"),
        });
        transaction.guardianSignature = new Uint8Array(64);
        transaction.signature = await alice.signTransaction(transaction);

        const serializer = new ProtoSerializer();
        const buffer = serializer.serializeTransaction(transaction);

        assert.equal(
            buffer.toString("hex"),
            "085c120e00018ee90ff6181f3761632000001a208049d639e5a6980d1cd2392abcce41029cda74a1563523a202f09641cc2618f82a200139472eff6886771a982f3083da5d421f24c29181e63888228dc81ca60d69e1388094ebdc0340f093094a0f746573742064617461206669656c64520d6c6f63616c2d746573746e657458026240e574d78b19e1481a6b9575c162e66f2f906a3178aec537509356385c4f1a5330a9b73a87a456fc6d7041e93b5f8a1231a92fb390174872a104a0929215600c0c6802722032a3f14cf53c4d0543954f6cf1bda0369d13e661dec095107627dc0f6d33612f7a4000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        );

        const txHash = transactionComputer.computeTransactionHash(transaction);
        assert.equal(txHash, "242022e9dcfa0ee1d8199b0043314dbda8601619f70069ebc441b9f03349a35c");
    });

    it("computes fee (legacy)", () => {
        const transaction = new Transaction({
            nonce: 92n,
            value: BigInt("123456789000000000000000000000"),
            sender: alice.address,
            receiver: bob.address,
            gasPrice: BigInt(minGasPrice),
            gasLimit: BigInt(minGasLimit),
            chainID: "local-testnet",
        });

        const fee = transactionComputer.computeTransactionFee(transaction, networkConfig);
        assert.equal(fee.toString(), "50000000000000");
    });

    it("computes fee", async () => {
        const transaction = new Transaction({
            chainID: "D",
            sender: alice.address,
            receiver: alice.address,
            gasLimit: 50000n,
            gasPrice: BigInt(minGasPrice),
        });

        const gasLimit = transactionComputer.computeTransactionFee(transaction, networkConfig);
        assert.equal(gasLimit.toString(), "50000000000000");
    });

    it("computes fee, but should throw `NotEnoughGas` error", async () => {
        const transaction = new Transaction({
            chainID: networkConfig.chainID,
            sender: alice.address,
            receiver: alice.address,
            gasLimit: 50000n,
            data: Buffer.from("toolittlegaslimit"),
        });

        assert.throws(() => {
            transactionComputer.computeTransactionFee(transaction, networkConfig);
        });
    });

    it("computes fee (with data field) (legacy)", () => {
        let transaction = new Transaction({
            nonce: 92n,
            value: BigInt("123456789000000000000000000000"),
            sender: alice.address,
            receiver: bob.address,
            data: Buffer.from("testdata"),
            gasPrice: BigInt(minGasPrice),
            gasLimit: BigInt(minGasLimit + 12010),
            chainID: "local-testnet",
        });

        let fee = transactionComputer.computeTransactionFee(transaction, networkConfig);
        assert.equal(fee.toString(), "62000100000000");
    });

    it("computes fee (with data field)", async () => {
        const transaction = new Transaction({
            chainID: networkConfig.chainID,
            sender: alice.address,
            receiver: alice.address,
            gasLimit: 50000n + 12010n,
            gasPrice: BigInt(minGasPrice),
            data: Buffer.from("testdata"),
        });

        const gasLimit = transactionComputer.computeTransactionFee(transaction, networkConfig);
        assert.equal(gasLimit.toString(), "62000100000000");
    });

    it("should convert transaction to plain object and back", () => {
        const sender = alice.address;
        const transaction = new Transaction({
            nonce: 90n,
            value: 123456789000000000000000000000n,
            sender: sender,
            receiver: bob.address,
            senderUsername: "alice",
            receiverUsername: "bob",
            gasPrice: BigInt(minGasPrice),
            gasLimit: 80000n,
            data: Buffer.from("hello"),
            chainID: "local-testnet",
        });

        const plainObject = transaction.toPlainObject();
        const restoredTransaction = Transaction.newFromPlainObject(plainObject);
        assert.deepEqual(restoredTransaction, transaction);
    });

    it("should handle large values", () => {
        const tx1 = new Transaction({
            value: 123456789000000000000000000000n,
            sender: alice.address,
            receiver: bob.address,
            gasLimit: 50000n,
            chainID: "local-testnet",
        });
        assert.equal(tx1.value.toString(), "123456789000000000000000000000");

        const tx2 = new Transaction({
            value: 123456789000000000000000000000n,
            sender: alice.address,
            receiver: bob.address,
            gasLimit: 50000n,
            chainID: "local-testnet",
        });
        assert.equal(tx2.value.toString(), "123456789000000000000000000000");

        const tx3 = new Transaction({
            value: BigInt("123456789000000000000000000000"),
            sender: alice.address,
            receiver: bob.address,
            gasLimit: 50000n,
            chainID: "local-testnet",
        });
        assert.equal(tx3.value.toString(), "123456789000000000000000000000");
    });

    it("checks correctly the version and options of the transaction", async () => {
        let transaction = new Transaction({
            nonce: 90n,
            value: BigInt("1000000000000000000"),
            sender: alice.address,
            receiver: bob.address,
            gasPrice: BigInt(minGasPrice),
            gasLimit: 80000n,
            data: Buffer.from("hello"),
            chainID: "local-testnet",
            version: 1,
            options: TRANSACTION_OPTIONS_DEFAULT,
        });
        assert.isFalse(transaction.isGuardedTransaction());

        transaction = new Transaction({
            nonce: 90n,
            value: BigInt("1000000000000000000"),
            sender: alice.address,
            receiver: bob.address,
            gasPrice: BigInt(minGasPrice),
            gasLimit: 80000n,
            data: Buffer.from("hello"),
            chainID: "local-testnet",
            version: 1,
            options: 2,
        });
        assert.isFalse(transaction.isGuardedTransaction());

        transaction = new Transaction({
            nonce: 90n,
            value: BigInt("1000000000000000000"),
            sender: alice.address,
            receiver: bob.address,
            gasPrice: BigInt(minGasPrice),
            gasLimit: 80000n,
            data: Buffer.from("hello"),
            chainID: "local-testnet",
            version: 2,
            options: 2,
        });
        assert.isFalse(transaction.isGuardedTransaction());

        transaction = new Transaction({
            nonce: 90n,
            value: BigInt("1000000000000000000"),
            sender: alice.address,
            receiver: bob.address,
            gasPrice: BigInt(minGasPrice),
            gasLimit: 80000n,
            data: Buffer.from("hello"),
            chainID: "local-testnet",
            version: 2,
            options: 2,
        });
        assert.isFalse(transaction.isGuardedTransaction());

        transaction = new Transaction({
            nonce: 90n,
            value: BigInt("1000000000000000000"),
            sender: alice.address,
            receiver: bob.address,
            gasPrice: BigInt(minGasPrice),
            guardian: bob.address,
            gasLimit: 80000n,
            data: Buffer.from("hello"),
            chainID: "local-testnet",
            version: 2,
            options: 2,
        });
        assert.isFalse(transaction.isGuardedTransaction());

        transaction = new Transaction({
            nonce: 90n,
            value: BigInt("1000000000000000000"),
            sender: alice.address,
            receiver: bob.address,
            gasPrice: BigInt(minGasPrice),
            guardian: bob.address,
            gasLimit: 80000n,
            data: Buffer.from("hello"),
            chainID: "local-testnet",
            version: 2,
            options: 2,
        });
        transaction.signature = await alice.signTransaction(transaction);
        transaction.guardianSignature = transaction.signature;
        assert.isTrue(transaction.isGuardedTransaction());
    });

    it("test sign using hash", async () => {
        let transaction = new Transaction({
            nonce: 89n,
            value: 0n,
            sender: alice.address,
            receiver: bob.address,
            gasLimit: 50000n,
            gasPrice: 1000000000n,
            chainID: "integration tests chain ID",
            version: 2,
            options: 1,
        });

        transaction.signature = await alice.sign(transactionComputer.computeHashForSigning(transaction));

        assert.equal(
            Buffer.from(transaction.signature).toString("hex"),
            "f0c81f2393b1ec5972c813f817bae8daa00ade91c6f75ea604ab6a4d2797aca4378d783023ff98f1a02717fe4f24240cdfba0b674ee9abb18042203d713bc70a",
        );
    });

    it("should apply guardian", async () => {
        let transaction = new Transaction({
            nonce: 89n,
            value: 0n,
            sender: alice.address,
            receiver: bob.address,
            gasLimit: 50000n,
            chainID: "localnet",
        });

        transactionComputer.applyGuardian(transaction, carol.address);

        assert.equal(transaction.version, 2);
        assert.equal(transaction.options, 2);
        assert.equal(transaction.guardian, carol.address);
    });

    it("should apply guardian with options set for hash signing", async () => {
        let transaction = new Transaction({
            nonce: 89n,
            value: 0n,
            sender: alice.address,
            receiver: bob.address,
            gasLimit: 50000n,
            chainID: "localnet",
            version: 1,
        });

        transactionComputer.applyOptionsForHashSigning(transaction);
        assert.equal(transaction.version, 2);
        assert.equal(transaction.options, 1);

        transactionComputer.applyGuardian(transaction, carol.address);
        assert.equal(transaction.version, 2);
        assert.equal(transaction.options, 3);
    });

    it("should ensure transaction is valid", async () => {
        let transaction = new Transaction({
            sender: Address.empty(),
            receiver: bob.address,
            gasLimit: 50000n,
            chainID: "",
        });

        transaction.sender = alice.address;

        assert.throws(() => {
            transactionComputer.computeBytesForSigning(transaction);
        }, "The `chainID` field is not set");

        transaction.chainID = "localnet";
        transaction.version = 1;
        transaction.options = 2;

        assert.throws(() => {
            transactionComputer.computeBytesForSigning(transaction);
        }, `Non-empty transaction options requires transaction version >= ${MIN_TRANSACTION_VERSION_THAT_SUPPORTS_OPTIONS}`);

        transactionComputer.applyOptionsForHashSigning(transaction);

        assert.equal(transaction.version, 2);
        assert.equal(transaction.options, 3);
    });

    it("should compute bytes to verify transaction signature", async () => {
        let transaction = new Transaction({
            sender: alice.address,
            receiver: bob.address,
            gasLimit: 50000n,
            chainID: "D",
            nonce: 7n,
        });

        transaction.signature = await alice.signTransaction(transaction);

        const isSignedByAlice = await alice.verifyTransactionSignature(transaction, transaction.signature);

        const isSignedByBob = await bob.verifyTransactionSignature(transaction, transaction.signature);

        assert.equal(isSignedByAlice, true);
        assert.equal(isSignedByBob, false);
    });

    it("should compute bytes to verify transaction signature (signed by hash)", async () => {
        let transaction = new Transaction({
            sender: alice.address,
            receiver: bob.address,
            gasLimit: 50000n,
            chainID: "D",
            nonce: 7n,
        });

        transactionComputer.applyOptionsForHashSigning(transaction);

        transaction.signature = await alice.sign(transactionComputer.computeHashForSigning(transaction));

        const isSignedByAlice = await alice.verifyTransactionSignature(transaction, transaction.signature);

        const isSignedByBob = await bob.verifyTransactionSignature(transaction, transaction.signature);
        assert.equal(isSignedByAlice, true);
        assert.equal(isSignedByBob, false);
    });

    it("converts transaction to plain object and back", () => {
        const transaction = new Transaction({
            nonce: 90n,
            value: BigInt("123456789000000000000000000000"),
            sender: Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th"),
            receiver: Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx"),
            senderUsername: "alice",
            receiverUsername: "bob",
            gasPrice: 1000000000n,
            gasLimit: 80000n,
            data: Buffer.from("hello"),
            chainID: "localnet",
            version: 2,
        });

        const plainObject = transaction.toPlainObject();
        const restoredTransaction = Transaction.newFromPlainObject(plainObject);

        assert.deepEqual(plainObject, transaction.toPlainObject());
        assert.deepEqual(restoredTransaction, Transaction.newFromPlainObject(plainObject));
        assert.deepEqual(restoredTransaction, transaction);
        assert.deepEqual(plainObject, {
            nonce: 90,
            value: "123456789000000000000000000000",
            sender: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
            receiver: "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx",
            senderUsername: "YWxpY2U=",
            receiverUsername: "Ym9i",
            gasPrice: 1000000000,
            gasLimit: 80000,
            data: "aGVsbG8=",
            chainID: "localnet",
            version: 2,
            options: undefined,
            guardian: undefined,
            relayer: undefined,
            signature: undefined,
            guardianSignature: undefined,
            relayerSignature: undefined,
        });
    });
    it("should serialize transaction with relayer", async () => {
        const transaction = new Transaction({
            chainID: networkConfig.chainID,
            sender: alice.address,
            receiver: alice.address,
            relayer: bob.address,
            gasLimit: 50000n,
            value: 0n,
            version: 2,
            nonce: 89n,
        });

        const serializedTransactionBytes = transactionComputer.computeBytesForSigning(transaction);
        const serializedTransaction = Buffer.from(serializedTransactionBytes).toString();

        assert.equal(
            serializedTransaction,
            `{"nonce":89,"value":"0","receiver":"erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th","sender":"erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th","gasPrice":1000000000,"gasLimit":50000,"chainID":"D","version":2,"relayer":"erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx"}`,
        );
    });

    it("should test relayed v3", async () => {
        const transaction = new Transaction({
            chainID: networkConfig.chainID,
            sender: alice.address,
            receiver: alice.address,
            senderUsername: "alice",
            receiverUsername: "bob",
            gasLimit: 80000n,
            value: 0n,
            version: 2,
            nonce: 89n,
            data: Buffer.from("hello"),
        });

        assert.isFalse(transactionComputer.isRelayedV3Transaction(transaction));
        transaction.relayer = carol.address;
        assert.isTrue(transactionComputer.isRelayedV3Transaction(transaction));
    });
});
