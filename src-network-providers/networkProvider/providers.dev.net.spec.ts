import { assert } from "chai";
import { ApiNetworkProvider, ProxyNetworkProvider } from ".";
import { Hash } from "../hash";
import { TransactionOnNetwork, TransactionOnNetworkType } from "../transactionOnNetwork";
import { INetworkProvider } from "../interface.networkProvider";
import { Address } from "../address";
import { loadTestWallets, TestWallet } from "../testutils";

describe("test network providers on devnet: Proxy and API", function () {
    let apiProvider: INetworkProvider = new ApiNetworkProvider("https://devnet-api.elrond.com", { timeout: 5000 });
    let proxyProvider: INetworkProvider = new ProxyNetworkProvider("https://devnet-gateway.elrond.com", { timeout: 5000 });

    let alice: TestWallet;
    let bob: TestWallet;
    let carol: TestWallet;
    let dan: TestWallet;

    before(async function () {
        ({ alice, bob, carol, dan } = await loadTestWallets());
    });

    it("should have same response for getNetworkConfig()", async function () {
        let apiResponse = await apiProvider.getNetworkConfig();
        let proxyResponse = await proxyProvider.getNetworkConfig();
        assert.deepEqual(apiResponse, proxyResponse);
    });

    it("should have same response for getNetworkStatus()", async function () {
        let apiResponse = await apiProvider.getNetworkStatus();
        let proxyResponse = await proxyProvider.getNetworkStatus();
        assert.deepEqual(apiResponse, proxyResponse);
    });

    // TODO: Enable test after implementing ProxyNetworkProvider.getNetworkStakeStatistics().
    it.skip("should have same response for getNetworkStakeStatistics()", async function () {
        let apiResponse = await apiProvider.getNetworkStakeStatistics();
        let proxyResponse = await proxyProvider.getNetworkStakeStatistics();
        assert.deepEqual(apiResponse, proxyResponse);
    });

    // TODO: Enable test after implementing ProxyNetworkProvider.getNetworkGeneralStatistics().
    it.skip("should have same response for getNetworkGeneralStatistics()", async function () {
        let apiResponse = await apiProvider.getNetworkGeneralStatistics();
        let proxyResponse = await proxyProvider.getNetworkGeneralStatistics();
        assert.deepEqual(apiResponse, proxyResponse);
    });

    it("should have same response for getAccount()", async function () {
        for (const user of [alice, bob, carol, dan]) {
            let apiResponse = await apiProvider.getAccount(user.address);
            let proxyResponse = await proxyProvider.getAccount(user.address);
            assert.deepEqual(apiResponse, proxyResponse);
        }
    });

    it.only("should have same response for getFungibleTokensOfAccount(), getFungibleTokenOfAccount()", async function () {
        this.timeout(10000);

        for (const user of [alice, bob, carol, dan]) {
            let apiResponse = await apiProvider.getFungibleTokensOfAccount(user.address);
            let proxyResponse = await proxyProvider.getFungibleTokensOfAccount(user.address);
            assert.deepEqual(apiResponse.slice(0, 100), proxyResponse.slice(0, 100));

            for (const item of apiResponse.slice(0, 5)) {
                let apiResponse = await apiProvider.getFungibleTokenOfAccount(user.address, item.tokenIdentifier);
                let proxyResponse = await proxyProvider.getFungibleTokenOfAccount(user.address, item.tokenIdentifier);
                //assert.deepEqual(apiResponse, proxyResponse, `user: ${user.address.bech32()}, token: ${item.tokenIdentifier}`);
            }
        }
    });

    it("should have same response for getNonFungibleTokensOfAccount(), getNonFungibleTokenOfAccount", async function () {
        this.timeout(10000);

        for (const user of [alice, bob, carol, dan]) {
            let apiResponse = await apiProvider.getNonFungibleTokensOfAccount(user.address);
            let proxyResponse = await proxyProvider.getNonFungibleTokensOfAccount(user.address);
            assert.deepEqual(apiResponse.slice(0, 100), proxyResponse.slice(0, 100));

            for (const item of apiResponse.slice(0, 5)) {
                // let apiResponse = await apiProvider.getNonFungibleTokenOfAccount(user.address, item.tokenIdentifier);
                // let proxyResponse = await proxyProvider.getNonFungibleTokenOfAccount(user.address, item.tokenIdentifier);
                assert.deepEqual(apiResponse, proxyResponse, `user: ${user.address.bech32()}, token: ${item.tokenIdentifier}`);
            }
        }
    });

    // it("check get transaction", async function () {
    //     this.timeout(20000);

    //     let sender = new Address("erd1testnlersh4z0wsv8kjx39me4rmnvjkwu8dsaea7ukdvvc9z396qykv7z7");
    //     let proxyProvider = chooseProxyProvider("elrond-devnet");
    //     let apiProvider = chooseApiProvider("elrond-devnet");

    //     let hashes = [
    //         new TransactionHash("b41f5fc39e96b1f194d07761c6efd6cb92278b95f5012ab12cbc910058ca8b54"),
    //         new TransactionHash("7757397a59378e9d0f6d5f08cc934c260e33a50ae0d73fdf869f7c02b6b47b33"),
    //         new TransactionHash("b87238089e81527158a6daee520280324bc7e5322ba54d1b3c9a5678abe953ea"),
    //         new TransactionHash("b45dd5e598bc85ba71639f2cbce8c5dff2fbe93159e637852fddeb16c0e84a48"),
    //         new TransactionHash("83db780e98d4d3c917668c47b33ba51445591efacb0df2a922f88e7dfbb5fc7d"),
    //         new TransactionHash("c2eb62b28cc7320da2292d87944c5424a70e1f443323c138c1affada7f6e9705")
    //     ]

    //     for (const hash of hashes) {
    //         let transactionOnProxy = await proxyProvider.getTransaction(hash, sender, true);
    //         let transactionOnAPI = await apiProvider.getTransaction(hash);

    //         ignoreKnownDifferencesBetweenProviders(transactionOnProxy, transactionOnAPI);
    //         assert.deepEqual(transactionOnProxy, transactionOnAPI);
    //     }
    // });

    // // TODO: Strive to have as little differences as possible between Proxy and API.
    // // ... On client-side (erdjs), try to handle the differences in ProxyProvider & ApiProvider, or in TransactionOnNetwork.
    // // ... Merging the providers (in the future) should solve this as well.
    // function ignoreKnownDifferencesBetweenProviders(transactionOnProxy: TransactionOnNetwork, transactionOnAPI: TransactionOnNetwork) {
    //     // Ignore status, since it differs between Proxy and API (for smart contract calls):
    //     transactionOnProxy.status = new TransactionStatus("unknown");
    //     transactionOnAPI.status = new TransactionStatus("unknown");

    //     // Ignore fields which are not present on API response:
    //     transactionOnProxy.epoch = 0;
    //     transactionOnProxy.type = new TransactionOnNetworkType();
    //     transactionOnProxy.blockNonce = new Nonce(0);
    //     transactionOnProxy.hyperblockNonce = new Nonce(0);
    //     transactionOnProxy.hyperblockHash = new Hash("");

    //     let immediateContractResultOnAPI: SmartContractResultItem = (<any>transactionOnAPI).results.immediate;
    //     let contractResultsOnAPI: SmartContractResultItem[] = (<any>transactionOnAPI).results.items;
    //     let resultingCallsOnAPI: SmartContractResultItem[] = (<any>transactionOnAPI).results.resultingCalls;
    //     let allContractResults = [immediateContractResultOnAPI].concat(resultingCallsOnAPI).concat(contractResultsOnAPI);

    //     // Important issue (existing bug)! When working with TransactionOnNetwork objects, SCRs cannot be parsed correctly from API, only from Proxy.
    //     // On API response, base64 decode "data" from smart contract results:
    //     for (const item of allContractResults) {
    //         item.data = Buffer.from(item.data, "base64").toString();
    //     }

    //     // On API response, convert "callType" of smart contract results to a number:
    //     for (const item of allContractResults) {
    //         item.callType = Number(item.callType);
    //     }

    //     // On API response, sort contract results by nonce:
    //     contractResultsOnAPI.sort(function (a: SmartContractResultItem, b: SmartContractResultItem) {
    //         return a.nonce.valueOf() - b.nonce.valueOf();
    //     });
    // }
});
