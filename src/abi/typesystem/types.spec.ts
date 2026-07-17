import BigNumber from "bignumber.js";
import { assert } from "chai";
import * as errors from "../../core/errors";
import { AddressType } from "./address";
import { BooleanType } from "./boolean";
import { BytesType, BytesValue } from "./bytes";
import { OptionType } from "./generic";
import { ManagedDecimalType } from "./managedDecimal";
import { ManagedDecimalSignedType } from "./managedDecimalSigned";
import {
    BigIntValue,
    BigUIntValue,
    I16Value,
    I32Value,
    I64Type,
    I64Value,
    I8Value,
    NumericalValue,
    U16Type,
    U16Value,
    U32Type,
    U32Value,
    U64Value,
    U8Value,
} from "./numerical";
import { StringType } from "./string";
import { TypeExpressionParser } from "./typeExpressionParser";
import { NullType, PrimitiveType, Type } from "./types";

describe("test types", () => {
    let parser = new TypeExpressionParser();

    it("for numeric values, should throw error when invalid input", () => {
        assert.throw(() => new U32Value(new BigNumber(-42)), errors.ErrInvalidArgument);
        assert.throw(() => new NumericalValue(new U16Type(), <any>{ foobar: 42 }), errors.ErrInvalidArgument);
    });

    it("should enforce fixed-size numerical boundaries", () => {
        const cases: Array<{
            create: (value: BigNumber.Value | bigint) => NumericalValue;
            minimum: string;
            maximum: string;
            belowMinimum: string;
            aboveMaximum: string;
        }> = [
            {
                create: (value) => new U8Value(value),
                minimum: "0",
                maximum: "255",
                belowMinimum: "-1",
                aboveMaximum: "256",
            },
            {
                create: (value) => new I8Value(value),
                minimum: "-128",
                maximum: "127",
                belowMinimum: "-129",
                aboveMaximum: "128",
            },
            {
                create: (value) => new U16Value(value),
                minimum: "0",
                maximum: "65535",
                belowMinimum: "-1",
                aboveMaximum: "65536",
            },
            {
                create: (value) => new I16Value(value),
                minimum: "-32768",
                maximum: "32767",
                belowMinimum: "-32769",
                aboveMaximum: "32768",
            },
            {
                create: (value) => new U32Value(value),
                minimum: "0",
                maximum: "4294967295",
                belowMinimum: "-1",
                aboveMaximum: "4294967296",
            },
            {
                create: (value) => new I32Value(value),
                minimum: "-2147483648",
                maximum: "2147483647",
                belowMinimum: "-2147483649",
                aboveMaximum: "2147483648",
            },
            {
                create: (value) => new U64Value(value),
                minimum: "0",
                maximum: "18446744073709551615",
                belowMinimum: "-1",
                aboveMaximum: "18446744073709551616",
            },
            {
                create: (value) => new I64Value(value),
                minimum: "-9223372036854775808",
                maximum: "9223372036854775807",
                belowMinimum: "-9223372036854775809",
                aboveMaximum: "9223372036854775808",
            },
        ];

        for (const testCase of cases) {
            assert.doesNotThrow(() => testCase.create(testCase.minimum));
            assert.doesNotThrow(() => testCase.create(testCase.maximum));
            assert.throws(() => testCase.create(testCase.belowMinimum), errors.ErrInvalidArgument);
            assert.throws(() => testCase.create(testCase.aboveMaximum), errors.ErrInvalidArgument);
        }
    });

    it("should only accept finite integers for arbitrary-size numerical values", () => {
        assert.doesNotThrow(() => new BigUIntValue("1e100"));
        assert.doesNotThrow(() => new BigIntValue("-1e100"));

        assert.throws(() => new BigUIntValue("1.5"), errors.ErrInvalidArgument);
        assert.throws(() => new BigIntValue("-1.5"), errors.ErrInvalidArgument);
        assert.throws(() => new BigUIntValue(NaN), errors.ErrInvalidArgument);
        assert.throws(() => new BigUIntValue(Infinity), errors.ErrInvalidArgument);
        assert.throws(() => new BigIntValue(-Infinity), errors.ErrInvalidArgument);
    });

    it("should reject unsafe JavaScript integer inputs", () => {
        const unsafeNumber = Number.MAX_SAFE_INTEGER + 1;

        assert.throws(() => new U64Value(unsafeNumber), errors.ErrInvalidArgument);
        assert.doesNotThrow(() => new U64Value(unsafeNumber.toString()));
        assert.doesNotThrow(() => new U64Value(9007199254740992n));
    });

    it("should be assignable from", () => {
        assert.isTrue(new Type("Type").isAssignableFrom(new PrimitiveType("PrimitiveType")));
        assert.isTrue(new Type("Type").isAssignableFrom(new BooleanType()));
        assert.isTrue(new Type("Type").isAssignableFrom(new AddressType()));
        assert.isTrue(new Type("Type").isAssignableFrom(new U32Type()));

        assert.isTrue(new PrimitiveType("PrimitiveType").isAssignableFrom(new BooleanType()));
        assert.isTrue(new PrimitiveType("PrimitiveType").isAssignableFrom(new AddressType()));
        assert.isTrue(new PrimitiveType("PrimitiveType").isAssignableFrom(new U32Type()));

        assert.isTrue(new AddressType().isAssignableFrom(new AddressType()));
        assert.isFalse(new AddressType().isAssignableFrom(new BooleanType()));
        assert.isFalse(new U32Type().isAssignableFrom(new BooleanType()));
        assert.isFalse(new U32Type().isAssignableFrom(new PrimitiveType("PrimitiveType")));

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
        assert.equal(new Type("foo").getFullyQualifiedName(), "multiversx:types:foo");
        assert.equal(new U32Type().getFullyQualifiedName(), "multiversx:types:u32");
        assert.equal(
            parser.parse("MultiResultVec<u32>").getFullyQualifiedName(),
            "multiversx:types:MultiResultVec<multiversx:types:u32>",
        );
        assert.equal(parser.parse("utf-8 string").getFullyQualifiedName(), "multiversx:types:utf-8 string");
        assert.equal(
            parser.parse("Option<u32>").getFullyQualifiedName(),
            "multiversx:types:Option<multiversx:types:u32>",
        );
        assert.equal(new ManagedDecimalType(8).getFullyQualifiedName(), "multiversx:types:ManagedDecimal*8*");
        assert.equal(new ManagedDecimalType("usize").getFullyQualifiedName(), "multiversx:types:ManagedDecimal*usize*");
        assert.equal(
            new ManagedDecimalSignedType(8).getFullyQualifiedName(),
            "multiversx:types:ManagedDecimalSigned*8*",
        );
        assert.equal(
            new ManagedDecimalSignedType("usize").getFullyQualifiedName(),
            "multiversx:types:ManagedDecimalSigned*usize*",
        );
    });

    it("types and values should have correct JavaScript class hierarchy", () => {
        assert.deepEqual(new U32Type().getClassHierarchy(), ["Type", "PrimitiveType", "NumericalType", "U32Type"]);
        assert.deepEqual(new U32Value(42).getClassHierarchy(), [
            "TypedValue",
            "PrimitiveValue",
            "NumericalValue",
            "U32Value",
        ]);

        assert.deepEqual(new BytesType().getClassHierarchy(), ["Type", "PrimitiveType", "BytesType"]);
        assert.deepEqual(new BytesValue(Buffer.from("foobar")).getClassHierarchy(), [
            "TypedValue",
            "PrimitiveValue",
            "BytesValue",
        ]);
    });

    it("should report type dependencies", () => {
        assert.deepEqual(parser.parse("MultiResultVec<u32>").getNamesOfDependencies(), ["u32"]);
        assert.deepEqual(parser.parse("tuple2<Address,BigUint>").getNamesOfDependencies(), ["Address", "BigUint"]);
        assert.deepEqual(parser.parse("Option<FooBar>").getNamesOfDependencies(), ["FooBar"]);
    });
});
