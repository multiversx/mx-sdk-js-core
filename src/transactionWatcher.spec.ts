import { assert } from "chai";
import { TransactionWatcher } from "./transactionWatcher";
import { TransactionHash } from "./transaction";
import { MockProvider, InHyperblock, Wait } from "./testutils";
import { MockTransactionOnNetwork, MockTransactionStatus } from "./testutils/networkProviders";


describe("test transactionWatcher", () => {
    it("should await status == executed", async () => {
        let hash = new TransactionHash("abba");
        let provider = new MockProvider();
        let watcher = new TransactionWatcher(provider, 42, 42 * 42);
        let dummyTransaction = {
            getHash: () => hash
        }

        provider.mockPutTransaction(hash, new MockTransactionOnNetwork({
            status: new MockTransactionStatus("unknown")
        }));

        await Promise.all([
            provider.mockTransactionTimelineByHash(hash, [new Wait(40), new MockTransactionStatus("pending"), new Wait(40), new MockTransactionStatus("executed"), new InHyperblock()]),
            watcher.awaitCompleted(dummyTransaction)
        ]);

        assert.isTrue((await provider.getTransactionStatus(hash)).isExecuted());
    });
});
