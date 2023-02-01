import { loadTestWallets, TestWallet } from "./testutils";
import { assert } from "chai";
import * as errors from "./errors";
import { RelayedTransactionV1Builder } from "./relayedTransactionV1Builder";
import { Transaction } from "./transaction";
import { Address } from "./address";
import { TransactionPayload } from "./transactionPayload";
import { TransactionOptions, TransactionVersion } from "./networkParams";

describe("test relayed v1 transaction builder", function () {
    let alice: TestWallet, bob: TestWallet, grace: TestWallet, frank: TestWallet;

    before(async function () {
        ({ alice, bob, grace, frank } = await loadTestWallets());
    });

    it("should throw exception if args were not set", async function () {
        const builder = new RelayedTransactionV1Builder();
        assert.throw(() => builder.build(), errors.ErrInvalidRelayedV1BuilderArguments);

        const innerTx = new Transaction({
            nonce: 15,
            sender: alice.address,
            receiver: Address.fromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u"),
            gasLimit: 10000000,
            chainID: "1",
            data: new TransactionPayload("getContractConfig"),
        });
        builder.setInnerTransaction(innerTx);
        assert.throw(() => builder.build(), errors.ErrInvalidRelayedV1BuilderArguments);

        const networkConfig = {
            MinGasLimit: 50_000,
            GasPerDataByte: 1_500,
            GasPriceModifier: 0.01,
            ChainID: "T"
        };
        builder.setNetworkConfig(networkConfig);
        assert.throw(() => builder.build(), errors.ErrInvalidRelayedV1BuilderArguments);

        builder.setRelayerAddress(alice.getAddress());
        assert.doesNotThrow(() => builder.build());
    });

    it("should compute relayed v1 transaction", async function () {
        const networkConfig = {
            MinGasLimit: 50_000,
            GasPerDataByte: 1_500,
            GasPriceModifier: 0.01,
            ChainID: "T"
        };

        const innerTx = new Transaction({
            nonce: 198,
            sender: bob.address,
            receiver: Address.fromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u"),
            gasLimit: 60000000,
            chainID: networkConfig.ChainID,
            data: new TransactionPayload("getContractConfig"),
        });

        await bob.signer.sign(innerTx);

        const builder = new RelayedTransactionV1Builder();
        const relayedTxV1 = builder
            .setInnerTransaction(innerTx)
            .setRelayerNonce(2627)
            .setNetworkConfig(networkConfig)
            .setRelayerAddress(alice.address)
            .build();

        await alice.signer.sign(relayedTxV1);

        assert.equal(relayedTxV1.getNonce().valueOf(), 2627);
        assert.equal(relayedTxV1.getData().toString(), "relayedTx@7b226e6f6e6365223a3139382c2273656e646572223a2267456e574f65576d6d413063306a6b71764d354241707a61644b46574e534f69417643575163776d4750673d222c227265636569766572223a22414141414141414141414141415141414141414141414141414141414141414141414141414141432f2f383d222c2276616c7565223a302c226761735072696365223a313030303030303030302c226761734c696d6974223a36303030303030302c2264617461223a225a3256305132397564484a68593352446232356d6157633d222c227369676e6174757265223a2239682b6e6742584f5536776674315464437368534d4b3454446a5a32794f74686336564c576e3478724d5a706248427738677a6c6659596d362b766b505258303764634a562b4745635462616a7049692b5a5a5942773d3d222c22636861696e4944223a2256413d3d222c2276657273696f6e223a317d");
        assert.equal(relayedTxV1.getSignature().hex(), "c7d2c3b971f44eca676c10624d3c4319f8898af159f003e1e59f446cb75e5a294c9f0758d800e04d3daff11e67d20c4c1f85fd54aad6deb947ef391e6dd09d07");
    });

    it("should compute guarded inner Tx - relayed v1 transaction", async function () {
        const networkConfig = {
            MinGasLimit: 50_000,
            GasPerDataByte: 1_500,
            GasPriceModifier: 0.01,
            ChainID: "T"
        };

        const innerTx = new Transaction({
            nonce: 198,
            sender: bob.address,
            receiver: Address.fromBech32("erd1qqqqqqqqqqqqqpgq54tsxmej537z9leghvp69hfu4f8gg5eu396q83gnnz"),
            gasLimit: 60000000,
            chainID: networkConfig.ChainID,
            data: new TransactionPayload("getContractConfig"),
            guardian: grace.address,
            version: TransactionVersion.withTxOptions(),
            options: TransactionOptions.withTxGuardedOptions(),
        });

        await bob.signer.sign(innerTx);
        innerTx.applyGuardianSignature(innerTx.getSignature());

        const builder = new RelayedTransactionV1Builder();
        const relayedTxV1 = builder
            .setInnerTransaction(innerTx)
            .setRelayerNonce(2627)
            .setNetworkConfig(networkConfig)
            .setRelayerAddress(alice.address)
            .build();

        await alice.signer.sign(relayedTxV1);

        assert.equal(relayedTxV1.getNonce().valueOf(), 2627);
        assert.equal(relayedTxV1.getData().toString(), "relayedTx@7b226e6f6e6365223a3139382c2273656e646572223a2267456e574f65576d6d413063306a6b71764d354241707a61644b46574e534f69417643575163776d4750673d222c227265636569766572223a22414141414141414141414146414b565841323879704877692f79693741364c64504b704f68464d386958513d222c2276616c7565223a302c226761735072696365223a313030303030303030302c226761734c696d6974223a36303030303030302c2264617461223a225a3256305132397564484a68593352446232356d6157633d222c227369676e6174757265223a224b4b78324f33383655725135416b4f465258307578327933446a384853334b373038487174344668377161557669424550716c45614e746e6158706a6f2f333651476d4a456934784435457a6c6f4f677a634d4442773d3d222c22636861696e4944223a2256413d3d222c2276657273696f6e223a322c226f7074696f6e73223a322c22677561726469616e223a22486f714c61306e655733766843716f56696c70715372744c5673774939535337586d7a563868477450684d3d222c22677561726469616e5369676e6174757265223a224b4b78324f33383655725135416b4f465258307578327933446a384853334b373038487174344668377161557669424550716c45614e746e6158706a6f2f333651476d4a456934784435457a6c6f4f677a634d4442773d3d227d");
        assert.equal(relayedTxV1.getSignature().hex(), "92f4072647a8ee9ba6402db4004646955c85451246c11d5a0d432b2df72944aac25b21769a880804a95c48be7b3086f60341ffb68e94d63780220fd875bbdb0c");
    });

    it("should compute guarded innder tx and guarded relayed v1 transaction", async function () {
        const networkConfig = {
            MinGasLimit: 50_000,
            GasPerDataByte: 1_500,
            GasPriceModifier: 0.01,
            ChainID: "T"
        };

        const innerTx = new Transaction({
            nonce: 198,
            sender: bob.address,
            receiver: Address.fromBech32("erd1qqqqqqqqqqqqqpgq54tsxmej537z9leghvp69hfu4f8gg5eu396q83gnnz"),
            gasLimit: 60000000,
            chainID: networkConfig.ChainID,
            data: new TransactionPayload("addNumber"),
            guardian: grace.address,
            version: TransactionVersion.withTxOptions(),
            options: TransactionOptions.withTxGuardedOptions(),
        });

        await bob.signer.sign(innerTx);
        innerTx.applyGuardianSignature(innerTx.getSignature());

        const builder = new RelayedTransactionV1Builder();
        const relayedTxV1 = builder
            .setInnerTransaction(innerTx)
            .setRelayerNonce(2627)
            .setNetworkConfig(networkConfig)
            .setRelayerAddress(alice.address)
            .setRelayedTransactionVersion(TransactionVersion.withTxOptions())
            .setRelayedTransactionOptions(TransactionOptions.withTxGuardedOptions())
            .setRelayedTransactionGuardian(frank.address)
            .build();

        await alice.signer.sign(relayedTxV1);
        relayedTxV1.applyGuardianSignature(relayedTxV1.getSignature());

        assert.equal(relayedTxV1.getNonce().valueOf(), 2627);
        assert.equal(relayedTxV1.getData().toString(), "relayedTx@7b226e6f6e6365223a3139382c2273656e646572223a2267456e574f65576d6d413063306a6b71764d354241707a61644b46574e534f69417643575163776d4750673d222c227265636569766572223a22414141414141414141414146414b565841323879704877692f79693741364c64504b704f68464d386958513d222c2276616c7565223a302c226761735072696365223a313030303030303030302c226761734c696d6974223a36303030303030302c2264617461223a225957526b546e5674596d5679222c227369676e6174757265223a223469724d4b4a656d724d375174344e7635487633544c44683775654779487045564c4371674a3677652f7a662b746a4933354975573452633458543451533433475333356158386c6a533834324a38426854645043673d3d222c22636861696e4944223a2256413d3d222c2276657273696f6e223a322c226f7074696f6e73223a322c22677561726469616e223a22486f714c61306e655733766843716f56696c70715372744c5673774939535337586d7a563868477450684d3d222c22677561726469616e5369676e6174757265223a223469724d4b4a656d724d375174344e7635487633544c44683775654779487045564c4371674a3677652f7a662b746a4933354975573452633458543451533433475333356158386c6a533834324a38426854645043673d3d227d");
        assert.equal(relayedTxV1.getSignature().hex(), "c82d08772c86d9b6889fb9f33eec65c6a04a950daa012825464c6ccaad71640cfcf5c4d38b36fb0575345bbec90daeb2db7a423bfb5253cef0ddc5c87d1b5f04");
    });
});
