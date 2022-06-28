import {loadTestWallets, TestWallet} from "./testutils";
import {RelayedTransactionV2Builder} from "./relayedTransactionV2Builder";
import {Address} from "./address";
import {TransactionPayload} from "./transactionPayload";
import {assert} from "chai";

describe("test relayed v2 transaction", function () {
    let alice: TestWallet, bob: TestWallet;

    before(async function () {
        ({alice, bob} = await loadTestWallets());
    });

    it("should compute relayed v2 tx", async function () {
        this.timeout(20000);

        let networkConfig = {
            MinGasLimit: 50_000,
            GasPerDataByte: 1_500,
            GasPriceModifier: 0.01,
            ChainID: "T"
        };

        const builder = new RelayedTransactionV2Builder();
        const relayedTxV2 = await builder.buildRelayedTransactionV2(
            bob.signer,
            Address.fromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u"),
            15,
            new TransactionPayload("getContractConfig"),
            60_000_000,
            "T",
            networkConfig);
        await alice.signer.sign(relayedTxV2);

        assert.equal(
            relayedTxV2.getData().toString(),
            "relayedTxV2@000000000000000000010000000000000000000000000000000000000002ffff@0f@676574436f6e7472616374436f6e666967@b6c5262d9837853e2201de357c1cc4c9803988a42d7049d26b7785dd0ac2bd4c6a8804b6fd9cf845fe2c2a622774b1a2dbd0a417c9a0bc3f0563a85bd15e710a");
    });
});


