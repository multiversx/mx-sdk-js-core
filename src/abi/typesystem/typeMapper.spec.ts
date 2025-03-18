import { assert } from "chai";
import { AddressType } from "./address";
import { OptionalType } from "./algebraic";
import { BytesType } from "./bytes";
import { CompositeType } from "./composite";
import { ListType, OptionType } from "./generic";
import { ArrayVecType } from "./genericArray";
import { BigUIntType, I32Type, U16Type, U32Type, U64Type, U8Type } from "./numerical";
import { TokenIdentifierType } from "./tokenIdentifier";
import { TupleType } from "./tuple";
import { TypeExpressionParser } from "./typeExpressionParser";
import { TypeMapper } from "./typeMapper";
import { Type } from "./types";
import { VariadicType } from "./variadic";

describe("test mapper", () => {
    let parser = new TypeExpressionParser();
    let mapper = new TypeMapper();

    it("should map primitive types", () => {
        testMapping("u8", new U8Type());
        testMapping("u16", new U16Type());
        testMapping("u32", new U32Type());
        testMapping("u64", new U64Type());
        testMapping("BigUint", new BigUIntType());
        testMapping("TokenIdentifier", new TokenIdentifierType());
    });

    it("should map generic types", () => {
        testMapping("Option<u64>", new OptionType(new U64Type()));
        testMapping("List<u64>", new ListType(new U64Type()));
    });

    it("should map variadic types", () => {
        testMapping("VarArgs<u32>", new VariadicType(new U32Type()));
        testMapping("VarArgs<bytes>", new VariadicType(new BytesType()));
        testMapping("MultiResultVec<u32>", new VariadicType(new U32Type()));
        testMapping("MultiResultVec<Address>", new VariadicType(new AddressType()));
    });

    it("should map complex generic, composite, variadic types", () => {
        testMapping(
            "MultiResultVec<MultiResult<i32,bytes,>>",
            new VariadicType(new CompositeType(new I32Type(), new BytesType())),
        );
        testMapping(
            "VarArgs<MultiArg<i32,bytes,>>",
            new VariadicType(new CompositeType(new I32Type(), new BytesType())),
        );
        testMapping("OptionalResult<Address>", new OptionalType(new AddressType()));
    });

    it("should map tuples", () => {
        testMapping("tuple2<u32,bytes>", new TupleType(new U32Type(), new BytesType()));
        testMapping("tuple2<Address,BigUint>", new TupleType(new AddressType(), new BigUIntType()));
        testMapping("tuple3<u32, bytes, u64>", new TupleType(new U32Type(), new BytesType(), new U64Type()));
        //TODO: Rewrite serializer to map more complex objects

        // After improvement enable the following test
        // testMapping("tuple2<tuple3<u32, bytes, u64>, Address>", new TupleType(
        //     new TupleType(new Type("tuple3", [new U32Type(), new BytesType(), new U64Type()])),
        //     new AddressType(),
        // ));
    });

    it("should map arrays", () => {
        testArrayMapping("array2<BigUint>", 2, new BigUIntType());
        testArrayMapping("array2<u32>", 2, new U32Type());
        testArrayMapping("array6<u8>", 6, new U8Type());
        testArrayMapping("array8<BigUint>", 8, new BigUIntType());
        testArrayMapping("array48<u8>", 48, new U8Type());
        testArrayMapping("array256<BigUint>", 256, new BigUIntType());
    });

    function testArrayMapping(expression: string, size: number, typeParameter: Type) {
        let type = parser.parse(expression);
        let mappedType = mapper.mapType(type);

        assert.instanceOf(mappedType, ArrayVecType);
        assert.deepEqual(mappedType, new ArrayVecType(size, typeParameter));
    }

    function testMapping(expression: string, expectedType: Type) {
        let type = parser.parse(expression);
        let mappedType = mapper.mapType(type);

        assert.instanceOf(mappedType, expectedType.constructor);
        assert.deepEqual(mappedType, expectedType);
    }
});
