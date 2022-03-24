import { assert } from "chai";
import { chooseApiProvider, chooseProxyProvider } from "./interactive";
import { Hash } from "./hash";
import { TransactionOnNetwork, TransactionOnNetworkType } from "./transactionOnNetwork";
import { TransactionHash, TransactionStatus } from "./transaction";
import { Address } from "./address";
import { Nonce } from "./nonce";
import { SmartContractResultItem } from "./smartcontracts";

describe("test transactions on devnet", function () {
    it("should get transaction from Proxy & from API", async function () {
        this.timeout(20000);

        let sender = new Address("erd1testnlersh4z0wsv8kjx39me4rmnvjkwu8dsaea7ukdvvc9z396qykv7z7");
        let proxyProvider = chooseProxyProvider("elrond-devnet");
        let apiProvider = chooseApiProvider("elrond-devnet");

        let hashes = [
            new TransactionHash("b41f5fc39e96b1f194d07761c6efd6cb92278b95f5012ab12cbc910058ca8b54"),
            new TransactionHash("7757397a59378e9d0f6d5f08cc934c260e33a50ae0d73fdf869f7c02b6b47b33"),
            new TransactionHash("b87238089e81527158a6daee520280324bc7e5322ba54d1b3c9a5678abe953ea"),
            new TransactionHash("b45dd5e598bc85ba71639f2cbce8c5dff2fbe93159e637852fddeb16c0e84a48"),
            new TransactionHash("83db780e98d4d3c917668c47b33ba51445591efacb0df2a922f88e7dfbb5fc7d"),
            new TransactionHash("c2eb62b28cc7320da2292d87944c5424a70e1f443323c138c1affada7f6e9705")
        ]

        for (const hash of hashes) {
            let transactionOnProxy = await proxyProvider.getTransaction(hash, sender, true);
            let transactionOnAPI = await apiProvider.getTransaction(hash);

            ignoreKnownDifferencesBetweenProviders(transactionOnProxy, transactionOnAPI);
            assert.deepEqual(transactionOnProxy, transactionOnAPI);
        }
    });

    // TODO: Strive to have as little differences as possible between Proxy and API.
    // ... On client-side (erdjs), try to handle the differences in ProxyProvider & ApiProvider, or in TransactionOnNetwork.
    // ... Merging the providers (in the future) should solve this as well.
    function ignoreKnownDifferencesBetweenProviders(transactionOnProxy: TransactionOnNetwork, transactionOnAPI: TransactionOnNetwork) {
        // Ignore status, since it differs between Proxy and API (for smart contract calls):
        transactionOnProxy.status = new TransactionStatus("unknown");
        transactionOnAPI.status = new TransactionStatus("unknown");

        // Ignore fields which are not present on API response:
        transactionOnProxy.epoch = 0;
        transactionOnProxy.type = new TransactionOnNetworkType();
        transactionOnProxy.blockNonce = new Nonce(0);
        transactionOnProxy.hyperblockNonce = new Nonce(0);
        transactionOnProxy.hyperblockHash = new Hash("");

        let contractResultsOnAPI: SmartContractResultItem[] = transactionOnAPI.results.getAll();

        // Important issue (existing bug)! When working with TransactionOnNetwork objects, SCRs cannot be parsed correctly from API, only from Proxy.
        // On API response, base64 decode "data" from smart contract results:
        for (const item of contractResultsOnAPI) {
            item.data = Buffer.from(item.data, "base64").toString();
        }

        // On API response, convert "callType" of smart contract results to a number:
        for (const item of contractResultsOnAPI) {
            item.callType = Number(item.callType);
        }

        // On API response, sort contract results by nonce:
        contractResultsOnAPI.sort(function (a: SmartContractResultItem, b: SmartContractResultItem) {
            return a.nonce.valueOf() - b.nonce.valueOf();
        });
    }
});
