import { assert } from "chai";
import { loadAbiRegistry } from "../../testutils";
import { BinaryCodec } from "../codec";
import { AddressType } from "./address";
import { OptionalType } from "./algebraic";
import { BytesType } from "./bytes";
import { EnumType } from "./enum";
import { ListType, OptionType } from "./generic";
import { BigUIntType, I64Type, U32Type, U64Type, U8Type } from "./numerical";
import { StructType } from "./struct";
import { TokenIdentifierType } from "./tokenIdentifier";

describe("test abi registry", () => {
    it("load should also remap known to types", async () => {
        // Ultimate answer
        let registry = await loadAbiRegistry("src/testdata/answer.abi.json");
        let answer = registry.getInterface("answer");
        let getUltimateAnswer = answer.getEndpoint("getUltimateAnswer");
        assert.instanceOf(getUltimateAnswer.output[0].type, I64Type);

        // Counter
        registry = await loadAbiRegistry("src/testdata/counter.abi.json");
        let counter = registry.getInterface("counter");
        let getCounter = counter.getEndpoint("get");
        assert.instanceOf(getCounter.output[0].type, I64Type);

        // Lottery
        registry = await loadAbiRegistry("src/testdata/lottery-esdt.abi.json");
        let lottery = registry.getInterface("Lottery");
        let start = lottery.getEndpoint("start");
        let getStatus = lottery.getEndpoint("status");
        let getLotteryInfo = lottery.getEndpoint("getLotteryInfo");

        assert.isFalse(start.modifiers.isReadonly());
        assert.isTrue(getStatus.modifiers.isReadonly());
        assert.isTrue(getLotteryInfo.modifiers.isReadonly());
        assert.instanceOf(start.input[0].type, BytesType);
        assert.instanceOf(start.input[1].type, TokenIdentifierType);
        assert.instanceOf(start.input[2].type, BigUIntType);
        assert.instanceOf(start.input[3].type, OptionType);
        assert.instanceOf(start.input[3].type.getFirstTypeParameter(), U32Type);
        assert.instanceOf(start.input[4].type, OptionType);
        assert.instanceOf(start.input[4].type.getFirstTypeParameter(), U64Type);
        assert.instanceOf(start.input[5].type, OptionType);
        assert.instanceOf(start.input[5].type.getFirstTypeParameter(), U32Type);
        assert.instanceOf(start.input[6].type, OptionType);
        assert.instanceOf(start.input[6].type.getFirstTypeParameter(), BytesType);
        assert.instanceOf(start.input[7].type.getFirstTypeParameter(), ListType);
        assert.instanceOf(start.input[7].type.getFirstTypeParameter().getFirstTypeParameter(), AddressType);
        assert.instanceOf(start.input[8].type, OptionalType);
        assert.instanceOf(start.input[8].type.getFirstTypeParameter(), BigUIntType);
        assert.instanceOf(getStatus.input[0].type, BytesType);
        assert.instanceOf(getStatus.output[0].type, EnumType);
        assert.equal(getStatus.output[0].type.getName(), "Status");
        assert.instanceOf(getLotteryInfo.input[0].type, BytesType);
        assert.instanceOf(getLotteryInfo.output[0].type, StructType);
        assert.equal(getLotteryInfo.output[0].type.getName(), "LotteryInfo");

        let fieldDefinitions = (<StructType>getLotteryInfo.output[0].type).getFieldsDefinitions();
        assert.instanceOf(fieldDefinitions[0].type, TokenIdentifierType);
        assert.instanceOf(fieldDefinitions[5].type, BytesType);
    });

    it("binary codec correctly decodes perform action result", async () => {
        let bc = new BinaryCodec();
        let buff = Buffer.from(
            "0588c738a5d26c0e3a2b4f9e8110b540ee9c0b71a3be057569a5a7b0fcb482c8f70000000806f05b59d3b200000000000b68656c6c6f20776f726c6400000000",
            "hex"
        );

        let registry = await loadAbiRegistry("src/testdata/multisig.abi.json");
        let multisig = registry.getInterface("Multisig");
        let performAction = multisig.getEndpoint("getActionData");
        assert.equal(performAction.output[0].type.getName(), "Action");

        let result = bc.decodeTopLevel(buff, performAction.output[0].type);
        assert.deepEqual(
            JSON.stringify(result.valueOf()),
            `{"name":"SendTransferExecute","fields":[{"to":{"bech32":"erd13rrn3fwjds8r5260n6q3pd2qa6wqkudrhczh26d957c0edyzermshds0k8","pubkey":"88c738a5d26c0e3a2b4f9e8110b540ee9c0b71a3be057569a5a7b0fcb482c8f7"},"egld_amount":"500000000000000000","endpoint_name":{"type":"Buffer","data":[104,101,108,108,111,32,119,111,114,108,100]},"arguments":[]}]}`
        );
        assert.equal(result.valueOf().name, "SendTransferExecute");
    });
});
