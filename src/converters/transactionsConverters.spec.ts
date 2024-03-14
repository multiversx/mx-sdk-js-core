import { assert } from "chai";
import { Transaction } from "../transaction";

describe("test transactions converter", async () => {
    it("converts transaction to plain object and back", () => {
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
        });

        const plainObject = transaction.toPlainObject();
        const restoredTransaction = Transaction.fromPlainObject(plainObject);
        assert.deepEqual(restoredTransaction, transaction);
    });
});
