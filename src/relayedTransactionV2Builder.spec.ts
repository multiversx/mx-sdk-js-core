import { loadTestWallets, TestWallet } from "./testutils";
import { RelayedTransactionV2Builder } from "./relayedTransactionV2Builder";
import { Address } from "./address";
import { TransactionPayload } from "./transactionPayload";
import { assert } from "chai";
import { Transaction } from "./transaction";
import * as errors from "./errors";

describe("test relayed v2 transaction builder", function () {
    let alice: TestWallet, bob: TestWallet;

    before(async function () {
        ({ alice, bob } = await loadTestWallets());
    });

    it("should throw exception if args were not set", async function () {
        const builder = new RelayedTransactionV2Builder();
        assert.throw(() => builder.build(), errors.ErrInvalidRelayedV2BuilderArguments);
    });

    it("should throw exception if gas limit of the inner tx is not 0", async function () {
        let builder = new RelayedTransactionV2Builder();

        let networkConfig = {
            MinGasLimit: 50_000,
            GasPerDataByte: 1_500,
            GasPriceModifier: 0.01,
            ChainID: "T"
        };

        const innerTx = new Transaction({
            nonce: 15,
            sender: alice.address,
            receiver: Address.fromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u"),
            gasLimit: 10,
            chainID: networkConfig.ChainID,
            data: new TransactionPayload("getContractConfig"),
        });
        builder = builder
            .setNetworkConfig(networkConfig)
            .setInnerTransactionGasLimit(10)
            .setInnerTransaction(innerTx)
            .setRelayerAddress(alice.address);
        assert.throw(() => builder.build(), errors.ErrGasLimitShouldBe0ForInnerTransaction);

        innerTx.setGasLimit({
            valueOf: function () {
                return 10;
            }
        });
        builder = builder.setNetworkConfig(networkConfig).setInnerTransactionGasLimit(10).setInnerTransaction(innerTx);
        assert.throw(() => builder.build(), errors.ErrGasLimitShouldBe0ForInnerTransaction);
    });

    it("should compute relayed v2 tx", async function () {
        let networkConfig = {
            MinGasLimit: 50_000,
            GasPerDataByte: 1_500,
            GasPriceModifier: 0.01,
            ChainID: "T"
        };

        const innerTx = new Transaction({
            nonce: 15,
            sender: bob.address,
            receiver: Address.fromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u"),
            gasLimit: 0,
            chainID: networkConfig.ChainID,
            data: new TransactionPayload("getContractConfig"),
            version: 2,
        });

        await bob.signer.sign(innerTx);

        const builder = new RelayedTransactionV2Builder();
        const relayedTxV2 = builder
            .setInnerTransaction(innerTx)
            .setInnerTransactionGasLimit(60_000_000)
            .setRelayerNonce(37)
            .setNetworkConfig(networkConfig)
            .setRelayerAddress(alice.getAddress())
            .build();

        relayedTxV2.setSender(alice.address);
        await alice.signer.sign(relayedTxV2);

        assert.equal(relayedTxV2.getNonce().valueOf(), 37);
        assert.equal(relayedTxV2.getVersion().valueOf(), 2);
        assert.equal(
            relayedTxV2.getData().toString(),
            "relayedTxV2@000000000000000000010000000000000000000000000000000000000002ffff@0f@676574436f6e7472616374436f6e666967@fc3ed87a51ee659f937c1a1ed11c1ae677e99629fae9cc289461f033e6514d1a8cfad1144ae9c1b70f28554d196bd6ba1604240c1c1dc19c959e96c1c3b62d0c");
    });
});


