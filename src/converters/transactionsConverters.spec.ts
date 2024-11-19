import { assert } from "chai";
import { Transaction } from "../transaction";
import { TransactionsConverter } from "./transactionsConverter";

describe("test transactions converter", async () => {
    it("converts transaction to plain object and back", () => {
        const converter = new TransactionsConverter();

        const transaction = new Transaction({
            nonce: 90,
            value: BigInt("123456789000000000000000000000"),
            sender: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
            receiver: "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx",
            senderUsername: "alice",
            receiverUsername: "bob",
            gasPrice: 1000000000,
            gasLimit: 80000,
            data: Buffer.from("hello"),
            chainID: "localnet",
            version: 2,
        });

        const plainObject = converter.transactionToPlainObject(transaction);
        const restoredTransaction = converter.plainObjectToTransaction(plainObject);

        assert.deepEqual(plainObject, transaction.toPlainObject());
        assert.deepEqual(restoredTransaction, Transaction.fromPlainObject(plainObject));
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
            signature: undefined,
            guardianSignature: undefined,
        });
    });
});
