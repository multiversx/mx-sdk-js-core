import { assert } from "chai";
import { Address } from "../address";
import { ErrBadUsage } from "../errors";
import { NextTokenTransfer, Token, TokenComputer } from "../tokens";
import { TransactionsFactoryConfig } from "./transactionsFactoryConfig";
import { NextTransferTransactionsFactory } from "./transferTransactionsFactory";

describe("test transfer transcations factory", function () {
    const config = new TransactionsFactoryConfig({ chainID: "D" });
    const nextTransferFactory = new NextTransferTransactionsFactory({
        config: config,
        tokenComputer: new TokenComputer(),
    });

    const alice = Address.fromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
    const bob = Address.fromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx");

    it("should throw error, no token transfer provided", async () => {
        let transfers: any = [];

        assert.throw(
            () => {
                nextTransferFactory.createTransactionForESDTTokenTransfer({
                    sender: alice,
                    receiver: bob,
                    tokenTransfers: transfers,
                });
            },
            ErrBadUsage,
            "No token transfer has been provided",
        );
    });

    it("should create 'TransactionNext' for native token transfer without data", async () => {
        const transaction = nextTransferFactory.createTransactionForNativeTokenTransfer({
            sender: alice,
            receiver: bob,
            nativeAmount: 1000000000000000000n,
        });

        assert.equal(transaction.sender, alice.bech32());
        assert.equal(transaction.receiver, bob.bech32());
        assert.equal(transaction.value.valueOf(), 1000000000000000000n);
        assert.equal(transaction.gasLimit.valueOf(), 50000n);
        assert.deepEqual(transaction.data, new Uint8Array());
    });

    it("should create 'TransactionNext' for native token transfer with data", async () => {
        const transaction = nextTransferFactory.createTransactionForNativeTokenTransfer({
            sender: alice,
            receiver: bob,
            nativeAmount: 1000000000000000000n,
            data: "test data",
        });

        assert.equal(transaction.sender, alice.bech32());
        assert.equal(transaction.receiver, bob.bech32());
        assert.equal(transaction.value.valueOf(), 1000000000000000000n);
        assert.equal(transaction.gasLimit.valueOf(), 63500n);
        assert.deepEqual(transaction.data, Buffer.from("test data"));
    });

    it("should create 'TransactionNext' for esdt transfer", async () => {
        const fooToken = new Token("FOO-123456", 0n);
        const transfer = new NextTokenTransfer(fooToken, 1000000n);

        const transaction = nextTransferFactory.createTransactionForESDTTokenTransfer({
            sender: alice,
            receiver: bob,
            tokenTransfers: [transfer],
        });

        assert.equal(transaction.sender, alice.bech32());
        assert.equal(transaction.receiver, bob.bech32());
        assert.equal(transaction.value.valueOf(), 0n);
        assert.equal(transaction.gasLimit.valueOf(), 410000n);
        assert.deepEqual(transaction.data.toString(), "ESDTTransfer@464f4f2d313233343536@0f4240");
    });

    it("should create 'TransactionNext' for nft transfer", async () => {
        const nft = new Token("NFT-123456", 10n);
        const transfer = new NextTokenTransfer(nft, 1n);

        const transaction = nextTransferFactory.createTransactionForESDTTokenTransfer({
            sender: alice,
            receiver: bob,
            tokenTransfers: [transfer],
        });

        assert.equal(transaction.sender, alice.bech32());
        assert.equal(transaction.receiver, alice.bech32());
        assert.equal(transaction.value.valueOf(), 0n);
        assert.equal(transaction.gasLimit.valueOf(), 1210500n);
        assert.deepEqual(
            transaction.data.toString(),
            "ESDTNFTTransfer@4e46542d313233343536@0a@01@8049d639e5a6980d1cd2392abcce41029cda74a1563523a202f09641cc2618f8",
        );
    });

    it("should create 'TransactionNext' for multiple nft transfers", async () => {
        const firstNft = new Token("NFT-123456", 10n);
        const firstTransfer = new NextTokenTransfer(firstNft, 1n);

        const secondNft = new Token("TEST-987654", 1n);
        const secondTransfer = new NextTokenTransfer(secondNft, 1n);

        const transaction = nextTransferFactory.createTransactionForESDTTokenTransfer({
            sender: alice,
            receiver: bob,
            tokenTransfers: [firstTransfer, secondTransfer],
        });

        assert.equal(transaction.sender, alice.bech32());
        assert.equal(transaction.receiver, alice.bech32());
        assert.equal(transaction.value.valueOf(), 0n);
        assert.equal(transaction.gasLimit.valueOf(), 1466000n);
        assert.deepEqual(
            transaction.data.toString(),
            "MultiESDTNFTTransfer@8049d639e5a6980d1cd2392abcce41029cda74a1563523a202f09641cc2618f8@02@4e46542d313233343536@0a@01@544553542d393837363534@01@01",
        );
    });
});
