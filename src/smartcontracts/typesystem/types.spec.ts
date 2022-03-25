import * as errors from "../../errors";
import { assert } from "chai";
import { I64Type, NumericalValue, U16Type, U32Type, U32Value, U8Type } from "./numerical";
import { PrimitiveType, Type, NullType } from "./types";
import { BooleanType } from "./boolean";
import { AddressType } from "./address";
import { OptionType } from "./generic";
import { TypeExpressionParser } from "./typeExpressionParser";
import BigNumber from "bignumber.js";
import { BytesType, BytesValue} from "./bytes";
import { StringType } from "./string";

describe("test types", () => {
    let parser = new TypeExpressionParser();

    it("for numeric values, should throw error when invalid input", () => {
        assert.throw(() => new U32Value(new BigNumber(-42)), errors.ErrInvalidArgument);
        assert.throw(() => new NumericalValue(new U16Type(), <any>{ foobar: 42 }), errors.ErrInvalidArgument);
    });

    it("should be assignable from", () => {
        assert.isTrue((new Type("Type")).isAssignableFrom(new PrimitiveType("PrimitiveType")));
        assert.isTrue((new Type("Type")).isAssignableFrom(new BooleanType()));
        assert.isTrue((new Type("Type")).isAssignableFrom(new AddressType()));
        assert.isTrue((new Type("Type")).isAssignableFrom(new U32Type()));

        assert.isTrue((new PrimitiveType("PrimitiveType")).isAssignableFrom(new BooleanType()));
        assert.isTrue((new PrimitiveType("PrimitiveType")).isAssignableFrom(new AddressType()));
        assert.isTrue((new PrimitiveType("PrimitiveType")).isAssignableFrom(new U32Type()));

        assert.isTrue((new AddressType()).isAssignableFrom(new AddressType()));
        assert.isFalse((new AddressType()).isAssignableFrom(new BooleanType()));
        assert.isFalse((new U32Type()).isAssignableFrom(new BooleanType()));
        assert.isFalse((new U32Type()).isAssignableFrom(new PrimitiveType("PrimitiveType")));

        assert.isTrue(new BytesType().isAssignableFrom(new BytesType()));
        assert.isTrue(new U32Type().isAssignableFrom(parser.parse("u32")));
        assert.isTrue(new Type("u32").isAssignableFrom(new U32Type()));
        assert.isTrue(new OptionType(new U32Type()).isAssignableFrom(new OptionType(new NullType())));
    });

    it("should report equality", () => {
        assert.isFalse(new Type("foo").equals(new Type("bar")));
        assert.isTrue(new Type("foo").equals(new Type("foo")));
        assert.isTrue(new U32Type().equals(new U32Type()));
        assert.isFalse(new U32Type().equals(new I64Type()));

        assert.isTrue(parser.parse("MultiResultVec<u32>").equals(parser.parse("MultiResultVec<u32>")));
        assert.isFalse(parser.parse("MultiResultVec<u32>").equals(parser.parse("MultiResultVec<u33>")));
        assert.isTrue(parser.parse("Option<u32>").equals(new OptionType(new U32Type())));
        assert.isTrue(parser.parse("utf-8 string").equals(new StringType()));
    });

    it("should get fully qualified name", () => {
        assert.equal(new Type("foo").getFullyQualifiedName(), "erdjs:types:foo");
        assert.equal(new U32Type().getFullyQualifiedName(), "erdjs:types:u32");
        assert.equal(parser.parse("MultiResultVec<u32>").getFullyQualifiedName(), "erdjs:types:MultiResultVec<erdjs:types:u32>");
        assert.equal(parser.parse("utf-8 string").getFullyQualifiedName(), "erdjs:types:utf-8 string");
        assert.equal(parser.parse("Option<u32>").getFullyQualifiedName(), "erdjs:types:Option<erdjs:types:u32>");
    });

    it("types and values should have correct JavaScript class hierarchy", () => {
        assert.deepEqual(new U32Type().getClassHierarchy(), ["Type", "PrimitiveType", "NumericalType", "U32Type"]);
        assert.deepEqual(new U32Value(42).getClassHierarchy(), ["TypedValue", "PrimitiveValue", "NumericalValue", "U32Value"]);

        assert.deepEqual(new BytesType().getClassHierarchy(), ["Type", "PrimitiveType", "BytesType"]);
        assert.deepEqual(new BytesValue(Buffer.from("foobar")).getClassHierarchy(), ["TypedValue", "PrimitiveValue", "BytesValue"]);
    });
});
