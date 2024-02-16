import { assert } from "chai";
import { ApiNetworkProvider } from "./apiNetworkProvider";
import { INetworkProvider, ITransactionNext } from "./interface";
import { Address } from "./primitives";
import { ProxyNetworkProvider } from "./proxyNetworkProvider";
import { MockQuery } from "./testscommon/dummyQuery";
import { NonFungibleTokenOfAccountOnNetwork } from "./tokens";
import { TransactionEventData } from "./transactionEvents";
import { TransactionOnNetwork } from "./transactions";

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
            "08acf8cbd71306a56eb58f9593cb2e23f109c94e27acdd906c82a5c3a5f84d9d",
            "410efb1db2ab86678b8dbc503beb695b5b7d52754fb0de86c09cbb433de5f6a8"
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
        const hash = "1b04eb849cf87f2d3086c77b4b825d126437b88014327bbf01437476751cb040";

        let apiResponse = await apiProvider.getTransaction(hash);
        let proxyResponse = await proxyProvider.getTransaction(hash);

        assert.exists(apiResponse.logs);
        assert.exists(proxyResponse.logs);
        assert.exists(apiResponse.logs.events)
        assert.exists(proxyResponse.logs.events)
        assert.equal(apiResponse.logs.events[0].topics[0].hex(), "414c4943452d353632376631")
        assert.equal(apiResponse.logs.events[0].topics[1].hex(), "")
        assert.equal(apiResponse.logs.events[0].topics[2].hex(), "01")
        assert.equal(apiResponse.logs.events[0].topics[3].hex(), "0000000000000000050032e141d21536e2dfc3d64b9e7dd0c2c53f201dc469e1")
        assert.equal(proxyResponse.logs.events[0].topics[0].hex(), "414c4943452d353632376631")
        assert.equal(proxyResponse.logs.events[0].topics[1].hex(), "")
        assert.equal(proxyResponse.logs.events[0].topics[2].hex(), "01")
        assert.equal(proxyResponse.logs.events[0].topics[3].hex(), "0000000000000000050032e141d21536e2dfc3d64b9e7dd0c2c53f201dc469e1")
    });

    it("should have same response for getTransactionStatus()", async function () {
        this.timeout(20000);

        let hashes = [
            "08acf8cbd71306a56eb58f9593cb2e23f109c94e27acdd906c82a5c3a5f84d9d",
            "410efb1db2ab86678b8dbc503beb695b5b7d52754fb0de86c09cbb433de5f6a8"
        ];

        for (const hash of hashes) {
            let apiResponse = await apiProvider.getTransactionStatus(hash);
            let proxyResponse = await proxyProvider.getTransactionStatus(hash);

            assert.deepEqual(apiResponse, proxyResponse, `transaction: ${hash}`);
        }
    });

    it("should have same response for getDefinitionOfFungibleToken()", async function () {
        this.timeout(10000);

        let identifiers = ["BEER-b16c6d", "CHOCOLATE-daf625"];

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
        let query = new MockQuery({
            address: new Address("erd1qqqqqqqqqqqqqpgqfzydqmdw7m2vazsp6u5p95yxz76t2p9rd8ss0zp9ts"),
            func: "getSum"
        });

        let apiResponse = await apiProvider.queryContract(query);
        let proxyResponse = await proxyProvider.queryContract(query);

        // Ignore "gasUsed" due to numerical imprecision (API).
        apiResponse.gasUsed = 0;
        proxyResponse.gasUsed = 0;

        assert.deepEqual(apiResponse, proxyResponse);
        assert.deepEqual(apiResponse.getReturnDataParts(), proxyResponse.getReturnDataParts());
    });

    it("should handle events 'data' and 'additionalData'", async function () {
        this.timeout(50000);

        const apiResponse = await apiProvider.getTransaction("a419271407a2ec217739811805e3a751e30dbc72ae0777e3b4c825f036995184");
        const proxyResponse = await proxyProvider.getTransaction("a419271407a2ec217739811805e3a751e30dbc72ae0777e3b4c825f036995184");

        assert.equal(apiResponse.logs.events[0].data, Buffer.from("test").toString());
        assert.equal(proxyResponse.logs.events[0].data, Buffer.from("test").toString());

        assert.deepEqual(apiResponse.logs.events[0].dataPayload, TransactionEventData.fromBase64("dGVzdA=="));
        assert.deepEqual(proxyResponse.logs.events[0].dataPayload, TransactionEventData.fromBase64("dGVzdA=="));

        assert.deepEqual(apiResponse.logs.events[0].additionalData, [TransactionEventData.fromBase64("dGVzdA==")]);
        assert.deepEqual(proxyResponse.logs.events[0].additionalData, [TransactionEventData.fromBase64("dGVzdA==")]);
    });

    it.only("should send both `Transaction` and `TransactionNext`", async function () {
        this.timeout(50000);

        const transaction = {
            toSendable: function () {
                return {
                    "nonce": 7,
                    "value": "0",
                    "receiver": "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
                    "sender": "erd1zztjf9fhwvuvquzsllknq4qcmffwad6n0hjtn5dyzytr5tgz7uas0mkgrq",
                    "gasPrice": 1000000000,
                    "gasLimit": 50000,
                    "chainID": "D",
                    "version": 2,
                    "signature": "149f1d8296efcb9489c5b3142ae659aacfa3a7daef3645f1d3747a96dc9cee377070dd8b83b322997c15ba3c305ac18daaee0fd25760eba334b14a9272b34802"
                }
            }
        }

        const transactionNext: ITransactionNext = {
            nonce: BigInt(8),
            value: BigInt(0),
            receiver: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
            sender: "erd1zztjf9fhwvuvquzsllknq4qcmffwad6n0hjtn5dyzytr5tgz7uas0mkgrq",
            data: new Uint8Array(Buffer.from("test")),
            gasPrice: BigInt(1000000000),
            gasLimit: BigInt(80000),
            chainID: "D",
            version: 2,
            signature: new Uint8Array(Buffer.from("3fa42d97b4f85442850340a11411a3cbd63885e06ff3f84c7a75d0ef59c780f7a18aa4f331cf460300bc8bd99352aea10b7c3bc17e40287337ae9f9842470205", "hex")),
            senderUsername: "",
            receiverUsername: "",
            guardian: "",
            guardianSignature: new Uint8Array(),
            options: 0
        }

        const apiLegacyTxHash = await apiProvider.sendTransaction(transaction);
        const apiTxNextHash = await apiProvider.sendTransaction(transactionNext);

        const proxyLegacyTxHash = await apiProvider.sendTransaction(transaction);
        const proxyTxNextHash = await apiProvider.sendTransaction(transactionNext);

        assert.equal(apiLegacyTxHash, proxyLegacyTxHash);
        assert.equal(apiTxNextHash, proxyTxNextHash);
    });
});
