import { TransactionOnNetwork, TransactionStatus } from "@multiversx/sdk-network-providers";
import { assert } from "chai";
import { MarkCompleted, MockProvider, Wait } from "./testutils";
import { TransactionHash } from "./transaction";
import { TransactionWatcher } from "./transactionWatcher";


describe("test transactionWatcher", () => {
    it("should await status == executed", async () => {
        let hash = new TransactionHash("abba");
        let provider = new MockProvider();
        let watcher = new TransactionWatcher(provider, 42, 42 * 42);
        let dummyTransaction = {
            getHash: () => hash
        }

        provider.mockPutTransaction(hash, new TransactionOnNetwork({
            status: new TransactionStatus("unknown")
        }));

        await Promise.all([
            provider.mockTransactionTimelineByHash(hash, [new Wait(40), new TransactionStatus("pending"), new Wait(40), new TransactionStatus("executed"), new MarkCompleted()]),
            watcher.awaitCompleted(dummyTransaction)
        ]);

        assert.isTrue((await provider.getTransactionStatus(hash.hex())).isExecuted());
    });
});
