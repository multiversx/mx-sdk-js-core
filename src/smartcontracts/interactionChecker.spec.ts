import { assert } from "chai";
import { Address } from "../address";
import * as errors from "../errors";
import { loadAbiRegistry } from "../testutils";
import { TokenTransfer } from "../tokenTransfer";
import { SmartContractAbi } from "./abi";
import { Interaction } from "./interaction";
import { InteractionChecker } from "./interactionChecker";
import { SmartContract } from "./smartContract";
import { BigUIntType, BigUIntValue, OptionalType, OptionalValue, OptionValue, TokenIdentifierValue, U32Value } from "./typesystem";
import { BytesValue } from "./typesystem/bytes";

describe("integration tests: test checker within interactor", function () {
    let dummyAddress = new Address("erd1qqqqqqqqqqqqqpgqak8zt22wl2ph4tswtyc39namqx6ysa2sd8ss4xmlj3");
    let checker = new InteractionChecker();

    it("should detect errors for 'ultimate answer'", async function () {
        let abiRegistry = await loadAbiRegistry("src/testdata/answer.abi.json");
        let abi = new SmartContractAbi(abiRegistry, ["answer"]);
        let contract = new SmartContract({ address: dummyAddress, abi: abi });
        let endpoint = abi.getEndpoint("getUltimateAnswer");

        // Send value to non-payable
        assert.throw(() => {
            let interaction = (<Interaction>contract.methods.getUltimateAnswer()).withValue(TokenTransfer.egldFromAmount(1));
            checker.checkInteraction(interaction, endpoint);
        }, errors.ErrContractInteraction, "cannot send EGLD value to non-payable");

        // Bad arguments
        assert.throw(() => {
            contract.methods.getUltimateAnswer(["abba"]);
        }, Error, "Wrong number of arguments for endpoint getUltimateAnswer: expected between 0 and 0 arguments, have 1");
    });

    it("should detect errors for 'lottery'", async function () {
        let abiRegistry = await loadAbiRegistry("src/testdata/lottery-esdt.abi.json");
        let abi = new SmartContractAbi(abiRegistry, ["Lottery"]);
        let contract = new SmartContract({ address: dummyAddress, abi: abi });
        let endpoint = abi.getEndpoint("start");

        // Bad number of arguments
        assert.throw(() => {
            contract.methods.start([
                "lucky",
                TokenTransfer.egldFromAmount(1)
            ]);
        }, Error, "Wrong number of arguments for endpoint start: expected between 8 and 9 arguments, have 2");

        // Bad types (U64 instead of U32)
        assert.throw(() => {
            let interaction = contract.methodsExplicit.start([
                BytesValue.fromUTF8("lucky"),
                new TokenIdentifierValue("lucky-token"),
                new BigUIntValue(1),
                OptionValue.newMissing(),
                OptionValue.newProvided(new U32Value(1)),
                OptionValue.newProvided(new U32Value(1)),
                OptionValue.newMissing(),
                OptionValue.newMissing(),
                new OptionalValue(new OptionalType(new BigUIntType()))
            ]);
            checker.checkInteraction(interaction, endpoint);
        }, errors.ErrContractInteraction, "type mismatch at index 4, expected: Option<u64>, got: Option<u32>");
    });
});
