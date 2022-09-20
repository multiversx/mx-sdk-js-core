import {loadTestWallets, TestWallet} from "./testutils";
import {assert} from "chai";
import * as errors from "./errors";
import {RelayedTransactionV1Builder} from "./relayedTransactionV1Builder";
import {Transaction} from "./transaction";
import {Address} from "./address";
import {TransactionPayload} from "./transactionPayload";

describe("test relayed v1 transaction builder", function () {
    let alice: TestWallet, bob: TestWallet;

    before(async function () {
        ({alice, bob} = await loadTestWallets());
    });

    it("should throw exception if args were not set", async function () {
        const builder = new RelayedTransactionV1Builder();
        assert.throw(() => builder.build(), errors.ErrInvalidRelayedV1BuilderArguments);

        const innerTx = new Transaction({
            nonce: 15,
            sender: alice.address,
            receiver: Address.fromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u"),
            gasLimit: 10,
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
            .setNetworkConfig(networkConfig)
            .setRelayerAddress(alice.address)
            .build();

        relayedTxV1.setNonce(2627);
        await alice.signer.sign(relayedTxV1);

        console.log(relayedTxV1.serializeForSigning(alice.address).toString());
        console.log(relayedTxV1.getSignature().hex());
    });
});
