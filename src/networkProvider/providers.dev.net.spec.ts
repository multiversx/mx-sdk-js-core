import { assert } from "chai";
import { ApiNetworkProvider, ProxyNetworkProvider } from ".";
import { Hash } from "../hash";
import { INetworkProvider, ITransactionOnNetwork } from "../interface.networkProvider";
import { Address } from "../address";
import { loadTestWallets, TestWallet } from "../testutils";
import { TransactionHash, TransactionStatus } from "../transaction";
import { Nonce } from "../nonce";

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

    it("should have same response for getFungibleTokensOfAccount(), getFungibleTokenOfAccount()", async function () {
        this.timeout(10000);

        for (const user of [alice, bob, carol, dan]) {
            let apiResponse = await apiProvider.getFungibleTokensOfAccount(user.address);
            let proxyResponse = await proxyProvider.getFungibleTokensOfAccount(user.address);
            assert.deepEqual(apiResponse.slice(0, 100), proxyResponse.slice(0, 100));

            // for (const item of apiResponse.slice(0, 5)) {
            //     let apiResponse = await apiProvider.getFungibleTokenOfAccount(user.address, item.tokenIdentifier);
            //     let proxyResponse = await proxyProvider.getFungibleTokenOfAccount(user.address, item.tokenIdentifier);
            //     //assert.deepEqual(apiResponse, proxyResponse, `user: ${user.address.bech32()}, token: ${item.tokenIdentifier}`);
            // }
        }
    });

    it.only("should have same response for getNonFungibleTokensOfAccount(), getNonFungibleTokenOfAccount", async function () {
        this.timeout(10000);

        for (const user of [alice, bob, carol, dan]) {
            let apiResponse = await apiProvider.getNonFungibleTokensOfAccount(user.address);
            let proxyResponse = await proxyProvider.getNonFungibleTokensOfAccount(user.address);
            assert.deepEqual(apiResponse.slice(0, 100), proxyResponse.slice(0, 100));

            for (const item of apiResponse.slice(0, 5)) {
                let apiResponse = await apiProvider.getNonFungibleTokenOfAccount(user.address, item.collection, item.nonce);
                let proxyResponse = await proxyProvider.getNonFungibleTokenOfAccount(user.address, item.collection, item.nonce);
                assert.deepEqual(apiResponse, proxyResponse, `user: ${user.address.bech32()}, token: ${item.tokenIdentifier}`);
            }
        }
    });

    it("should have same response for getTransaction(), getTransactionStatus()", async function () {
        this.timeout(20000);

        let sender = new Address("erd1testnlersh4z0wsv8kjx39me4rmnvjkwu8dsaea7ukdvvc9z396qykv7z7");

        let hashes = [
            new TransactionHash("b41f5fc39e96b1f194d07761c6efd6cb92278b95f5012ab12cbc910058ca8b54"),
            new TransactionHash("7757397a59378e9d0f6d5f08cc934c260e33a50ae0d73fdf869f7c02b6b47b33"),
            new TransactionHash("b87238089e81527158a6daee520280324bc7e5322ba54d1b3c9a5678abe953ea"),
            new TransactionHash("b45dd5e598bc85ba71639f2cbce8c5dff2fbe93159e637852fddeb16c0e84a48"),
            new TransactionHash("83db780e98d4d3c917668c47b33ba51445591efacb0df2a922f88e7dfbb5fc7d"),
            new TransactionHash("c2eb62b28cc7320da2292d87944c5424a70e1f443323c138c1affada7f6e9705")
        ];

        for (const hash of hashes) {
            let apiResponse = await apiProvider.getTransaction(hash);
            let proxyResponse = await proxyProvider.getTransaction(hash, sender);
            
            ignoreKnownTxDifferencesBetweenProviders(apiResponse, proxyResponse);
            assert.deepEqual(apiResponse, proxyResponse);
        }
    });

    // TODO: Strive to have as little differences as possible between Proxy and API.
    function ignoreKnownTxDifferencesBetweenProviders(apiResponse: ITransactionOnNetwork, proxyResponse: ITransactionOnNetwork) {
        apiResponse.status = proxyResponse.status = new TransactionStatus("ignore");
        apiResponse.type = proxyResponse.type = { value: "ignore" };

        // Ignore fields which are not present on API response:
        proxyResponse.epoch = 0;
        proxyResponse.blockNonce = new Nonce(0);
        proxyResponse.hyperblockNonce = new Nonce(0);
        proxyResponse.hyperblockHash = new Hash("");
    }
});
