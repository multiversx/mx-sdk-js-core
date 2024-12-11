import { AxiosHeaders } from "axios";
import { assert } from "chai";
import { Address } from "../address";
import { SmartContractQuery } from "../smartContractQuery";
import { Transaction } from "../transaction";
import { TransactionOnNetwork } from "../transactionOnNetwork";
import { ApiNetworkProvider } from "./apiNetworkProvider";
import { INetworkProvider } from "./interface";
import { ProxyNetworkProvider } from "./proxyNetworkProvider";
import { NonFungibleTokenOfAccountOnNetwork } from "./tokens";

describe("test network providers on devnet: Proxy and API", function () {
    let alice = new Address("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
    let carol = new Address("erd1k2s324ww2g0yj38qn2ch2jwctdy8mnfxep94q9arncc6xecg3xaq6mjse8");
    let dan = new Address("erd1kyaqzaprcdnv4luvanah0gfxzzsnpaygsy6pytrexll2urtd05ts9vegu7");
    const MAX_NUMBER_OF_ITEMS_BY_DEFAULT = 20;

    let apiProvider: INetworkProvider = new ApiNetworkProvider("https://devnet-api.multiversx.com", {
        timeout: 10000,
        clientName: "test",
    });
    let proxyProvider: INetworkProvider = new ProxyNetworkProvider("https://devnet-gateway.multiversx.com", {
        timeout: 10000,
        clientName: "test",
    });

    it("should create providers without configuration", async function () {
        const apiProviderWithoutConfig = new ApiNetworkProvider("https://devnet-api.multiversx.com");
        const proxyProviderWithoutConfig = new ProxyNetworkProvider("https://devnet-gateway.multiversx.com");

        const apiResponse = await apiProviderWithoutConfig.getNetworkConfig();
        const proxyResponse = await proxyProviderWithoutConfig.getNetworkConfig();

        assert.equal(apiResponse.ChainID, "D");
        assert.equal(proxyResponse.ChainID, "D");
    });

    it("should have same response for getNetworkConfig()", async function () {
        let apiResponse = await apiProvider.getNetworkConfig();
        let proxyResponse = await proxyProvider.getNetworkConfig();

        assert.deepEqual(apiResponse, proxyResponse);
    });

    it("should add userAgent unknown for clientName when no clientName passed", async function () {
        const expectedApiUserAgent = "multiversx-sdk/api/unknown";
        const expectedProxyUserAgent = "multiversx-sdk/proxy/unknown";

        let localApiProvider: any = new ApiNetworkProvider("https://devnet-api.multiversx.com", { timeout: 10000 });
        let localProxyProvider: any = new ProxyNetworkProvider("https://devnet-gateway.multiversx.com", {
            timeout: 10000,
        });

        assert.equal(localApiProvider.config.headers.getUserAgent(), expectedApiUserAgent);
        assert.equal(localProxyProvider.config.headers.getUserAgent(), expectedProxyUserAgent);
    });

    it("should set userAgent with specified clientName ", async function () {
        const expectedApiUserAgent = "multiversx-sdk/api/test";
        const expectedProxyUserAgent = "multiversx-sdk/proxy/test";

        let localApiProvider: any = new ApiNetworkProvider("https://devnet-api.multiversx.com", {
            timeout: 10000,
            clientName: "test",
        });
        let localProxyProvider: any = new ProxyNetworkProvider("https://devnet-gateway.multiversx.com", {
            timeout: 10000,
            clientName: "test",
        });

        assert.equal(localApiProvider.config.headers.getUserAgent(), expectedApiUserAgent);
        assert.equal(localProxyProvider.config.headers.getUserAgent(), expectedProxyUserAgent);
    });

    it("should keep the set userAgent and add the sdk to it", async function () {
        const expectedApiUserAgent = "Client-info multiversx-sdk/api/test";
        const expectedProxyUserAgent = "Client-info multiversx-sdk/proxy/test";

        let localApiProvider: any = new ApiNetworkProvider("https://devnet-api.multiversx.com", {
            timeout: 10000,
            headers: new AxiosHeaders({ "User-Agent": "Client-info" }),
            clientName: "test",
        });
        let localProxyProvider: any = new ProxyNetworkProvider("https://devnet-gateway.multiversx.com", {
            timeout: 10000,
            headers: new AxiosHeaders({ "User-Agent": "Client-info" }),
            clientName: "test",
        });

        assert.equal(localApiProvider.config.headers.getUserAgent(), expectedApiUserAgent);
        assert.equal(localProxyProvider.config.headers.getUserAgent(), expectedProxyUserAgent);
    });

    it("should have same response for getNetworkStatus()", async function () {
        let apiResponse = await apiProvider.getNetworkStatus();
        let proxyResponse = await proxyProvider.getNetworkStatus();

        assert.equal(apiResponse.EpochNumber, proxyResponse.EpochNumber);
        assert.equal(apiResponse.NonceAtEpochStart, proxyResponse.NonceAtEpochStart);
        assert.equal(apiResponse.RoundAtEpochStart, proxyResponse.RoundAtEpochStart);
        assert.equal(apiResponse.RoundsPerEpoch, proxyResponse.RoundsPerEpoch);
        // done this way because the nonces may change until both requests are executed
        assert.approximately(apiResponse.CurrentRound, proxyResponse.CurrentRound, 1);
        assert.approximately(apiResponse.HighestFinalNonce, proxyResponse.HighestFinalNonce, 1);
        assert.approximately(apiResponse.Nonce, proxyResponse.Nonce, 1);
        assert.approximately(apiResponse.NoncesPassedInCurrentEpoch, proxyResponse.NoncesPassedInCurrentEpoch, 1);
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
        let apiResponse = await apiProvider.getAccount(alice);
        let proxyResponse = await proxyProvider.getAccount(alice);

        assert.deepEqual(apiResponse, proxyResponse);
    });

    it("should have same response for getFungibleTokensOfAccount(), getFungibleTokenOfAccount()", async function () {
        this.timeout(30000);

        for (const user of [carol, dan]) {
            let apiResponse = (await apiProvider.getFungibleTokensOfAccount(user)).slice(
                0,
                MAX_NUMBER_OF_ITEMS_BY_DEFAULT,
            );
            let proxyResponse = (await proxyProvider.getFungibleTokensOfAccount(user)).slice(
                0,
                MAX_NUMBER_OF_ITEMS_BY_DEFAULT,
            );

            for (let i = 0; i < apiResponse.length; i++) {
                assert.equal(apiResponse[i].identifier, proxyResponse[i].identifier);
                assert.equal(apiResponse[i].balance.valueOf, proxyResponse[i].balance.valueOf);
            }
        }
    });

    it("should have same response for getNonFungibleTokensOfAccount(), getNonFungibleTokenOfAccount", async function () {
        this.timeout(30000);

        let apiResponse = (await apiProvider.getNonFungibleTokensOfAccount(dan)).slice(
            0,
            MAX_NUMBER_OF_ITEMS_BY_DEFAULT,
        );
        let proxyResponse = (await proxyProvider.getNonFungibleTokensOfAccount(dan)).slice(
            0,
            MAX_NUMBER_OF_ITEMS_BY_DEFAULT,
        );

        assert.isTrue(apiResponse.length > 0, "For the sake of the test, there should be at least one item.");
        assert.equal(apiResponse.length, proxyResponse.length);

        for (let i = 0; i < apiResponse.length; i++) {
            removeInconsistencyForNonFungibleTokenOfAccount(apiResponse[i], proxyResponse[i]);
        }

        assert.deepEqual(apiResponse, proxyResponse);

        const item = apiResponse[0];
        let apiItemResponse = await apiProvider.getNonFungibleTokenOfAccount(dan, item.collection, item.nonce);
        let proxyItemResponse = await proxyProvider.getNonFungibleTokenOfAccount(dan, item.collection, item.nonce);

        removeInconsistencyForNonFungibleTokenOfAccount(apiItemResponse, proxyItemResponse);
        assert.deepEqual(apiResponse, proxyResponse, `user: ${dan.toBech32()}, token: ${item.identifier}`);
    });

    // TODO: Strive to have as little differences as possible between Proxy and API.
    function removeInconsistencyForNonFungibleTokenOfAccount(
        apiResponse: NonFungibleTokenOfAccountOnNetwork,
        proxyResponse: NonFungibleTokenOfAccountOnNetwork,
    ) {
        // unset unconsistent fields
        apiResponse.type = "";
        proxyResponse.type = "";
        apiResponse.name = "";
        proxyResponse.name = "";
        apiResponse.decimals = 0;
        proxyResponse.decimals = 0;
    }

    it("should be able to send transaction(s)", async function () {
        this.timeout(5000);

        const txs = [
            new Transaction({
                nonce: 103n,
                receiver: Address.newFromBech32("erd1487vz5m4zpxjyqw4flwa3xhnkzg4yrr3mkzf5sf0zgt94hjprc8qazcccl"),
                sender: Address.newFromBech32("erd1487vz5m4zpxjyqw4flwa3xhnkzg4yrr3mkzf5sf0zgt94hjprc8qazcccl"),
                gasPrice: 1000000000n,
                gasLimit: 50000n,
                chainID: "D",
                version: 2,
                signature: Buffer.from(
                    "498d5abb9f8eb69cc75f24320e8929dadbfa855ffac220d5e92175a83be68e0437801af3a1411e3d839738230097a1c38da5c8c4df3f345defc5d40300675900",
                    "hex",
                ),
            }),

            new Transaction({
                nonce: 104n,
                receiver: Address.newFromBech32("erd1487vz5m4zpxjyqw4flwa3xhnkzg4yrr3mkzf5sf0zgt94hjprc8qazcccl"),
                sender: Address.newFromBech32("erd1487vz5m4zpxjyqw4flwa3xhnkzg4yrr3mkzf5sf0zgt94hjprc8qazcccl"),
                gasPrice: 1000000000n,
                gasLimit: 50000n,
                chainID: "D",
                version: 2,
                signature: Buffer.from(
                    "341a2f3b738fbd20692e3bbd1cb36cb5f4ce9c0a9acc0cf4322269c0fcf34fd6bb59cd94062a9a4730e47f41b1ef3e29b69c6ab2a2a4dca9c9a7724681bc1708",
                    "hex",
                ),
            }),
            new Transaction({
                nonce: 77n,
                chainID: "D",
                receiver: Address.newFromBech32("erd1487vz5m4zpxjyqw4flwa3xhnkzg4yrr3mkzf5sf0zgt94hjprc8qazcccl"),
                sender: Address.newFromBech32("erd1487vz5m4zpxjyqw4flwa3xhnkzg4yrr3mkzf5sf0zgt94hjprc8qazcccl"),
                gasLimit: 50000n,
                gasPrice: 1000000000n,
            }),
        ];

        const expectedHashes = [
            "61b4f2561fc57bfb8b8971ed23cd64259b664bc0404ea7a0449def8ceef24b08",
            "30274b60b5635f981fa89ccfe726a34ca7121caa5d34123021c77a5c64cc9163",
            null,
        ];

        assert.equal(await apiProvider.sendTransaction(txs[0]), expectedHashes[0]);
        assert.equal(await proxyProvider.sendTransaction(txs[1]), expectedHashes[1]);

        assert.deepEqual(await apiProvider.sendTransactions(txs), expectedHashes);
        assert.deepEqual(await proxyProvider.sendTransactions(txs), expectedHashes);
    });

    it("should have same response for getTransaction()", async function () {
        this.timeout(20000);

        let hashes = [
            "08acf8cbd71306a56eb58f9593cb2e23f109c94e27acdd906c82a5c3a5f84d9d",
            "410efb1db2ab86678b8dbc503beb695b5b7d52754fb0de86c09cbb433de5f6a8",
        ];

        for (const hash of hashes) {
            let apiResponse = await apiProvider.getTransaction(hash);
            let proxyResponse = await proxyProvider.getTransaction(hash, true);

            ignoreKnownTransactionDifferencesBetweenProviders(apiResponse, proxyResponse);
            assert.deepEqual(apiResponse, proxyResponse, `transaction: ${hash}`);

            // Also assert completion
            assert.isTrue(apiResponse.isCompleted);
            assert.isTrue(proxyResponse.isCompleted);
        }
    });

    // TODO: Strive to have as little differences as possible between Proxy and API.
    function ignoreKnownTransactionDifferencesBetweenProviders(
        apiResponse: TransactionOnNetwork,
        proxyResponse: TransactionOnNetwork,
    ) {
        // Proxy and API exhibit differences in the "function" field, in case of move-balance transactions.
        apiResponse.function = proxyResponse.function;

        // Ignore fields which are not present on API response:
        proxyResponse.epoch = 0;
        proxyResponse.blockNonce = 0;
        proxyResponse.hyperblockNonce = 0;
        proxyResponse.hyperblockHash = "";
    }

    it("should have the same response for transactions with events", async function () {
        const hash = "1b04eb849cf87f2d3086c77b4b825d126437b88014327bbf01437476751cb040";

        let apiResponse = await apiProvider.getTransaction(hash);
        let proxyResponse = await proxyProvider.getTransaction(hash);

        assert.exists(apiResponse.logs);
        assert.exists(proxyResponse.logs);
        assert.exists(apiResponse.logs.events);
        assert.exists(proxyResponse.logs.events);
        assert.equal(Buffer.from(apiResponse.logs.events[0].topics[0]).toString("hex"), "414c4943452d353632376631");
        assert.equal(Buffer.from(apiResponse.logs.events[0].topics[1]).toString("hex"), "");
        assert.equal(Buffer.from(apiResponse.logs.events[0].topics[2]).toString("hex"), "01");
        assert.equal(
            Buffer.from(apiResponse.logs.events[0].topics[3]).toString("hex"),
            "0000000000000000050032e141d21536e2dfc3d64b9e7dd0c2c53f201dc469e1",
        );
        assert.equal(
            Buffer.from(proxyResponse.logs.events[0].topics[0].toString()).toString("hex"),
            "414c4943452d353632376631",
        );
        assert.equal(Buffer.from(proxyResponse.logs.events[0].topics[1].toString()).toString("hex"), "");
        assert.equal(Buffer.from(proxyResponse.logs.events[0].topics[2].toString()).toString("hex"), "01");
        assert.equal(
            Buffer.from(proxyResponse.logs.events[0].topics[3]).toString("hex"),
            "0000000000000000050032e141d21536e2dfc3d64b9e7dd0c2c53f201dc469e1",
        );
    });

    it("should have same response for getTransactionStatus()", async function () {
        this.timeout(20000);

        let hashes = [
            "08acf8cbd71306a56eb58f9593cb2e23f109c94e27acdd906c82a5c3a5f84d9d",
            "410efb1db2ab86678b8dbc503beb695b5b7d52754fb0de86c09cbb433de5f6a8",
        ];

        for (const hash of hashes) {
            let apiResponse = await apiProvider.getTransactionStatus(hash);
            let proxyResponse = await proxyProvider.getTransactionStatus(hash);

            assert.deepEqual(apiResponse, proxyResponse, `transaction: ${hash}`);
        }
    });

    it("should have same response for getDefinitionOfFungibleToken()", async function () {
        this.timeout(10000);

        let identifier = "CHOCOLATE-daf625";

        let apiResponse = await apiProvider.getDefinitionOfFungibleToken(identifier);
        let proxyResponse = await proxyProvider.getDefinitionOfFungibleToken(identifier);

        // Assets are only present on API responses, thus we ignore them for comparison.
        apiResponse.assets = {};

        assert.equal(apiResponse.identifier, identifier);
        assert.deepEqual(apiResponse, proxyResponse);
    });

    it("should have same response for getDefinitionOfTokenCollection()", async function () {
        this.timeout(10000);

        let collections = ["TEST-37adcf"];

        for (const collection of collections) {
            let apiResponse = await apiProvider.getDefinitionOfTokenCollection(collection);
            let proxyResponse = await proxyProvider.getDefinitionOfTokenCollection(collection);

            assert.equal(apiResponse.collection, collection);
            assert.deepEqual(apiResponse, proxyResponse);
        }
    });

    it("should have same response for getNonFungibleToken()", async function () {
        this.timeout(10000);

        let tokens = [{ id: "TEST-37adcf", nonce: 1 }];

        for (const token of tokens) {
            let apiResponse = await apiProvider.getNonFungibleToken(token.id, token.nonce);

            assert.equal(apiResponse.collection, token.id);

            // TODO: Uncomment after implementing the function in the proxy provider.
            // let proxyResponse = await proxyProvider.getNonFungibleToken(token.id, token.nonce);
            // assert.deepEqual(apiResponse, proxyResponse);
        }
    });

    it("should have same response for queryContract()", async function () {
        this.timeout(10000);

        // Query: get sum (of adder contract)
        let query = new SmartContractQuery({
            contract: new Address("erd1qqqqqqqqqqqqqpgqfzydqmdw7m2vazsp6u5p95yxz76t2p9rd8ss0zp9ts"),
            function: "getSum",
        });

        let apiResponse = await apiProvider.queryContract(query);
        let proxyResponse = await proxyProvider.queryContract(query);

        assert.deepEqual(apiResponse, proxyResponse);
        assert.deepEqual(apiResponse.returnDataParts, proxyResponse.returnDataParts);
    });

    it("should handle events 'data' and 'additionalData'", async function () {
        this.timeout(50000);

        const apiResponse = await apiProvider.getTransaction(
            "a419271407a2ec217739811805e3a751e30dbc72ae0777e3b4c825f036995184",
        );
        const proxyResponse = await proxyProvider.getTransaction(
            "a419271407a2ec217739811805e3a751e30dbc72ae0777e3b4c825f036995184",
        );

        assert.deepEqual(apiResponse.logs.events[0].data, Buffer.from("dGVzdA==", "base64"));
        assert.deepEqual(proxyResponse.logs.events[0].data, Buffer.from("dGVzdA==", "base64"));

        assert.deepEqual(apiResponse.logs.events[0].additionalData, [Buffer.from("dGVzdA==", "base64")]);
        assert.deepEqual(proxyResponse.logs.events[0].additionalData, [Buffer.from("dGVzdA==", "base64")]);
    });

    it("should send both `Transaction` ", async function () {
        this.timeout(50000);

        const transaction = new Transaction({
            nonce: BigInt(8),
            value: BigInt(0),
            receiver: Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th"),
            sender: Address.newFromBech32("erd1zztjf9fhwvuvquzsllknq4qcmffwad6n0hjtn5dyzytr5tgz7uas0mkgrq"),
            data: new Uint8Array(Buffer.from("test")),
            gasPrice: BigInt(1000000000),
            gasLimit: BigInt(80000),
            chainID: "D",
            version: 2,
            signature: Buffer.from(
                "3fa42d97b4f85442850340a11411a3cbd63885e06ff3f84c7a75d0ef59c780f7a18aa4f331cf460300bc8bd99352aea10b7c3bc17e40287337ae9f9842470205",
                "hex",
            ),
        });

        const apiTxNextHash = await apiProvider.sendTransaction(transaction);

        const proxyTxNextHash = await proxyProvider.sendTransaction(transaction);

        assert.equal(apiTxNextHash, proxyTxNextHash);
    });
});
