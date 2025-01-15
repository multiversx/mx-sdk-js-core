import { assert, expect } from "chai";
import { Address } from "../address";
import { ProxyNetworkProvider } from "./proxyNetworkProvider";

describe("ProxyNetworkProvider Tests", () => {
    const proxy = new ProxyNetworkProvider("https://devnet-gateway.multiversx.com");

    it("should fetch network configuration", async () => {
        const result = await proxy.getNetworkConfig();
        assert.equal(result.ChainID, "D");
        assert.equal(result.GasPerDataByte, 1500);
        assert.equal(result.RoundDuration, 6000);
        assert.equal(result.MinGasLimit, 50000);
        assert.equal(result.MinGasPrice, 1_000_000_000);
    });

    it("should fetch network status", async () => {
        const result = await proxy.getNetworkStatus();
        assert.exists(result.Nonce);
        assert.exists(result.CurrentRound);
        assert.exists(result.HighestFinalNonce);
    });

    it("should fetch block details by hash and nonce", async () => {
        const shard = 1;
        const blockHash = "ded535cc0afb2dc5f9787e9560dc48d0b83564a3f994a390b228d894d854699f";
        const resultByHash = await proxy.getBlock({ shard, blockHash });

        const blockNonce = 5949242n;
        const resultByNonce = await proxy.getBlock({ shard, blockNonce });

        assert.equal(resultByHash.hash, blockHash);
        assert.equal(resultByHash.nonce, 5949242n);
        assert.equal(resultByHash.shard, 1);
        assert.equal(resultByHash.timestamp, 1730112578);
        assert.deepEqual(resultByHash, resultByNonce);
    });

    it("should fetch the latest block", async () => {
        const result = await proxy.getLatestBlock();
        expect(result).to.exist;
    });

    it("should fetch account details", async () => {
        const address1 = Address.newFromBech32("erd1487vz5m4zpxjyqw4flwa3xhnkzg4yrr3mkzf5sf0zgt94hjprc8qazcccl");
        const result1 = await proxy.getAccount(address1);

        assert.equal(result1.address.toBech32(), "erd1487vz5m4zpxjyqw4flwa3xhnkzg4yrr3mkzf5sf0zgt94hjprc8qazcccl");
        assert.isUndefined(result1.userName);
        assert.isUndefined(result1.contractOwnerAddress);

        const address2 = Address.newFromBech32("erd1qqqqqqqqqqqqqpgq076flgeualrdu5jyyj60snvrh7zu4qrg05vqez5jen");
        const result2 = await proxy.getAccount(address2);

        assert.equal(result2.address.toBech32(), "erd1qqqqqqqqqqqqqpgq076flgeualrdu5jyyj60snvrh7zu4qrg05vqez5jen");
        assert.isUndefined(result2.userName);
        assert.equal(
            result2.contractOwnerAddress?.toBech32(),
            "erd1wzx0tak22f2me4g7wpxfae2w3htfue7khrg28fy6wu8x9hzq05vqm8qhnm",
        );
        assert.isFalse(result2.isContractPayable);
        assert.isTrue(result2.isContractReadable);
    });

    it("should fetch account storage", async () => {
        const address = Address.newFromBech32("erd1qqqqqqqqqqqqqpgq076flgeualrdu5jyyj60snvrh7zu4qrg05vqez5jen");
        const result = await proxy.getAccountStorage(address);

        assert.equal(result.entries.length, 1);
        assert.equal(result.entries[0].key, "sum");
        assert.exists(result.entries[0].value);
    });

    it("should fetch a storage entry for an account", async () => {
        const address = Address.newFromBech32("erd1qqqqqqqqqqqqqpgq076flgeualrdu5jyyj60snvrh7zu4qrg05vqez5jen");
        const result = await proxy.getAccountStorageEntry(address, "sum");

        assert.equal(result.key, "sum");
        assert.exists(result.value);
    });

    it("should fetch fungible tokens of an account", async () => {
        const address = Address.newFromBech32("erd1487vz5m4zpxjyqw4flwa3xhnkzg4yrr3mkzf5sf0zgt94hjprc8qazcccl");
        const tokens = await proxy.getFungibleTokensOfAccount(address);
        assert.isTrue(tokens.length > 0);

        const filtered = tokens.filter((token) => token.token.identifier === "TEST-ff155e");
        assert.equal(filtered.length, 1);
        assert.equal(filtered[0].token.identifier, "TEST-ff155e");
        assert.equal(filtered[0].amount.toString(), "99999999999980000");
    });

    it("should fetch non-fungible tokens of an account", async () => {
        const address = Address.newFromBech32("erd1487vz5m4zpxjyqw4flwa3xhnkzg4yrr3mkzf5sf0zgt94hjprc8qazcccl");
        const tokens = await proxy.getNonFungibleTokensOfAccount(address);
        assert.isTrue(tokens.length > 0);

        const filtered = tokens.filter((token) => token.token.identifier === "NFTEST-ec88b8-01");
        assert.equal(filtered.length, 1);
        assert.equal(filtered[0].token.identifier, "NFTEST-ec88b8-01");
        assert.equal(filtered[0].token.nonce, 1n);
        assert.equal(filtered[0].amount, 1n);
    });

    it("should fetch transaction status", async () => {
        const txHash = "9d47c4b4669cbcaa26f5dec79902dd20e55a0aa5f4b92454a74e7dbd0183ad6c";
        const result = await proxy.getTransactionStatus(txHash);
        expect(result.status).to.equal("success");
    });

    // Additional tests would follow the same pattern, adjusting for async/await where needed.
});
