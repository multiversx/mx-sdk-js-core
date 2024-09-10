import { assert } from "chai";
import { loadAbiRegistry } from "../../testutils";
import { BinaryCodec } from "../codec";
import { AddressType } from "./address";
import { OptionalType } from "./algebraic";
import { BytesType } from "./bytes";
import { EnumType } from "./enum";
import { ListType, OptionType } from "./generic";
import { ArrayVecType } from "./genericArray";
import { BigUIntType, I64Type, U32Type, U64Type } from "./numerical";
import { StructType } from "./struct";
import { TokenIdentifierType } from "./tokenIdentifier";
import { VariadicType } from "./variadic";

describe("test abi registry", () => {
    it("load should also remap known to types", async () => {
        // Ultimate answer
        let registry = await loadAbiRegistry("src/testdata/answer.abi.json");
        let getUltimateAnswer = registry.getEndpoint("getUltimateAnswer");
        assert.instanceOf(getUltimateAnswer.output[0].type, I64Type);

        // Counter
        registry = await loadAbiRegistry("src/testdata/counter.abi.json");
        let getCounter = registry.getEndpoint("get");
        assert.instanceOf(getCounter.output[0].type, I64Type);

        // Lottery
        registry = await loadAbiRegistry("src/testdata/lottery-esdt.abi.json");
        let start = registry.getEndpoint("start");
        let getStatus = registry.getEndpoint("status");
        let getLotteryInfo = registry.getEndpoint("getLotteryInfo");

        // basic-features
        registry = await loadAbiRegistry("src/testdata/basic-features.abi.json");
        let returnManagedDecimal = registry.getEndpoint("returns_egld_decimal");
        let returnsManagedDecimalSigned = registry.getEndpoint("managed_decimal_ln");
        let returnsManagedDecimalVariable = registry.getEndpoint("managed_decimal_addition_var");

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
        assert.equal(returnManagedDecimal.output[0].type.getName(), "ManagedDecimal");
        assert.equal(returnsManagedDecimalSigned.output[0].type.getName(), "ManagedDecimalSigned");
        assert.equal(returnsManagedDecimalSigned.output[0].type.getMetadata(), "9");
        assert.equal(returnsManagedDecimalVariable.output[0].type.getName(), "ManagedDecimal");
        assert.equal(returnsManagedDecimalVariable.output[0].type.getMetadata(), "usize");

        let fieldDefinitions = (<StructType>getLotteryInfo.output[0].type).getFieldsDefinitions();
        assert.instanceOf(fieldDefinitions[0].type, TokenIdentifierType);
        assert.instanceOf(fieldDefinitions[5].type, BytesType);
    });

    it("binary codec correctly decodes perform action result", async () => {
        let bc = new BinaryCodec();
        let buff = Buffer.from(
            "0500000000000000000500d006f73c4221216fa679bc559005584c4f1160e569e1000000012a0000000003616464000000010000000107",
            "hex",
        );

        let registry = await loadAbiRegistry("src/testdata/multisig-full.abi.json");
        let performAction = registry.getEndpoint("getActionData");
        assert.equal(performAction.output[0].type.getName(), "Action");

        let result = bc.decodeTopLevel(buff, performAction.output[0].type);
        assert.deepEqual(
            JSON.stringify(result.valueOf()),
            `{"name":"SendTransferExecuteEgld","fields":[{"to":{"bech32":"erd1qqqqqqqqqqqqqpgq6qr0w0zzyysklfneh32eqp2cf383zc89d8sstnkl60","pubkey":"00000000000000000500d006f73c4221216fa679bc559005584c4f1160e569e1"},"egld_amount":"42","opt_gas_limit":null,"endpoint_name":{"type":"Buffer","data":[97,100,100]},"arguments":[{"type":"Buffer","data":[7]}]}]}`,
        );
        assert.equal(result.valueOf().name, "SendTransferExecuteEgld");
    });

    it("should load ABI containing arrayN and nested structs", async () => {
        let registry = await loadAbiRegistry("src/testdata/array-in-nested-structs.abi.json");
        let dummyType = registry.getStruct("Dummy");
        let fooType = registry.getStruct("Foo");
        let barType = registry.getStruct("Bar");
        let fooTypeFromBarType = <StructType>barType.getFieldDefinition("foo")!.type;
        let dummyTypeFromFooTypeFromBarType = <StructType>fooTypeFromBarType.getFieldDefinition("dummy")!.type;

        assert.equal(dummyType.getClassName(), StructType.ClassName);
        assert.equal(fooType.getClassName(), StructType.ClassName);
        assert.equal(barType.getClassName(), StructType.ClassName);
        assert.isTrue(fooType == fooTypeFromBarType);
        assert.isTrue(dummyType == dummyTypeFromFooTypeFromBarType);
        assert.equal(dummyType.getFieldDefinition("raw")!.type.getClassName(), ArrayVecType.ClassName);
    });

    it("should load ABI when custom types are out of order (a)", async () => {
        const registry = await loadAbiRegistry("src/testdata/custom-types-out-of-order-a.abi.json");

        assert.deepEqual(registry.getStruct("EsdtTokenTransfer").getNamesOfDependencies(), [
            "EsdtTokenType",
            "TokenIdentifier",
            "u64",
            "BigUint",
        ]);
        assert.deepEqual(registry.getEnum("EsdtTokenType").getNamesOfDependencies(), []);
        assert.deepEqual(registry.getStruct("TypeA").getNamesOfDependencies(), ["TypeB", "TypeC", "u64"]);
        assert.deepEqual(registry.getStruct("TypeB").getNamesOfDependencies(), ["TypeC", "u64"]);
        assert.deepEqual(registry.getStruct("TypeC").getNamesOfDependencies(), ["u64"]);
    });

    it("should load ABI when custom types are out of order (b)", async () => {
        const registry = await loadAbiRegistry("src/testdata/custom-types-out-of-order-b.abi.json");

        assert.deepEqual(registry.getStruct("EsdtTokenTransfer").getNamesOfDependencies(), [
            "EsdtTokenType",
            "TokenIdentifier",
            "u64",
            "BigUint",
        ]);
        assert.deepEqual(registry.getEnum("EsdtTokenType").getNamesOfDependencies(), []);
        assert.deepEqual(registry.getStruct("TypeA").getNamesOfDependencies(), ["TypeB", "TypeC", "u64"]);
        assert.deepEqual(registry.getStruct("TypeB").getNamesOfDependencies(), ["TypeC", "u64"]);
        assert.deepEqual(registry.getStruct("TypeC").getNamesOfDependencies(), ["u64"]);
    });

    it("should load ABI when custom types are out of order (community example: c)", async () => {
        const registry = await loadAbiRegistry("src/testdata/custom-types-out-of-order-c.abi.json");

        assert.lengthOf(registry.customTypes, 5);
        assert.deepEqual(registry.getStruct("LoanCreateOptions").getNamesOfDependencies(), [
            "BigUint",
            "Address",
            "TokenIdentifier",
            "Status",
            "bytes",
        ]);
    });

    it("should load ABI when custom types are out of order (community example: d)", async () => {
        const registry = await loadAbiRegistry("src/testdata/custom-types-out-of-order-d.abi.json");

        assert.lengthOf(registry.customTypes, 12);
        assert.deepEqual(registry.getStruct("AuctionItem").getNamesOfDependencies(), [
            "u64",
            "Address",
            "BigUint",
            "Option",
            "NftData",
            "bytes",
            "TokenIdentifier",
            "List",
        ]);
    });

    it("should load ABI with counted-variadic", async () => {
        const registry = await loadAbiRegistry("src/testdata/counted-variadic.abi.json");
        const dummyType = registry.getStruct("Dummy");

        assert.deepEqual(registry.getEndpoint("foo").input[0].type, new VariadicType(dummyType, true));
        assert.deepEqual(registry.getEndpoint("bar").input[0].type, new VariadicType(new U32Type(), true));
        assert.deepEqual(registry.getEndpoint("bar").input[1].type, new VariadicType(new BytesType(), true));
        assert.deepEqual(registry.getEndpoint("bar").output[0].type, new VariadicType(new U32Type(), true));
        assert.deepEqual(registry.getEndpoint("bar").output[1].type, new VariadicType(new BytesType(), true));
    });

    it("should load ABI wih events", async () => {
        const registry = await loadAbiRegistry("src/testdata/esdt-safe.abi.json");

        assert.lengthOf(registry.events, 8);

        const depositEvent = registry.getEvent("deposit");
        assert.deepEqual(depositEvent.inputs[0].type, new AddressType());
        assert.deepEqual(depositEvent.inputs[1].type, new ListType(registry.getCustomType("EsdtTokenPayment")));
        assert.deepEqual(depositEvent.inputs[2].type, registry.getCustomType("DepositEvent"));

        const setStatusEvent = registry.getEvent("setStatusEvent");
        assert.deepEqual(setStatusEvent.inputs[0].type, new U64Type());
        assert.deepEqual(setStatusEvent.inputs[1].type, new U64Type());
        assert.deepEqual(setStatusEvent.inputs[2].type, registry.getCustomType("TransactionStatus"));
    });

    it("should load ABI explicit-enum", async () => {
        const registry = await loadAbiRegistry("src/testdata/explicit-enum.abi.json");

        const enumType = registry.getEnum("OperationCompletionStatus");

        assert.deepEqual(enumType.variants[0].name, "completed");
        assert.deepEqual(enumType.variants[0].discriminant, 0);

        assert.deepEqual(enumType.variants[1].name, "interrupted");
        assert.deepEqual(enumType.variants[1].discriminant, 1);
    });
});
