import { assert } from "chai";
import { INetworkProvider } from "./interface";
import { Hash } from "./primitives";
import { TransactionOnNetwork } from "./transactions";
import { TransactionStatus } from "./transactionStatus";
import { Bech32Address, Nonce } from "./primitives";
import { MockQuery } from "./testscommon/dummyQuery";
import { ApiNetworkProvider } from "./apiNetworkProvider";
import { ProxyNetworkProvider } from "./proxyNetworkProvider";

describe("test network providers on devnet: Proxy and API", function () {
    let alice = new Bech32Address("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
    let bob = new Bech32Address("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx");
    let carol = new Bech32Address("erd1k2s324ww2g0yj38qn2ch2jwctdy8mnfxep94q9arncc6xecg3xaq6mjse8");
    let dan = new Bech32Address("erd1kyaqzaprcdnv4luvanah0gfxzzsnpaygsy6pytrexll2urtd05ts9vegu7");

    let apiProvider: INetworkProvider = new ApiNetworkProvider("https://devnet-api.elrond.com", { timeout: 10000 });
    let proxyProvider: INetworkProvider = new ProxyNetworkProvider("https://devnet-gateway.elrond.com", { timeout: 10000 });

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
        for (const user of [bob, carol, dan]) {
            let apiResponse = await apiProvider.getAccount(user);
            let proxyResponse = await proxyProvider.getAccount(user);

            assert.deepEqual(apiResponse, proxyResponse);
        }
    });

    it("should have same response for getFungibleTokensOfAccount(), getFungibleTokenOfAccount()", async function () {
        this.timeout(30000);

        for (const user of [carol, dan]) {
            let apiResponse = await apiProvider.getFungibleTokensOfAccount(user);
            let proxyResponse = await proxyProvider.getFungibleTokensOfAccount(user);

            assert.deepEqual(apiResponse.slice(0, 100), proxyResponse.slice(0, 100));

            for (const item of apiResponse.slice(0, 5)) {
                let apiResponse = await apiProvider.getFungibleTokenOfAccount(user, item.identifier);
                let proxyResponse = await proxyProvider.getFungibleTokenOfAccount(user, item.identifier);

                assert.deepEqual(apiResponse, proxyResponse, `user: ${user.bech32()}, token: ${item.identifier}`);
            }
        }
    });

    it("should have same response for getNonFungibleTokensOfAccount(), getNonFungibleTokenOfAccount", async function () {
        this.timeout(30000);

        for (const user of [alice, bob, carol, dan]) {
            let apiResponse = await apiProvider.getNonFungibleTokensOfAccount(user);
            let proxyResponse = await proxyProvider.getNonFungibleTokensOfAccount(user);

            for (const item of apiResponse) {
                // Gateway does not provide "type".
                item.type = "";
            }

            assert.deepEqual(apiResponse.slice(0, 100), proxyResponse.slice(0, 100));

            for (const item of apiResponse.slice(0, 5)) {
                let apiResponse = await apiProvider.getNonFungibleTokenOfAccount(user, item.collection, item.nonce);
                let proxyResponse = await proxyProvider.getNonFungibleTokenOfAccount(user, item.collection, item.nonce);

                // Gateway does not provide "type".
                apiResponse.type = "";

                assert.deepEqual(apiResponse, proxyResponse, `user: ${user.bech32()}, token: ${item.identifier}`);
            }
        }
    });

    it("should have same response for getTransaction()", async function () {
        this.timeout(20000);

        let hashes = [
            new Hash("a069c663831002651fd542479869cc61103465f3284dace772e7480f81429fa8"),
            new Hash("de3bc87f3e057e28ea6a625acd6d6d332e24f35ea73e820462b71256c8ecffb7"),
            new Hash("dbefa0299fe6b2336eb0bc3123fa623845c276e5c6e2a175adf1a562d5e77718"),
            new Hash("2a8ccbd91b7d9460a86174b5a8d4e6aa073b38674d1ee8107e728980a66f0676"),
            // TODO: uncomment after fix (SCR missing on API)
            // new TransactionHash("be7914b1eb4c6bd352ba1d86991959b443e446e0ad49fb796be3495c287b2472")
        ];

        for (const hash of hashes) {
            let apiResponse = await apiProvider.getTransaction(hash);
            let proxyResponse = await proxyProvider.getTransaction(hash);

            ignoreKnownTransactionDifferencesBetweenProviders(apiResponse, proxyResponse);
            assert.deepEqual(apiResponse, proxyResponse, `transaction: ${hash}`);

            // Also assert completion
            assert.isTrue(apiResponse.isCompleted);
            assert.isTrue(proxyResponse.isCompleted);
        }
    });

    // TODO: Strive to have as little differences as possible between Proxy and API.
    function ignoreKnownTransactionDifferencesBetweenProviders(apiResponse: TransactionOnNetwork, proxyResponse: TransactionOnNetwork) {
        // TODO: Remove this once "tx.status" is uniformized.
        apiResponse.status = proxyResponse.status = new TransactionStatus("ignore");

        // Ignore fields which are not present on API response:
        proxyResponse.type = "";
        proxyResponse.epoch = 0;
        proxyResponse.blockNonce = 0;
        proxyResponse.hyperblockNonce = 0;
        proxyResponse.hyperblockHash = "";
    }

    // TODO: Fix differences of "tx.status", then enable this test.
    it.skip("should have same response for getTransactionStatus()", async function () {
        this.timeout(20000);

        let hashes = [
            new Hash("a069c663831002651fd542479869cc61103465f3284dace772e7480f81429fa8"),
            new Hash("de3bc87f3e057e28ea6a625acd6d6d332e24f35ea73e820462b71256c8ecffb7"),
            new Hash("dbefa0299fe6b2336eb0bc3123fa623845c276e5c6e2a175adf1a562d5e77718"),
            new Hash("2a8ccbd91b7d9460a86174b5a8d4e6aa073b38674d1ee8107e728980a66f0676"),
            new Hash("be7914b1eb4c6bd352ba1d86991959b443e446e0ad49fb796be3495c287b2472")
        ];

        for (const hash of hashes) {
            let apiResponse = await apiProvider.getTransactionStatus(hash);
            let proxyResponse = await proxyProvider.getTransactionStatus(hash);

            assert.deepEqual(apiResponse, proxyResponse, `transaction: ${hash}`);
        }
    });

    it("should have same response for getDefinitionOfFungibleToken()", async function () {
        this.timeout(10000);

        let identifiers = ["FOO-b6f543", "BAR-c80d29", "COUNTER-b7401d"];

        for (const identifier of identifiers) {
            let apiResponse = await apiProvider.getDefinitionOfFungibleToken(identifier);

            assert.equal(apiResponse.identifier, identifier);

            // TODO: Uncomment after implementing the function in the proxy provider.
            // let proxyResponse = await proxyProvider.getDefinitionOfFungibleToken(identifier);
            // assert.deepEqual(apiResponse, proxyResponse);
        }
    });

    it("should have same response for getDefinitionOfTokenCollection()", async function () {
        this.timeout(10000);

        let collections = ["ERDJS-38f249"];

        for (const collection of collections) {
            let apiResponse = await apiProvider.getDefinitionOfTokenCollection(collection);

            assert.equal(apiResponse.collection, collection);

            // TODO: Uncomment after implementing the function in the proxy provider.
            // let proxyResponse = await proxyProvider.getDefinitionOfTokenCollection(identifier);
            // assert.deepEqual(apiResponse, proxyResponse);
        }
    });

    it("should have same response for getNonFungibleToken()", async function () {
        this.timeout(10000);

        let tokens = [{ id: "ERDJS-38f249", nonce: 1 }];

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
        let query = new MockQuery({
            contract: "erd1qqqqqqqqqqqqqpgquykqja5c4v33zdmnwglj3jphqwrelzdn396qlc9g33",
            function: "getSum"
        });

        let apiResponse = await apiProvider.queryContract(query);
        let proxyResponse = await proxyProvider.queryContract(query);

        // Ignore "gasUsed" due to numerical imprecision (API).
        apiResponse.gasUsed = 0;
        proxyResponse.gasUsed = 0;

        assert.deepEqual(apiResponse, proxyResponse);
        assert.deepEqual(apiResponse.getReturnDataParts(), proxyResponse.getReturnDataParts());

        // Query: increment counter
        query = new MockQuery({
            contract: "erd1qqqqqqqqqqqqqpgqzeq07xvhs5g7cg4ama85upaqarrcgu49396q0gz4yf",
            function: "increment",
            arguments: []
        });

        apiResponse = await apiProvider.queryContract(query);
        proxyResponse = await proxyProvider.queryContract(query);

        // Ignore "gasUsed" due to numerical imprecision (API).
        apiResponse.gasUsed = 0;
        proxyResponse.gasUsed = 0;

        assert.deepEqual(apiResponse, proxyResponse);
        assert.deepEqual(apiResponse.getReturnDataParts(), proxyResponse.getReturnDataParts());
    });

    it.skip("should have same response for queryContract() (2)", async function () {
        this.timeout(10000);

        // Query: issue ESDT
        let query = new MockQuery({
            contract: "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u",
            function: "issue",
            value: "50000000000000000",
            arguments: [
                Buffer.from("HELLO").toString("hex"),
                Buffer.from("WORLD").toString("hex"),
                "0A", // Supply
                "03" // Decimals
            ]
        });

        let apiResponse = await apiProvider.queryContract(query);
        let proxyResponse = await proxyProvider.queryContract(query);
        
        assert.deepEqual(apiResponse, proxyResponse);
        assert.deepEqual(apiResponse.getReturnDataParts(), proxyResponse.getReturnDataParts());
    });
});

