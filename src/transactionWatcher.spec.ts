import { assert } from "chai";
import { TransactionWatcher } from "./transactionWatcher";
import { TransactionHash } from "./transaction";
import { MockProvider, InHyperblock, Wait } from "./testutils";
import { Nonce } from "./nonce";
import { TransactionOnNetwork } from "./networkProvider/transactions";
import { TransactionStatus } from "./networkProvider/transactionStatus";


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
            provider.mockTransactionTimelineByHash(hash, [new Wait(40), new TransactionStatus("pending"), new Wait(40), new TransactionStatus("executed"), new InHyperblock()]),
            watcher.awaitCompleted(dummyTransaction)
        ]);

        assert.isTrue((await provider.getTransactionStatus(hash)).isExecuted());
    });
});
