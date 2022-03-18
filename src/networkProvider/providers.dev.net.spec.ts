import { assert } from "chai";
import { Hash } from "../hash";
import { INetworkProvider, ITransactionOnNetwork } from "./interface";
import { Address } from "../address";
import { loadTestWallets, TestWallet } from "../testutils";
import { TransactionHash, TransactionStatus } from "../transaction";
import { Nonce } from "../nonce";
import { ContractFunction, Query } from "../smartcontracts";
import { BigUIntValue, U32Value, BytesValue, VariadicValue, VariadicType, CompositeType, BytesType, BooleanType } from "../smartcontracts/typesystem";
import { BigNumber } from "bignumber.js";
import { Balance } from "../balance";
import { ApiNetworkProvider } from "./apiNetworkProvider";
import { ProxyNetworkProvider } from "./proxyNetworkProvider";

describe("test network providers on devnet: Proxy and API", function () {
    let apiProvider: INetworkProvider = new ApiNetworkProvider("https://devnet-api.elrond.com", { timeout: 10000 });
    let proxyProvider: INetworkProvider = new ProxyNetworkProvider("https://devnet-gateway.elrond.com", { timeout: 10000 });

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
        for (const user of [bob, carol, dan]) {
            let apiResponse = await apiProvider.getAccount(user.address);
            let proxyResponse = await proxyProvider.getAccount(user.address);

            assert.deepEqual(apiResponse, proxyResponse);
        }
    });

    it("should have same response for getFungibleTokensOfAccount(), getFungibleTokenOfAccount()", async function () {
        this.timeout(30000);

        for (const user of [carol, dan]) {
            let apiResponse = await apiProvider.getFungibleTokensOfAccount(user.address);
            let proxyResponse = await proxyProvider.getFungibleTokensOfAccount(user.address);

            assert.deepEqual(apiResponse.slice(0, 100), proxyResponse.slice(0, 100));

            for (const item of apiResponse.slice(0, 5)) {
                let apiResponse = await apiProvider.getFungibleTokenOfAccount(user.address, item.identifier);
                let proxyResponse = await proxyProvider.getFungibleTokenOfAccount(user.address, item.identifier);

                assert.deepEqual(apiResponse, proxyResponse, `user: ${user.address.bech32()}, token: ${item.identifier}`);
            }
        }
    });

    it("should have same response for getNonFungibleTokensOfAccount(), getNonFungibleTokenOfAccount", async function () {
        this.timeout(30000);

        for (const user of [alice, bob, carol, dan]) {
            let apiResponse = await apiProvider.getNonFungibleTokensOfAccount(user.address);
            let proxyResponse = await proxyProvider.getNonFungibleTokensOfAccount(user.address);

            assert.deepEqual(apiResponse.slice(0, 100), proxyResponse.slice(0, 100));

            for (const item of apiResponse.slice(0, 5)) {
                let apiResponse = await apiProvider.getNonFungibleTokenOfAccount(user.address, item.collection, item.nonce);
                let proxyResponse = await proxyProvider.getNonFungibleTokenOfAccount(user.address, item.collection, item.nonce);

                assert.deepEqual(apiResponse, proxyResponse, `user: ${user.address.bech32()}, token: ${item.identifier}`);
            }
        }
    });

    it("should have same response for getTransaction()", async function () {
        this.timeout(20000);

        let hashes = [
            new TransactionHash("b41f5fc39e96b1f194d07761c6efd6cb92278b95f5012ab12cbc910058ca8b54"),
            new TransactionHash("7757397a59378e9d0f6d5f08cc934c260e33a50ae0d73fdf869f7c02b6b47b33"),
            new TransactionHash("b87238089e81527158a6daee520280324bc7e5322ba54d1b3c9a5678abe953ea"),
            new TransactionHash("b45dd5e598bc85ba71639f2cbce8c5dff2fbe93159e637852fddeb16c0e84a48"),
            new TransactionHash("83db780e98d4d3c917668c47b33ba51445591efacb0df2a922f88e7dfbb5fc7d"),
            new TransactionHash("c2eb62b28cc7320da2292d87944c5424a70e1f443323c138c1affada7f6e9705"),
            // TODO: Uncomment once the Gateway returns all SCRs in this case, as well.
            // new TransactionHash("98e913c2a78cafdf4fa7f0113c1285fb29c2409bd7a746bb6f5506ad76841d54"),
            new TransactionHash("5b05945be8ba2635e7c13d792ad727533494358308b5fcf36a816e52b5b272b8"),
            new TransactionHash("47b089b5f0220299a017359003694a01fd75d075100166b8072c418d5143fe06"),
            new TransactionHash("85021f20b06662240d8302d62f68031bbf7261bacb53b84e3dc9346c0f10a8e7")
        ];

        for (const hash of hashes) {
            let apiResponse = await apiProvider.getTransaction(hash);
            let proxyResponse = await proxyProvider.getTransaction(hash);

            ignoreKnownTransactionDifferencesBetweenProviders(apiResponse, proxyResponse);
            assert.deepEqual(apiResponse, proxyResponse, `transaction: ${hash}`);
        }
    });

    // TODO: Strive to have as little differences as possible between Proxy and API.
    function ignoreKnownTransactionDifferencesBetweenProviders(apiResponse: ITransactionOnNetwork, proxyResponse: ITransactionOnNetwork) {
        // TODO: Remove this once "tx.status" is uniformized.
        apiResponse.status = proxyResponse.status = new TransactionStatus("ignore");

        // Ignore fields which are not present on API response:
        proxyResponse.epoch = 0;
        proxyResponse.blockNonce = new Nonce(0);
        proxyResponse.hyperblockNonce = new Nonce(0);
        proxyResponse.hyperblockHash = new Hash("");
    }

    // TODO: Fix differences of "tx.status", then enable this test.
    it.skip("should have same response for getTransactionStatus()", async function () {
        this.timeout(20000);

        let hashes = [
            new TransactionHash("b41f5fc39e96b1f194d07761c6efd6cb92278b95f5012ab12cbc910058ca8b54"),
            new TransactionHash("7757397a59378e9d0f6d5f08cc934c260e33a50ae0d73fdf869f7c02b6b47b33"),
            new TransactionHash("b87238089e81527158a6daee520280324bc7e5322ba54d1b3c9a5678abe953ea"),
            new TransactionHash("b45dd5e598bc85ba71639f2cbce8c5dff2fbe93159e637852fddeb16c0e84a48"),
            new TransactionHash("83db780e98d4d3c917668c47b33ba51445591efacb0df2a922f88e7dfbb5fc7d"),
            new TransactionHash("c2eb62b28cc7320da2292d87944c5424a70e1f443323c138c1affada7f6e9705"),
            new TransactionHash("98e913c2a78cafdf4fa7f0113c1285fb29c2409bd7a746bb6f5506ad76841d54"),
            new TransactionHash("5b05945be8ba2635e7c13d792ad727533494358308b5fcf36a816e52b5b272b8"),
            new TransactionHash("47b089b5f0220299a017359003694a01fd75d075100166b8072c418d5143fe06"),
            new TransactionHash("85021f20b06662240d8302d62f68031bbf7261bacb53b84e3dc9346c0f10a8e7")
        ];

        for (const hash of hashes) {
            let apiResponse = await apiProvider.getTransactionStatus(hash);
            let proxyResponse = await proxyProvider.getTransactionStatus(hash);

            assert.deepEqual(apiResponse, proxyResponse, `transaction: ${hash}`);
        }
    });

    it("should have same response for getDefinitionOfFungibleToken()", async function () {
        this.timeout(10000);

        let identifiers = ["MEX-b6bb7d", "WEGLD-88600a", "RIDE-482531", "USDC-a32906"];

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

        let collections = ["LKMEX-9acade", "LKFARM-c20c1c", "MEXFARM-bab93a", "ART-264971", "MOS-ff0040"];

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

        let tokens = [{ id: "ERDJSNFT-4a5669", nonce: new Nonce(1) }];

        for (const token of tokens) {
            let apiResponse = await apiProvider.getNonFungibleToken(token.id, token.nonce);

            assert.equal(apiResponse.collection, token.id);

            // TODO: Uncomment after implementing the function in the proxy provider.
            // let proxyResponse = await proxyProvider.getNonFungibleToken(token.id, token.nonce);
            // assert.deepEqual(apiResponse, proxyResponse);
        }
    });

    // TODO: enable when API fixes the imprecision around "gasRemaining".
    // TODO: enable when API supports queries with "value".
    it.skip("should have same response for queryContract()", async function () {
        this.timeout(10000);

        // Query: get ultimate answer
        let query = new Query({
            address: new Address("erd1qqqqqqqqqqqqqpgqggww7tjryk9saqzfpq09tw3vm06kl8h3396qqz277y"),
            func: new ContractFunction("getUltimateAnswer"),
            args: []
        });

        let apiResponse = await apiProvider.queryContract(query);
        let proxyResponse = await proxyProvider.queryContract(query);

        assert.deepEqual(apiResponse, proxyResponse);
        assert.deepEqual(apiResponse.getOutputUntyped(), proxyResponse.getOutputUntyped());

        // Query: increment counter
        query = new Query({
            address: new Address("erd1qqqqqqqqqqqqqpgqz045rw74nthgzw2te9lytgah775n3l08396q3wt4qq"),
            func: new ContractFunction("increment"),
            args: []
        });

        apiResponse = await apiProvider.queryContract(query);
        proxyResponse = await proxyProvider.queryContract(query);

        assert.deepEqual(apiResponse, proxyResponse);
        assert.deepEqual(apiResponse.getOutputUntyped(), proxyResponse.getOutputUntyped());

        // Query: issue ESDT
        query = new Query({
            address: new Address("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u"),
            func: new ContractFunction("issue"),
            value: Balance.egld(0.05),
            args: [
                BytesValue.fromUTF8("FOO"),
                BytesValue.fromUTF8("FOO"),
                new BigUIntValue(new BigNumber("10000")),
                new U32Value(18),
                new VariadicValue(new VariadicType(new CompositeType(new BytesType(), new BooleanType())), [])
            ]
        });

        apiResponse = await apiProvider.queryContract(query);
        proxyResponse = await proxyProvider.queryContract(query);
        
        assert.deepEqual(apiResponse, proxyResponse);
        assert.deepEqual(apiResponse.getOutputUntyped(), proxyResponse.getOutputUntyped());
    });
});
