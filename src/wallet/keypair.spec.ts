import { assert } from "chai";
import { Address, Transaction, TransactionComputer } from "../core";
import { KeyPair } from "./keypair";
import { UserSecretKey } from "./userKeys";

describe("test keypair", () => {
    it("should create keypair", () => {
        const buffer_hex = "413f42575f7f26fad3317a778771212fdb80245850981e48b58a4f25e344e8f9";
        const buffer = Uint8Array.from(Buffer.from(buffer_hex, "hex"));
        const userSecretKey = UserSecretKey.fromString(buffer_hex);
        let keypair = KeyPair.newFromBytes(buffer);
        let secretKey = keypair.getSecretKey();
        assert.equal(secretKey.hex(), buffer_hex);
        assert.equal(keypair.secretKey.hex(), buffer_hex);
        assert.deepEqual(secretKey, userSecretKey);

        keypair = new KeyPair(secretKey);
        assert.deepEqual(keypair.getSecretKey(), userSecretKey);
        assert.deepEqual(keypair.getPublicKey(), userSecretKey.generatePublicKey());

        keypair = KeyPair.generate();
        const pubkey = keypair.getPublicKey();
        secretKey = keypair.getSecretKey();
        assert.lengthOf(pubkey.valueOf(), 32);
        assert.lengthOf(secretKey.valueOf(), 32);
    });

    it("should sign and verify transaction", async () => {
        const transaction = new Transaction({
            nonce: 89n,
            value: 0n,
            receiver: Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx"),
            sender: Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th"),
            gasPrice: 1000000000n,
            gasLimit: 50000n,
            chainID: "local-testnet",
            version: 1,
            options: 0,
        });
        const bufferHex = "413f42575f7f26fad3317a778771212fdb80245850981e48b58a4f25e344e8f9";
        const buffer = Uint8Array.from(Buffer.from(bufferHex, "hex"));
        const keypair = KeyPair.newFromBytes(buffer);

        const transactionComputer = new TransactionComputer();
        const serializedTx = transactionComputer.computeBytesForSigning(transaction);
        transaction.signature = await keypair.sign(serializedTx);
        assert.equal(
            Buffer.from(transaction.signature).toString("hex"),
            "b56769014f2bdc5cf9fc4a05356807d71fcf8775c819b0f1b0964625b679c918ffa64862313bfef86f99b38cb84fcdb16fa33ad6eb565276616723405cd8f109",
        );
        assert.isTrue(await keypair.verify(serializedTx, transaction.signature));
    });
});
