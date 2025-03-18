import { assert } from "chai";
import { ErrTypingSystem } from "../../core";
import { TypeExpressionParser } from "./typeExpressionParser";
import { Type } from "./types";

describe("test parser", () => {
    let parser = new TypeExpressionParser();

    it("should parse expression", () => {
        let type: Type;

        type = parser.parse("u32");
        assert.deepEqual(type.toJSON(), {
            name: "u32",
            typeParameters: [],
        });

        type = parser.parse("List<u32>");
        assert.deepEqual(type.toJSON(), {
            name: "List",
            typeParameters: [
                {
                    name: "u32",
                    typeParameters: [],
                },
            ],
        });

        type = parser.parse("Option<List<Address>>");
        assert.deepEqual(type.toJSON(), {
            name: "Option",
            typeParameters: [
                {
                    name: "List",
                    typeParameters: [
                        {
                            name: "Address",
                            typeParameters: [],
                        },
                    ],
                },
            ],
        });

        type = parser.parse("VarArgs<MultiArg<bytes, Address>>");
        assert.deepEqual(type.toJSON(), {
            name: "VarArgs",
            typeParameters: [
                {
                    name: "MultiArg",
                    typeParameters: [
                        {
                            name: "bytes",
                            typeParameters: [],
                        },
                        {
                            name: "Address",
                            typeParameters: [],
                        },
                    ],
                },
            ],
        });

        type = parser.parse("MultiResultVec<MultiResult<Address, u64>>");
        assert.deepEqual(type.toJSON(), {
            name: "MultiResultVec",
            typeParameters: [
                {
                    name: "MultiResult",
                    typeParameters: [
                        {
                            name: "Address",
                            typeParameters: [],
                        },
                        {
                            name: "u64",
                            typeParameters: [],
                        },
                    ],
                },
            ],
        });

        type = parser.parse("MultiResultVec<MultiResult<i32,bytes,>>");
        assert.deepEqual(type.toJSON(), {
            name: "MultiResultVec",
            typeParameters: [
                {
                    name: "MultiResult",
                    typeParameters: [
                        {
                            name: "i32",
                            typeParameters: [],
                        },
                        {
                            name: "bytes",
                            typeParameters: [],
                        },
                    ],
                },
            ],
        });

        type = parser.parse("MultiArg<Option<u8>, List<u16>>");
        assert.deepEqual(type.toJSON(), {
            name: "MultiArg",
            typeParameters: [
                {
                    name: "Option",
                    typeParameters: [
                        {
                            name: "u8",
                            typeParameters: [],
                        },
                    ],
                },
                {
                    name: "List",
                    typeParameters: [
                        {
                            name: "u16",
                            typeParameters: [],
                        },
                    ],
                },
            ],
        });

        type = parser.parse("variadic<multi<array32,u32,array64>>");
        assert.deepEqual(type.toJSON(), {
            name: "variadic",
            typeParameters: [
                {
                    name: "multi",
                    typeParameters: [
                        {
                            name: "array32",
                            typeParameters: [],
                        },
                        {
                            name: "u32",
                            typeParameters: [],
                        },
                        {
                            name: "array64",
                            typeParameters: [],
                        },
                    ],
                },
            ],
        });
    });

    it("should parse expression: tuples", () => {
        let type: Type;

        type = parser.parse("tuple2<i32, bytes>");
        assert.deepEqual(type.toJSON(), {
            name: "tuple2",
            typeParameters: [
                {
                    name: "i32",
                    typeParameters: [],
                },
                {
                    name: "bytes",
                    typeParameters: [],
                },
            ],
        });

        type = parser.parse("tuple3<i32, bytes, Option<i64>>");
        assert.deepEqual(type.toJSON(), {
            name: "tuple3",
            typeParameters: [
                {
                    name: "i32",
                    typeParameters: [],
                },
                {
                    name: "bytes",
                    typeParameters: [],
                },
                {
                    name: "Option",
                    typeParameters: [
                        {
                            name: "i64",
                            typeParameters: [],
                        },
                    ],
                },
            ],
        });

        type = parser.parse("tuple2<i32, i32>");
        assert.deepEqual(type.toJSON(), {
            name: "tuple2",
            typeParameters: [
                {
                    name: "i32",
                    typeParameters: [],
                },
                {
                    name: "i32",
                    typeParameters: [],
                },
            ],
        });

        type = parser.parse("tuple<List<u64>,List<u64>>");
        assert.deepEqual(type.toJSON(), {
            name: "tuple",
            typeParameters: [
                {
                    name: "List",
                    typeParameters: [
                        {
                            name: "u64",
                            typeParameters: [],
                        },
                    ],
                },
                {
                    name: "List",
                    typeParameters: [
                        {
                            name: "u64",
                            typeParameters: [],
                        },
                    ],
                },
            ],
        });
    });

    it("should parse <BigUint,BigUint,u64,BigUint>", () => {
        let type: Type;
        type = parser.parse("variadic<multi<BigUint,BigUint,u64,BigUint>>");
        assert.deepEqual(type.toJSON(), {
            name: "variadic",
            typeParameters: [
                {
                    name: "multi",
                    typeParameters: [
                        {
                            name: "BigUint",
                            typeParameters: [],
                        },
                        {
                            name: "BigUint",
                            typeParameters: [],
                        },
                        {
                            name: "u64",
                            typeParameters: [],
                        },
                        {
                            name: "BigUint",
                            typeParameters: [],
                        },
                    ],
                },
            ],
        });
    });

    it("should parse multi", () => {
        const type = parser.parse("multi<u8, utf-8 string, u8, utf-8 string, u8, utf-8 string>");

        assert.deepEqual(type.toJSON(), {
            name: "multi",
            typeParameters: [
                {
                    name: "u8",
                    typeParameters: [],
                },
                {
                    name: "utf-8 string",
                    typeParameters: [],
                },
                {
                    name: "u8",
                    typeParameters: [],
                },
                {
                    name: "utf-8 string",
                    typeParameters: [],
                },
                {
                    name: "u8",
                    typeParameters: [],
                },
                {
                    name: "utf-8 string",
                    typeParameters: [],
                },
            ],
        });
    });

    it("should handle utf-8 string types which contain spaces", () => {
        let type: Type;

        type = parser.parse("tuple3<utf-8 string, bytes, Option<utf-8 string>>");
        assert.deepEqual(type.toJSON(), {
            name: "tuple3",
            typeParameters: [
                {
                    name: "utf-8 string",
                    typeParameters: [],
                },
                {
                    name: "bytes",
                    typeParameters: [],
                },
                {
                    name: "Option",
                    typeParameters: [
                        {
                            name: "utf-8 string",
                            typeParameters: [],
                        },
                    ],
                },
            ],
        });
    });

    it("should not parse expression", () => {
        assert.throw(() => parser.parse("<>"), ErrTypingSystem);
        assert.throw(() => parser.parse("<"), ErrTypingSystem);
        assert.throw(() => parser.parse("MultiResultVec<MultiResult2<Address, u64>"), ErrTypingSystem);
        assert.throw(() => parser.parse("a, b"), ErrTypingSystem);
    });
});
