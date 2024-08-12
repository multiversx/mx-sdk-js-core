import { assert } from "chai";
import { Address } from "../address";
import { TransactionVersion } from "../networkParams";
import { Signature } from "../signature";
import { loadTestWallets, TestWallet } from "../testutils";
import { TokenTransfer } from "../tokens";
import { Transaction } from "../transaction";
import { TransactionPayload } from "../transactionPayload";
import { ProtoSerializer } from "./serializer";
import { TransactionComputer } from "../transactionComputer";

describe("serialize transactions", () => {
    let wallets: Record<string, TestWallet>;
    let serializer = new ProtoSerializer();

    before(async function () {
        wallets = await loadTestWallets();
    });

    it("with no data, no value", async () => {
        let transaction = new Transaction({
            nonce: 89,
            value: 0,
            sender: wallets.alice.address,
            receiver: wallets.bob.address,
            gasLimit: 50000,
            chainID: "local-testnet",
        });

        const signer = wallets.alice.signer;
        transaction.applySignature(await signer.sign(transaction.serializeForSigning()));

        let buffer = serializer.serializeTransaction(transaction);
        assert.equal(
            buffer.toString("hex"),
            "0859120200001a208049d639e5a6980d1cd2392abcce41029cda74a1563523a202f09641cc2618f82a200139472eff6886771a982f3083da5d421f24c29181e63888228dc81ca60d69e1388094ebdc0340d08603520d6c6f63616c2d746573746e6574580262403f08a1dd64fbb627d10b048e0b45b1390f29bb0e457762a2ccb710b029f299022a67a4b8e45cf62f4314afec2e56b5574c71e38df96cc41fae757b7ee5062503",
        );
    });

    it("with data, no value", async () => {
        let transaction = new Transaction({
            nonce: 90,
            value: 0,
            sender: wallets.alice.address,
            receiver: wallets.bob.address,
            gasLimit: 80000,
            data: new TransactionPayload("hello"),
            chainID: "local-testnet",
        });

        const signer = wallets.alice.signer;
        transaction.applySignature(await signer.sign(transaction.serializeForSigning()));

        let buffer = serializer.serializeTransaction(transaction);
        assert.equal(
            buffer.toString("hex"),
            "085a120200001a208049d639e5a6980d1cd2392abcce41029cda74a1563523a202f09641cc2618f82a200139472eff6886771a982f3083da5d421f24c29181e63888228dc81ca60d69e1388094ebdc034080f1044a0568656c6c6f520d6c6f63616c2d746573746e657458026240f9e8c1caf7f36b99e7e76ee1118bf71b55cde11a2356e2b3adf15f4ad711d2e1982469cbba7eb0afbf74e8a8f78e549b9410cd86eeaa88fcba62611ac9f6e30e",
        );
    });

    it("with data, with value", async () => {
        let transaction = new Transaction({
            nonce: 91,
            value: TokenTransfer.egldFromAmount(10),
            sender: wallets.alice.address,
            receiver: wallets.bob.address,
            gasLimit: 100000,
            data: new TransactionPayload("for the book"),
            chainID: "local-testnet",
        });

        const signer = wallets.alice.signer;
        transaction.applySignature(await signer.sign(transaction.serializeForSigning()));

        let buffer = serializer.serializeTransaction(transaction);
        assert.equal(
            buffer.toString("hex"),
            "085b1209008ac7230489e800001a208049d639e5a6980d1cd2392abcce41029cda74a1563523a202f09641cc2618f82a200139472eff6886771a982f3083da5d421f24c29181e63888228dc81ca60d69e1388094ebdc0340a08d064a0c666f722074686520626f6f6b520d6c6f63616c2d746573746e657458026240b45f22e9f57a6df22670fcc3566723a0711a05ac2547456de59fd222a54940e4a1d99bd414897ccbf5c02a842ad86e638989b7f4d30edd26c99a8cd1eb092304",
        );
    });

    it("with data, with large value", async () => {
        let transaction = new Transaction({
            nonce: 92,
            value: "123456789000000000000000000000",
            sender: wallets.alice.address,
            receiver: wallets.bob.address,
            gasLimit: 100000,
            data: new TransactionPayload("for the spaceship"),
            chainID: "local-testnet",
        });

        const signer = wallets.alice.signer;
        transaction.applySignature(await signer.sign(transaction.serializeForSigning()));

        let buffer = serializer.serializeTransaction(transaction);
        assert.equal(
            buffer.toString("hex"),
            "085c120e00018ee90ff6181f3761632000001a208049d639e5a6980d1cd2392abcce41029cda74a1563523a202f09641cc2618f82a200139472eff6886771a982f3083da5d421f24c29181e63888228dc81ca60d69e1388094ebdc0340a08d064a11666f722074686520737061636573686970520d6c6f63616c2d746573746e65745802624001f05aa8cb0614e12a94ab9dcbde5e78370a4e05d23ef25a1fb9d5fcf1cb3b1f33b919cd8dafb1704efb18fa233a8aa0d3344fb6ee9b613a7d7a403786ffbd0a",
        );
    });

    it("with nonce = 0", async () => {
        let transaction = new Transaction({
            nonce: 0,
            value: "0",
            sender: wallets.alice.address,
            receiver: wallets.bob.address,
            gasLimit: 80000,
            data: new TransactionPayload("hello"),
            chainID: "local-testnet",
            version: new TransactionVersion(1),
        });

        transaction.applySignature(
            new Signature(
                "dfa3e9f2fdec60dcb353bac3b3435b4a2ff251e7e98eaf8620f46c731fc70c8ba5615fd4e208b05e75fe0f7dc44b7a99567e29f94fcd91efac7e67b182cd2a04",
            ),
        );

        let buffer = serializer.serializeTransaction(transaction);
        assert.equal(
            buffer.toString("hex"),
            "120200001a208049d639e5a6980d1cd2392abcce41029cda74a1563523a202f09641cc2618f82a200139472eff6886771a982f3083da5d421f24c29181e63888228dc81ca60d69e1388094ebdc034080f1044a0568656c6c6f520d6c6f63616c2d746573746e657458016240dfa3e9f2fdec60dcb353bac3b3435b4a2ff251e7e98eaf8620f46c731fc70c8ba5615fd4e208b05e75fe0f7dc44b7a99567e29f94fcd91efac7e67b182cd2a04",
        );
    });

    it("with usernames", async () => {
        const transaction = new Transaction({
            nonce: 204,
            value: "1000000000000000000",
            sender: Address.fromBech32("erd1k2s324ww2g0yj38qn2ch2jwctdy8mnfxep94q9arncc6xecg3xaq6mjse8"),
            receiver: Address.fromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th"),
            senderUsername: "carol",
            receiverUsername: "alice",
            gasLimit: 50000,
            chainID: "T",
        });

        const signer = wallets.carol.signer;
        transaction.applySignature(await signer.sign(transaction.serializeForSigning()));

        const buffer = serializer.serializeTransaction(transaction);
        assert.equal(
            buffer.toString("hex"),
            "08cc011209000de0b6b3a76400001a200139472eff6886771a982f3083da5d421f24c29181e63888228dc81ca60d69e12205616c6963652a20b2a11555ce521e4944e09ab17549d85b487dcd26c84b5017a39e31a3670889ba32056361726f6c388094ebdc0340d086035201545802624051e6cd78fb3ab4b53ff7ad6864df27cb4a56d70603332869d47a5cf6ea977c30e696103e41e8dddf2582996ad335229fdf4acb726564dbc1a0bc9e705b511f06",
        );
    });

    it("serialize with inner transactions", async () => {
        const innerTransaction = new Transaction({
            nonce: 204,
            value: "1000000000000000000",
            sender: Address.fromBech32("erd1k2s324ww2g0yj38qn2ch2jwctdy8mnfxep94q9arncc6xecg3xaq6mjse8"),
            receiver: Address.fromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th"),
            senderUsername: "carol",
            receiverUsername: "alice",
            gasLimit: 50000,
            chainID: "T",
        });

        const signer = wallets.carol.signer;
        const txComputer = new TransactionComputer();
        innerTransaction.signature = await signer.sign(txComputer.computeBytesForSigning(innerTransaction));

        const relayedTransaction = new Transaction({
            nonce: 204,
            value: "1000000000000000000",
            sender: Address.fromBech32("erd1k2s324ww2g0yj38qn2ch2jwctdy8mnfxep94q9arncc6xecg3xaq6mjse8"),
            receiver: Address.fromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th"),
            senderUsername: "carol",
            receiverUsername: "alice",
            gasLimit: 50000,
            chainID: "T",
            relayer: wallets["carol"].address.toBech32(),
            innerTransactions: [innerTransaction],
        });

        relayedTransaction.signature = await signer.sign(txComputer.computeBytesForSigning(relayedTransaction));

        const serializedTransaction = serializer.serializeTransaction(relayedTransaction);
        assert.equal(
            serializedTransaction.toString("hex"),
            "08cc011209000de0b6b3a76400001a200139472eff6886771a982f3083da5d421f24c29181e63888228dc81ca60d69e12205616c6963652a20b2a11555ce521e4944e09ab17549d85b487dcd26c84b5017a39e31a3670889ba32056361726f6c388094ebdc0340d0860352015458026240901a6a974d6ab36546e7881c6e0364ec4c61a891aa70e5eb60f818d6c92a39cfa0beac6fab73f503853cfe8fe6149b4be207ddb93788f8450d75a07fa8759d06820120b2a11555ce521e4944e09ab17549d85b487dcd26c84b5017a39e31a3670889ba8a01b10108cc011209000de0b6b3a76400001a200139472eff6886771a982f3083da5d421f24c29181e63888228dc81ca60d69e12205616c6963652a20b2a11555ce521e4944e09ab17549d85b487dcd26c84b5017a39e31a3670889ba32056361726f6c388094ebdc0340d086035201545802624051e6cd78fb3ab4b53ff7ad6864df27cb4a56d70603332869d47a5cf6ea977c30e696103e41e8dddf2582996ad335229fdf4acb726564dbc1a0bc9e705b511f06",
        );
    });
});
