import { assert } from "chai";
import { ApiNetworkProvider } from "./apiNetworkProvider";
import { INetworkProvider } from "./interface";
import { Address } from "./primitives";
import { ProxyNetworkProvider } from "./proxyNetworkProvider";
import { MockQuery } from "./testscommon/dummyQuery";
import { TransactionOnNetwork } from "./transactions";
import { NonFungibleTokenOfAccountOnNetwork } from "./tokens";

describe("test network providers on devnet: Proxy and API", function () {
    let alice = new Address("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
    let carol = new Address("erd1k2s324ww2g0yj38qn2ch2jwctdy8mnfxep94q9arncc6xecg3xaq6mjse8");
    let dan = new Address("erd1kyaqzaprcdnv4luvanah0gfxzzsnpaygsy6pytrexll2urtd05ts9vegu7");
    const MAX_NUMBER_OF_ITEMS_BY_DEFAULT = 20;

    let apiProvider: INetworkProvider = new ApiNetworkProvider("https://devnet-api.multiversx.com", { timeout: 10000 });
    let proxyProvider: INetworkProvider = new ProxyNetworkProvider("https://devnet-gateway.multiversx.com", { timeout: 10000 });

    it("should have same response for getNetworkConfig()", async function () {
        let apiResponse = await apiProvider.getNetworkConfig();
        let proxyResponse = await proxyProvider.getNetworkConfig();

        assert.deepEqual(apiResponse, proxyResponse);
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
            let apiResponse = (await apiProvider.getFungibleTokensOfAccount(user)).slice(0, MAX_NUMBER_OF_ITEMS_BY_DEFAULT);
            let proxyResponse = (await proxyProvider.getFungibleTokensOfAccount(user)).slice(0, MAX_NUMBER_OF_ITEMS_BY_DEFAULT);

            for (let i = 0; i < apiResponse.length; i++) {
                assert.equal(apiResponse[i].identifier, proxyResponse[i].identifier);
                assert.equal(apiResponse[i].balance.valueOf, proxyResponse[i].balance.valueOf);
            }
        }
    });

    it("should have same response for getNonFungibleTokensOfAccount(), getNonFungibleTokenOfAccount", async function () {
        this.timeout(30000);

        let apiResponse = (await apiProvider.getNonFungibleTokensOfAccount(dan)).slice(0, MAX_NUMBER_OF_ITEMS_BY_DEFAULT);
        let proxyResponse = (await proxyProvider.getNonFungibleTokensOfAccount(dan)).slice(0, MAX_NUMBER_OF_ITEMS_BY_DEFAULT);

        assert.equal(apiResponse.length, proxyResponse.length);

        for (let i = 0; i < apiResponse.length; i++) {
            removeInconsistencyForNonFungibleTokenOfAccount(apiResponse[i], proxyResponse[i]);
        }

        assert.deepEqual(apiResponse, proxyResponse);

        const item = apiResponse[0];
        let apiItemResponse = await apiProvider.getNonFungibleTokenOfAccount(dan, item.collection, item.nonce);
        let proxyItemResponse = await proxyProvider.getNonFungibleTokenOfAccount(dan, item.collection, item.nonce);

        removeInconsistencyForNonFungibleTokenOfAccount(apiItemResponse, proxyItemResponse);
        assert.deepEqual(apiResponse, proxyResponse, `user: ${dan.bech32()}, token: ${item.identifier}`);
    });

    // TODO: Strive to have as little differences as possible between Proxy and API.
    function removeInconsistencyForNonFungibleTokenOfAccount(apiResponse: NonFungibleTokenOfAccountOnNetwork, proxyResponse: NonFungibleTokenOfAccountOnNetwork) {
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
            {
                toSendable: function () {
                    return {
                        "nonce": 42,
                        "value": "1",
                        "receiver": "erd1testnlersh4z0wsv8kjx39me4rmnvjkwu8dsaea7ukdvvc9z396qykv7z7",
                        "sender": "erd15x2panzqvfxul2lvstfrmdcl5t4frnsylfrhng8uunwdssxw4y9succ9sq",
                        "gasPrice": 1000000000,
                        "gasLimit": 50000,
                        "chainID": "D",
                        "version": 1,
                        "signature": "c8eb539e486db7d703d8c70cab3b7679113f77c4685d8fcc94db027ceacc6b8605115034355386dffd7aa12e63dbefa03251a2f1b1d971f52250187298d12900"
                    }
                }
            },
            {
                toSendable: function () {
                    return {
                        "nonce": 43,
                        "value": "1",
                        "receiver": "erd1testnlersh4z0wsv8kjx39me4rmnvjkwu8dsaea7ukdvvc9z396qykv7z7",
                        "sender": "erd15x2panzqvfxul2lvstfrmdcl5t4frnsylfrhng8uunwdssxw4y9succ9sq",
                        "gasPrice": 1000000000,
                        "gasLimit": 50000,
                        "chainID": "D",
                        "version": 1,
                        "signature": "9c4c22d0ae1b5a10c39583a5ab9020b00b27aa69d4ac8ab4922620dbf0df4036ed890f9946d38a9d0c85d6ac485c0d9b2eac0005e752f249fd0ad863b0471d02"
                    }
                }
            },
            {
                toSendable: function () {
                    return {
                        "nonce": 44
                    }
                }
            }
        ];

        const expectedHashes = [
            "6e2fa63ea02937f00d7549f3e4eb9af241e4ac13027aa65a5300816163626c01",
            "37d7e84313a5baea2a61c6ab10bb29b52bc54f7ac9e3918a9faeb1e08f42081c",
            null
        ]

        assert.equal(await apiProvider.sendTransaction(txs[0]), expectedHashes[0]);
        assert.equal(await proxyProvider.sendTransaction(txs[1]), expectedHashes[1]);

        assert.deepEqual(await apiProvider.sendTransactions(txs), expectedHashes);
        assert.deepEqual(await proxyProvider.sendTransactions(txs), expectedHashes);
    });

    it("should have same response for getTransaction()", async function () {
        this.timeout(20000);

        let hashes = [
            "2e6bd2671dbb57f1f1013c89f044359c2465f1514e0ea718583900e43c1931fe",
            "c451566a6168e38d2980fcb83d4ea154f78d53f7abf3264dd51c2c7c585671aa"
        ];

        for (const hash of hashes) {
            let apiResponse = await apiProvider.getTransaction(hash);
            let proxyResponse = await proxyProvider.getTransaction(hash, true);

            ignoreKnownTransactionDifferencesBetweenProviders(proxyResponse);
            assert.deepEqual(apiResponse, proxyResponse, `transaction: ${hash}`);

            // Also assert completion
            assert.isTrue(apiResponse.isCompleted);
            assert.isTrue(proxyResponse.isCompleted);
        }
    });

    // TODO: Strive to have as little differences as possible between Proxy and API.
    function ignoreKnownTransactionDifferencesBetweenProviders(proxyResponse: TransactionOnNetwork) {
        // Ignore fields which are not present on API response:
        proxyResponse.type = "";
        proxyResponse.epoch = 0;
        proxyResponse.blockNonce = 0;
        proxyResponse.hyperblockNonce = 0;
        proxyResponse.hyperblockHash = "";
    }

    it("should have the same response for transactions with events", async function () {
        const hash = "c451566a6168e38d2980fcb83d4ea154f78d53f7abf3264dd51c2c7c585671aa";

        let apiResponse = await apiProvider.getTransaction(hash);
        let proxyResponse = await proxyProvider.getTransaction(hash);

        assert.exists(apiResponse.logs);
        assert.exists(proxyResponse.logs);
        assert.exists(apiResponse.logs.events)
        assert.exists(proxyResponse.logs.events)
        assert.equal(apiResponse.logs.events[0].topics[0].hex(), "5745474c442d643763366262")
        assert.equal(apiResponse.logs.events[0].topics[1].hex(), "")
        assert.equal(apiResponse.logs.events[0].topics[2].hex(), "0de0b6b3a7640000")
        assert.equal(apiResponse.logs.events[0].topics[3].hex(), "00000000000000000500e01285f90311fb5925a9623a1dc62eee41fa8c869a0d")
        assert.equal(proxyResponse.logs.events[0].topics[0].hex(), "5745474c442d643763366262")
        assert.equal(proxyResponse.logs.events[0].topics[1].hex(), "")
        assert.equal(proxyResponse.logs.events[0].topics[2].hex(), "0de0b6b3a7640000")
        assert.equal(proxyResponse.logs.events[0].topics[3].hex(), "00000000000000000500e01285f90311fb5925a9623a1dc62eee41fa8c869a0d")
    });

    it("should have same response for getTransactionStatus()", async function () {
        this.timeout(20000);

        let hashes = [
            "2e6bd2671dbb57f1f1013c89f044359c2465f1514e0ea718583900e43c1931fe",
            "c451566a6168e38d2980fcb83d4ea154f78d53f7abf3264dd51c2c7c585671aa",
            "cd2da63a51fd422c8b69a1b5ebcb9edbbf0eb9750c3fe8e199d39ed5d82000e9"
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
            let proxyResponse = await proxyProvider.getDefinitionOfFungibleToken(identifier);

            // Assets are only present on API responses, thus we ignore them for comparison.
            apiResponse.assets = {};

            assert.equal(apiResponse.identifier, identifier);
            assert.deepEqual(apiResponse, proxyResponse);
        }
    });

    it("should have same response for getDefinitionOfTokenCollection()", async function () {
        this.timeout(10000);

        let collections = ["ERDJS-38f249"];

        for (const collection of collections) {
            let apiResponse = await apiProvider.getDefinitionOfTokenCollection(collection);
            let proxyResponse = await proxyProvider.getDefinitionOfTokenCollection(collection);

            assert.equal(apiResponse.collection, collection);
            assert.deepEqual(apiResponse, proxyResponse);
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
            address: new Address("erd1qqqqqqqqqqqqqpgquykqja5c4v33zdmnwglj3jphqwrelzdn396qlc9g33"),
            func: "getSum"
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
            address: new Address("erd1qqqqqqqqqqqqqpgqzeq07xvhs5g7cg4ama85upaqarrcgu49396q0gz4yf"),
            func: "increment",
            args: []
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
            address: new Address("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u"),
            func: "issue",
            value: "50000000000000000",
            args: [
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

