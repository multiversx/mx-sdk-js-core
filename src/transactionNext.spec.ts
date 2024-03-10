import { assert } from "chai";
import { TestWallet, loadTestWallets } from "./testutils";
import { TransactionNext, TransactionComputer, Transaction } from "./transaction";
import { ProtoSerializer } from "./proto";

class NetworkConfig {
    MinGasLimit: number;
    GasPerDataByte: number;
    GasPriceModifier: number;
    ChainID: string;

    constructor(minGasLimit: number = 50000) {
        this.MinGasLimit = minGasLimit;
        this.GasPerDataByte = 1500;
        this.GasPriceModifier = 0.01;
        this.ChainID = "D";
    }
}

describe("test transaction next", async () => {
    let wallets: Record<string, TestWallet>;
    const networkConfig = new NetworkConfig();
    const transactionComputer = new TransactionComputer();

    before(async function () {
        wallets = await loadTestWallets();
    });

    it("should serialize transaction for signing", async () => {
        const sender = "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th";
        const receiver = "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx";

        let transaction = new TransactionNext({
            chainID: networkConfig.ChainID,
            sender: sender,
            receiver: receiver,
            gasLimit: 50000n,
            value: 0n,
            version: 2,
            nonce: 89n,
        });

        let serializedTransactionBytes = transactionComputer.computeBytesForSigning(transaction);
        let serializedTransaction = Buffer.from(serializedTransactionBytes).toString();

        assert.equal(
            serializedTransaction,
            `{"nonce":89,"value":"0","receiver":"erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx","sender":"erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th","gasPrice":1000000000,"gasLimit":50000,"chainID":"D","version":2}`,
        );

        transaction = new TransactionNext({
            chainID: networkConfig.ChainID,
            sender: sender,
            receiver: receiver,
            gasLimit: 70000n,
            value: 1000000000000000000n,
            version: 2,
            nonce: 90n,
            data: new Uint8Array(Buffer.from("hello")),
        });

        serializedTransactionBytes = transactionComputer.computeBytesForSigning(transaction);
        serializedTransaction = Buffer.from(serializedTransactionBytes).toString();

        assert.equal(
            serializedTransaction,
            `{"nonce":90,"value":"1000000000000000000","receiver":"erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx","sender":"erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th","gasPrice":1000000000,"gasLimit":70000,"data":"aGVsbG8=","chainID":"D","version":2}`,
        );
    });

    it("should serialize transaction with usernames", async () => {
        const transaction = new TransactionNext({
            chainID: "T",
            sender: wallets.carol.address.bech32(),
            receiver: wallets.alice.address.bech32(),
            gasLimit: 50000n,
            value: 1000000000000000000n,
            version: 2,
            nonce: 204n,
            senderUsername: "carol",
            receiverUsername: "alice",
        });

        transaction.signature = await wallets.carol.signer.sign(
            Buffer.from(transactionComputer.computeBytesForSigning(transaction)),
        );
        console.log(Buffer.from(transaction.signature).toString("hex"));

        assert.equal(
            Buffer.from(transaction.signature).toString("hex"),
            "51e6cd78fb3ab4b53ff7ad6864df27cb4a56d70603332869d47a5cf6ea977c30e696103e41e8dddf2582996ad335229fdf4acb726564dbc1a0bc9e705b511f06",
        );
    });

    it("should compute transaction hash", async () => {
        const transaction = new TransactionNext({
            chainID: networkConfig.ChainID,
            sender: wallets.alice.address.bech32(),
            receiver: wallets.alice.address.bech32(),
            gasLimit: 100000n,
            value: 1000000000000n,
            version: 2,
            nonce: 17243n,
            data: Buffer.from("testtx"),
        });
        transaction.signature = Buffer.from(
            "eaa9e4dfbd21695d9511e9754bde13e90c5cfb21748a339a79be11f744c71872e9fe8e73c6035c413f5f08eef09e5458e9ea6fc315ff4da0ab6d000b450b2a07",
            "hex",
        );

        const hash = transactionComputer.computeTransactionHash(transaction);
        assert.equal(
            Buffer.from(hash).toString("hex"),
            "169b76b752b220a76a93aeebc462a1192db1dc2ec9d17e6b4d7b0dcc91792f03",
        );
    });

    it("should compute transaction hash with usernames", async () => {
        const transaction = new TransactionNext({
            chainID: networkConfig.ChainID,
            sender: wallets.alice.address.bech32(),
            receiver: wallets.alice.address.bech32(),
            gasLimit: 100000n,
            value: 1000000000000n,
            version: 2,
            nonce: 17244n,
            data: Buffer.from("testtx"),
            senderUsername: "alice",
            receiverUsername: "alice",
        });
        transaction.signature = Buffer.from(
            "807bcd7de5553ea6dfc57c0510e84d46813c5963d90fec50991c500091408fcf6216dca48dae16a579a1611ed8b2834bae8bd0027dc17eb557963f7151b82c07",
            "hex",
        );

        const hash = transactionComputer.computeTransactionHash(transaction);
        assert.equal(
            Buffer.from(hash).toString("hex"),
            "41b5acf7ebaf4a9165a64206b6ebc02021b3adda55ffb2a2698aac2e7004dc29",
        );
    });

    it("should throw `NotEnoughGas` error", async () => {
        const transaction = new TransactionNext({
            chainID: networkConfig.ChainID,
            sender: wallets.alice.address.bech32(),
            receiver: wallets.alice.address.bech32(),
            gasLimit: 50000n,
            data: Buffer.from("toolittlegaslimit"),
        });

        assert.throws(() => {
            transactionComputer.computeTransactionFee(transaction, networkConfig);
        });
    });

    it("should compute transaction fee", async () => {
        const transaction = new TransactionNext({
            chainID: networkConfig.ChainID,
            sender: wallets.alice.address.bech32(),
            receiver: wallets.alice.address.bech32(),
            gasLimit: 20n,
            gasPrice: 500n,
        });

        const config = new NetworkConfig(10);
        const gasLimit = transactionComputer.computeTransactionFee(transaction, config);
        assert.equal(gasLimit.toString(), "5050");
    });

    it("should compute transaction fee for transaction with data field", async () => {
        const transaction = new TransactionNext({
            chainID: networkConfig.ChainID,
            sender: wallets.alice.address.bech32(),
            receiver: wallets.alice.address.bech32(),
            gasLimit: 12010n,
            gasPrice: 500n,
            data: Buffer.from("testdata"),
        });

        const config = new NetworkConfig(10);
        const gasLimit = transactionComputer.computeTransactionFee(transaction, config);
        assert.equal(gasLimit.toString(), "6005000");
    });

    it("should compute guarded transaction", async () => {
        const alice = wallets.alice;

        const transaction = new TransactionNext({
            chainID: "local-testnet",
            sender: alice.address.bech32(),
            receiver: wallets.bob.address.bech32(),
            gasLimit: 150000n,
            gasPrice: 1000000000n,
            data: new Uint8Array(Buffer.from("test data field")),
            version: 2,
            options: 2,
            nonce: 92n,
            value: 123456789000000000000000000000n,
            guardian: "erd1x23lzn8483xs2su4fak0r0dqx6w38enpmmqf2yrkylwq7mfnvyhsxqw57y",
        });
        transaction.guardianSignature = new Uint8Array(64);
        transaction.signature = new Uint8Array(
            await alice.signer.sign(Buffer.from(transactionComputer.computeBytesForSigning(transaction))),
        );

        let serializer = new ProtoSerializer();
        let buffer = serializer.serializeTransaction(transaction);
        assert.equal(
            buffer.toString("hex"),
            "085c120e00018ee90ff6181f3761632000001a208049d639e5a6980d1cd2392abcce41029cda74a1563523a202f09641cc2618f82a200139472eff6886771a982f3083da5d421f24c29181e63888228dc81ca60d69e1388094ebdc0340f093094a0f746573742064617461206669656c64520d6c6f63616c2d746573746e657458026240e574d78b19e1481a6b9575c162e66f2f906a3178aec537509356385c4f1a5330a9b73a87a456fc6d7041e93b5f8a1231a92fb390174872a104a0929215600c0c6802722032a3f14cf53c4d0543954f6cf1bda0369d13e661dec095107627dc0f6d33612f7a4000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        );

        const txHash = transactionComputer.computeTransactionHash(transaction);
        assert.equal(
            Buffer.from(txHash).toString("hex"),
            "242022e9dcfa0ee1d8199b0043314dbda8601619f70069ebc441b9f03349a35c",
        );
    });
});
