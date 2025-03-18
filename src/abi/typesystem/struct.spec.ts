import { assert } from "chai";
import * as errors from "../../core/errors";
import { BytesType, BytesValue } from "./bytes";
import { Field, FieldDefinition } from "./fields";
import { BigUIntType, BigUIntValue, U32Type, U32Value } from "./numerical";
import { Struct, StructType } from "./struct";
import { TokenIdentifierType, TokenIdentifierValue } from "./tokenIdentifier";

describe("test structs", () => {
    it("should get fields", () => {
        let fooType = new StructType("Foo", [
            new FieldDefinition("a", "", new TokenIdentifierType()),
            new FieldDefinition("b", "", new BigUIntType()),
            new FieldDefinition("c", "", new U32Type()),
            new FieldDefinition("d", "", new BytesType()),
        ]);

        let fooStruct = new Struct(fooType, [
            new Field(new TokenIdentifierValue("lucky-token"), "a"),
            new Field(new BigUIntValue(1), "b"),
            new Field(new U32Value(42), "c"),
            new Field(new BytesValue(Buffer.from([0x64])), "d"),
        ]);

        assert.lengthOf(fooStruct.getFields(), 4);
        assert.deepEqual(fooStruct.getFieldValue("a"), "lucky-token");
        assert.deepEqual(fooStruct.getFieldValue("b").toNumber(), 1);
        assert.deepEqual(fooStruct.getFieldValue("c").toNumber(), 42);
        assert.deepEqual(fooStruct.getFieldValue("d"), Buffer.from([0x64]));
        assert.throw(() => fooStruct.getFieldValue("e"), errors.ErrMissingFieldOnStruct);
    });
});
