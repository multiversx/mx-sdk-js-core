import { assert } from "chai";
import { TransactionWatcher } from "./transactionWatcher";
import { TransactionHash, TransactionStatus } from "./transaction";
import { MockProvider, Wait } from "./testutils";
import { Nonce } from "./nonce";
import { TransactionOnNetwork } from "./transactionOnNetwork";


describe("test transactionWatcher", () => {
    it("should await status == executed", async () => {
        let hash = new TransactionHash("abba");
        let provider = new MockProvider();
        let watcher = new TransactionWatcher(provider, 42, 42 * 42);
        let dummyTransaction = {
            getHash: () => hash
        }

        provider.mockPutTransaction(hash, new TransactionOnNetwork({
            nonce: new Nonce(7),
            status: TransactionStatus.createUnknown()
        }));

        await Promise.all([
            provider.mockTransactionTimelineByHash(hash, [new Wait(40), new TransactionStatus("pending"), new Wait(40), new TransactionStatus("executed")]),
            watcher.awaitCompletion(dummyTransaction)
        ]);

        assert.isTrue((await provider.getTransactionStatus(hash)).isExecuted());
    });
});
