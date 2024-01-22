import { assert } from "chai";
import { TransactionsFactoryConfig } from "./transactionsFactoryConfig";
import {NextTransferTransactionsFactory } from "./transferTransactionsFactory";
import {NextTokenTransfer, Token, TokenComputer} from "../tokens";
import { Address } from "../address";
import {MultisigTransactionFactory} from "./multisigTransactionFactory";
import {ErrBadUsage} from "../errors";

describe("test transfer transcations factory", function () {
    const config = new TransactionsFactoryConfig("D");
    const factory = new MultisigTransactionFactory(config, new TokenComputer());

    const alice = Address.fromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
    const bob = Address.fromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx");
    const carol = Address.fromBech32("erd1k2s324ww2g0yj38qn2ch2jwctdy8mnfxep94q9arncc6xecg3xaq6mjse8");

    it("should create propose native token transfer", function () {
        const draftTx = factory.createTransactionForProposeNativeTransfer({
            sender: alice,
            receiver: bob,
            multisig: carol,
            nativeAmount: "1000000000000000000"
        });

        assert.equal(draftTx.data.toString(), "proposeTransferExecute@8049d639e5a6980d1cd2392abcce41029cda74a1563523a202f09641cc2618f8@0de0b6b3a7640000");
    });

    it("should throw error for esdt transfers when no token is provided", async () => {
        let transfers: any = [];

        assert.throw(
            () => {
                factory.createTransactionForProposeESDTTransfer({
                    sender: alice,
                    receiver: bob,
                    multisig: carol,
                    tokenTransfers: transfers,
                });
            },
            ErrBadUsage,
            "No token transfer has been provided"
        );
    });

    it("should create propose esdt with single token transfer", function () {
        const fooToken = new Token("FOO-123456", 0);
        const transfer = new NextTokenTransfer(fooToken, 1000000);

        const transaction = factory.createTransactionForProposeESDTTransfer({
            sender: alice,
            receiver: bob,
            multisig: carol,
            tokenTransfers: [transfer],
        });

        assert.equal(transaction.data.toString(), "proposeAsyncCall@8049d639e5a6980d1cd2392abcce41029cda74a1563523a202f09641cc2618f8@@ESDTTransfer@464f4f2d313233343536@0f4240");
    });

    it("should create propose esdt with multiple token transfers", function () {
        const fooToken = new Token("FOO-123456", 0);
        const transfer = new NextTokenTransfer(fooToken, 1000000);

        const barToken = new Token("BAR-123456", 0);
        const secondTransfer = new NextTokenTransfer(barToken, 1000000);

        const transaction = factory.createTransactionForProposeESDTTransfer({
            sender: alice,
            receiver: bob,
            multisig: carol,
            tokenTransfers: [transfer, secondTransfer],
        });

        assert.equal(transaction.data.toString(), "proposeAsyncCall@8049d639e5a6980d1cd2392abcce41029cda74a1563523a202f09641cc2618f8@@MultiESDTNFTTransfer@8049d639e5a6980d1cd2392abcce41029cda74a1563523a202f09641cc2618f8@02@464f4f2d313233343536@00@0f4240@4241522d313233343536@00@0f4240");
    });
});