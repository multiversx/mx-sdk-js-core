import { assert } from "chai";
import { extendAbiRegistry, loadAbiRegistry } from "../../testutils";
import { AbiRegistry } from "./abiRegistry";
import { AddressType } from "./address";
import { BytesType } from "./bytes";
import { EnumType } from "./enum";
import { ListType, OptionType } from "./generic";
import {BigUIntType, I64Type, U32Type, U8Type} from "./numerical";
import { StructType } from "./struct";
import {BinaryCodec} from "../codec";

describe("test abi registry", () => {
    it("should extend", async () => {
        let registry = new AbiRegistry();

        await extendAbiRegistry(registry, "src/testdata/answer.abi.json");
        assert.lengthOf(registry.interfaces, 1);
        assert.lengthOf(registry.customTypes, 0);
        assert.lengthOf(registry.getInterface("answer").endpoints, 1);

        await extendAbiRegistry(registry, "src/testdata/counter.abi.json");
        assert.lengthOf(registry.interfaces, 2);
        assert.lengthOf(registry.customTypes, 0);
        assert.lengthOf(registry.getInterface("counter").endpoints, 3);

        await extendAbiRegistry(registry, "src/testdata/lottery_egld.abi.json");
        assert.lengthOf(registry.interfaces, 3);
        assert.lengthOf(registry.customTypes, 2);

        assert.lengthOf(registry.getInterface("Lottery").endpoints, 6);
        assert.lengthOf(registry.getStruct("LotteryInfo").fields, 8);
        assert.lengthOf(registry.getEnum("Status").variants, 3);
    });

    it("load should also remap known to types", async () => {
        let registry = await loadAbiRegistry([
            "src/testdata/answer.abi.json",
            "src/testdata/counter.abi.json",
            "src/testdata/lottery_egld.abi.json"
        ]);

        // Ultimate answer
        let answer = registry.getInterface("answer");
        let getUltimateAnswer = answer.getEndpoint("getUltimateAnswer");
        assert.instanceOf(getUltimateAnswer.output[0].type, I64Type);

        // Counter
        let counter = registry.getInterface("counter");
        let getCounter = counter.getEndpoint("get");
        assert.instanceOf(getCounter.output[0].type, I64Type);

        // Lottery
        let lottery = registry.getInterface("Lottery");
        let start = lottery.getEndpoint("start");
        let getStatus = lottery.getEndpoint("status");
        let getLotteryInfo = lottery.getEndpoint("lotteryInfo");
        assert.instanceOf(start.input[0].type, BytesType);
        assert.instanceOf(start.input[1].type, BigUIntType);
        assert.instanceOf(start.input[2].type, OptionType);
        assert.instanceOf(start.input[2].type.getFirstTypeParameter(), U32Type);
        assert.instanceOf(start.input[6].type.getFirstTypeParameter(), ListType);
        assert.instanceOf(start.input[6].type.getFirstTypeParameter().getFirstTypeParameter(), AddressType);
        assert.instanceOf(getStatus.input[0].type, BytesType);
        assert.instanceOf(getStatus.output[0].type, EnumType);
        assert.equal(getStatus.output[0].type.getName(), "Status");
        assert.instanceOf(getLotteryInfo.input[0].type, BytesType);
        assert.instanceOf(getLotteryInfo.output[0].type, StructType);
        assert.equal(getLotteryInfo.output[0].type.getName(), "LotteryInfo");
        assert.instanceOf((<StructType>getLotteryInfo.output[0].type).fields[0].type, BigUIntType);
        assert.instanceOf((<StructType>getLotteryInfo.output[0].type).fields[5].type, ListType);
        assert.instanceOf((<StructType>getLotteryInfo.output[0].type).fields[5].type.getFirstTypeParameter(), AddressType);
    });

    it("binary codec correctly decodes numerical top level", function() {
        let bc = new BinaryCodec();
        let buff = Buffer.from("0588c738a5d26c0e3a2b4f9e8110b540ee9c0b71a3be057569a5a7b0fcb482c8f70000000806f05b59d3b200000000000b68656c6c6f20776f726c6400000000", "hex");
        let res = bc.decodeTopLevel(buff, new U8Type());

        assert.equal(res.valueOf().toString(), "5");
    });
});
