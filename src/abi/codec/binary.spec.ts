import BigNumber from "bignumber.js";
import { assert } from "chai";
import { Address } from "../../core/address";
import * as errors from "../../core/errors";
import {
    AddressType,
    AddressValue,
    ArrayVec,
    ArrayVecType,
    BigIntType,
    BigIntValue,
    BigUIntType,
    BigUIntValue,
    BooleanType,
    BooleanValue,
    BytesType,
    BytesValue,
    EnumType,
    EnumValue,
    EnumVariantDefinition,
    ExplicitEnumType,
    ExplicitEnumValue,
    ExplicitEnumVariantDefinition,
    Field,
    FieldDefinition,
    I16Type,
    I16Value,
    I32Type,
    I32Value,
    I64Type,
    I64Value,
    I8Type,
    I8Value,
    List,
    ListType,
    NumericalType,
    NumericalValue,
    StringType,
    StringValue,
    Struct,
    StructType,
    TokenIdentifierType,
    TokenIdentifierValue,
    TypedValue,
    U16Type,
    U16Value,
    U32Type,
    U32Value,
    U64Type,
    U64Value,
    U8Type,
    U8Value,
} from "../typesystem";
import { BinaryCodec, BinaryCodecConstraints } from "./binary";
import { isMsbOne } from "./utils";

describe("test binary codec (basic)", () => {
    let codec = new BinaryCodec();

    it("should create boolean values, encode and decode", async () => {
        checkBoolean(true, [0x01], [0x01]);
        checkBoolean(false, [0x00], []);

        function checkBoolean(asBoolean: boolean, nested: number[], topLevel: number[]) {
            let value = new BooleanValue(asBoolean);
            let type = new BooleanType();

            assert.deepEqual(codec.encodeNested(value), Buffer.from(nested));
            assert.deepEqual(codec.encodeTopLevel(value), Buffer.from(topLevel));

            let [decodedNested, nestedLength] = codec.decodeNested<BooleanValue>(Buffer.from(nested), type);
            assert.instanceOf(decodedNested, BooleanValue);
            assert.isTrue(decodedNested.equals(value));
            assert.equal(nestedLength, 1);

            let decodedTop = codec.decodeTopLevel<BooleanValue>(Buffer.from(topLevel), type);
            assert.instanceOf(decodedTop, BooleanValue);
            assert.isTrue(decodedTop.equals(value));
        }
    });

    it("should create numeric values, encode and decode", async () => {
        // Small int

        checkNumerical(BigInt(42), new U8Type(), [0x2a], [0x2a]);
        checkNumerical(BigInt(42), new U16Type(), [0x00, 0x2a], [0x2a]);
        checkNumerical(BigInt(42), new U64Type(), [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x2a], [0x2a]);
        checkNumerical(BigInt(-10), new I8Type(), [0xf6], [0xf6]);
        checkNumerical(BigInt(-10), new I16Type(), [0xff, 0xf6], [0xf6]);

        // BigInt

        checkNumerical(BigInt(0), new BigIntType(), [0, 0, 0, 0], []);
        checkNumerical(BigInt(1), new BigIntType(), [0, 0, 0, 1, 0x01], [0x01]);
        checkNumerical(BigInt(-1), new BigIntType(), [0, 0, 0, 1, 0xff], [0xff]);
        checkNumerical(BigInt(-2), new BigIntType(), [0, 0, 0, 1, 0xfe], [0xfe]);
        checkNumerical(BigInt(127), new BigIntType(), [0, 0, 0, 1, 0x7f], [0x7f]);
        checkNumerical(BigInt(128), new BigIntType(), [0, 0, 0, 2, 0x00, 0x80], [0x00, 0x80]);
        checkNumerical(BigInt(255), new BigIntType(), [0, 0, 0, 2, 0x00, 0xff], [0x00, 0xff]);
        checkNumerical(BigInt(256), new BigIntType(), [0, 0, 0, 2, 0x01, 0x00], [0x01, 0x00]);
        checkNumerical(BigInt(-255), new BigIntType(), [0, 0, 0, 2, 0xff, 0x01], [0xff, 0x01]);
        checkNumerical(BigInt(-257), new BigIntType(), [0, 0, 0, 2, 0xfe, 0xff], [0xfe, 0xff]);

        // Zero, fixed-size

        [
            new U8Type(),
            new I8Type(),
            new U16Type(),
            new I16Type(),
            new U32Type(),
            new I32Type(),
            new U64Type(),
            new I64Type(),
        ].forEach((type) => {
            checkNumerical(BigInt(0), type, Array(type.sizeInBytes!).fill(0), []);
        });

        // Zero, arbitrary-size (big)

        [new BigIntType(), new BigUIntType()].forEach((type) => {
            checkNumerical(BigInt(0), type, [0, 0, 0, 0], []);
        });

        function checkNumerical(asBigInt: bigint, type: NumericalType, nested: number[], topLevel: number[]) {
            let value = new NumericalValue(type, new BigNumber(asBigInt.toString(10)));

            assert.deepEqual(codec.encodeNested(value), Buffer.from(nested));
            assert.deepEqual(codec.encodeTopLevel(value), Buffer.from(topLevel));

            let [decodedNested, nestedLength] = codec.decodeNested<NumericalValue>(Buffer.from(nested), type);
            assert.instanceOf(decodedNested, NumericalValue);
            assert.isTrue(decodedNested.equals(value));
            assert.equal(nestedLength, nested.length);

            let decodedTop = codec.decodeTopLevel<NumericalValue>(Buffer.from(topLevel), type);
            assert.instanceOf(decodedTop, NumericalValue);
            assert.isTrue(decodedTop.equals(value));
        }
    });

    it("should create numeric values, from both bigint and BigNumber.Value", async () => {
        assert.deepEqual(new BigUIntValue("0xabcdefabcdefabcdef"), new BigUIntValue(BigInt("0xabcdefabcdefabcdef")));
        assert.deepEqual(new U64Value("0xabcdef"), new U64Value(BigInt(0xabcdef)));
        assert.deepEqual(new U32Value("0xabcdef"), new U32Value(BigInt(0xabcdef)));
        assert.deepEqual(new U16Value("0xabcdef"), new U16Value(BigInt(0xabcdef)));
        assert.deepEqual(new U8Value("0xabcdef"), new U8Value(BigInt(0xabcdef)));

        assert.deepEqual(
            new BigIntValue(BigInt("0xabcdefabcdefabcdef")),
            new BigIntValue(BigInt("0xabcdefabcdefabcdef")),
        );
        assert.deepEqual(new I64Value("0xabcdef"), new I64Value(BigInt(0xabcdef)));
        assert.deepEqual(new I32Value("0xabcdef"), new I32Value(BigInt(0xabcdef)));
        assert.deepEqual(new I16Value("0xabcdef"), new I16Value(BigInt(0xabcdef)));
        assert.deepEqual(new I8Value("0xabcdef"), new I8Value(BigInt(0xabcdef)));
    });

    it("should create bytes and strings, encode and decode", async () => {
        let bytesValue = BytesValue.fromHex("74657374");
        let stringValue = StringValue.fromHex("74657374");

        let length = [0x00, 0x00, 0x00, 0x04];
        let payload = [0x74, 0x65, 0x73, 0x74];

        assert.deepEqual(codec.encodeNested(bytesValue), Buffer.from([...length, ...payload]));
        assert.deepEqual(codec.encodeTopLevel(bytesValue), Buffer.from(payload));
        assert.deepEqual(codec.decodeNested<BytesValue>(Buffer.from([...length, ...payload]), new BytesType()), [
            bytesValue,
            8,
        ]);
        assert.deepEqual(codec.decodeTopLevel<BytesValue>(Buffer.from(payload), new BytesType()), bytesValue);

        assert.deepEqual(codec.encodeNested(stringValue), Buffer.from([...length, ...payload]));
        assert.deepEqual(codec.encodeTopLevel(stringValue), Buffer.from(payload));
        assert.deepEqual(codec.decodeNested<StringValue>(Buffer.from([...length, ...payload]), new StringType()), [
            stringValue,
            8,
        ]);
        assert.deepEqual(codec.decodeTopLevel<StringValue>(Buffer.from(payload), new StringType()), stringValue);
    });

    it("should create explicit-enums, encode and decode", async () => {
        let length = [0x00, 0x00, 0x00, 0x04];
        let payload = [0x74, 0x65, 0x73, 0x74];
        let enumType = new ExplicitEnumType("Colour", [new ExplicitEnumVariantDefinition("test")]);
        let enumValue = ExplicitEnumValue.fromName(enumType, "test");

        assert.deepEqual(codec.encodeNested(enumValue), Buffer.from([...length, ...payload]));
        assert.deepEqual(codec.encodeTopLevel(enumValue), Buffer.from(payload));
        assert.deepEqual(codec.decodeNested<ExplicitEnumValue>(Buffer.from([...length, ...payload]), enumType), [
            enumValue,
            8,
        ]);
        assert.deepEqual(codec.decodeTopLevel<ExplicitEnumValue>(Buffer.from(payload), enumType), enumValue);
    });
});

describe("test binary codec (advanced)", () => {
    it("should encode / decode lists", async () => {
        let codec = new BinaryCodec();
        let list = new List(new ListType(new AddressType()), [
            new AddressValue(new Address("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th")),
            new AddressValue(new Address("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx")),
            new AddressValue(new Address("erd1k2s324ww2g0yj38qn2ch2jwctdy8mnfxep94q9arncc6xecg3xaq6mjse8")),
        ]);

        let bufferNested = codec.encodeNested(list);
        let bufferTopLevel = codec.encodeTopLevel(list);
        assert.equal(bufferNested.length, 4 + list.getLength() * 32);
        assert.equal(bufferTopLevel.length, list.getLength() * 32);

        let [decodedNested, decodedNestedLength] = codec.decodeNested<List>(
            bufferNested,
            new ListType(new AddressType()),
        );
        let decodedTopLevel = codec.decodeTopLevel<List>(bufferTopLevel, new ListType(new AddressType()));
        assert.equal(decodedNestedLength, bufferNested.length);
        assert.equal(decodedNested.getLength(), 3);
        assert.equal(decodedTopLevel.getLength(), 3);

        assert.deepEqual(decodedNested, list);
        assert.deepEqual(decodedTopLevel, list);
    });

    it("should fail with large lists using default constraints", async () => {
        let numItems = 2 ** 17;
        let codec = new BinaryCodec();

        let items: TypedValue[] = [];

        for (let i = 0; i < numItems; i++) {
            items.push(new U32Value(i));
        }

        let list = new List(new ListType(new U32Type()), items);

        assert.throws(
            () => {
                codec.encodeNested(list);
            },
            errors.ErrCodec,
            `List too large: ${numItems} > ${codec.constraints.maxListLength}`,
        );

        assert.throws(
            () => {
                codec.encodeTopLevel(list);
            },
            errors.ErrCodec,
            `List too large: ${numItems} > ${codec.constraints.maxListLength}`,
        );
    });

    it("benchmark: should work well with large lists", async function () {
        let numItems = 2 ** 12;
        let codec = new BinaryCodec(
            new BinaryCodecConstraints({
                maxListLength: numItems,
                maxBufferLength: numItems * 4 + 4,
            }),
        );

        let items: TypedValue[] = [];

        for (let i = 0; i < numItems; i++) {
            items.push(new U32Value(i));
        }

        let list = new List(new ListType(new U32Type()), items);

        console.time("encoding");
        let buffer = codec.encodeNested(list);
        console.timeEnd("encoding");
        assert.equal(buffer.length, 4 + numItems * 4);

        console.time("decoding");
        let [decodedList, decodedLength] = codec.decodeNested<List>(buffer, new ListType(new U32Type()));
        console.timeEnd("decoding");
        assert.equal(decodedLength, buffer.length);
        assert.deepEqual(decodedList, list);
    });

    it("should encode / decode arrays", async () => {
        let codec = new BinaryCodec();

        let length = 20;
        let sizeOfItem = 2; // u16
        let arrayType = new ArrayVecType(length, new U16Type());
        let array = new ArrayVec(arrayType, Array(length).fill(new U16Value(0xabba)));

        let bufferNested = codec.encodeNested(array);
        let bufferTopLevel = codec.encodeTopLevel(array);
        assert.equal(bufferNested.length, length * sizeOfItem);
        assert.equal(bufferTopLevel.length, length * sizeOfItem);
        assert.deepEqual(bufferNested, Buffer.from("ABBA".repeat(length), "hex"));
        assert.deepEqual(bufferTopLevel, Buffer.from("ABBA".repeat(length), "hex"));

        let [decodedNested, decodedNestedLength] = codec.decodeNested<ArrayVec>(bufferNested, arrayType);
        let decodedTopLevel = codec.decodeTopLevel<ArrayVec>(bufferTopLevel, arrayType);
        assert.equal(decodedNestedLength, bufferNested.length);
        assert.equal(decodedNested.getLength(), length);
        assert.equal(decodedTopLevel.getLength(), length);
        assert.deepEqual(decodedNested, array);
        assert.deepEqual(decodedTopLevel, array);
    });

    it("should encode / decode structs", async () => {
        let codec = new BinaryCodec();
        let fooType = new StructType("Foo", [
            new FieldDefinition("token_identifier", "", new TokenIdentifierType()),
            new FieldDefinition("ticket_price", "", new BigUIntType()),
            new FieldDefinition("tickets_left", "", new U32Type()),
            new FieldDefinition("deadline", "", new U64Type()),
            new FieldDefinition("max_entries_per_user", "", new U32Type()),
            new FieldDefinition("prize_distribution", "", new BytesType()),
            new FieldDefinition("prize_pool", "", new BigUIntType()),
        ]);

        let fooStruct = new Struct(fooType, [
            new Field(new TokenIdentifierValue("lucky-token"), "token_identifier"),
            new Field(new BigUIntValue(1), "ticket_price"),
            new Field(new U32Value(0), "tickets_left"),
            new Field(new U64Value(new BigNumber("0x000000005fc2b9db")), "deadline"),
            new Field(new U32Value(0xffffffff), "max_entries_per_user"),
            new Field(new BytesValue(Buffer.from([0x64])), "prize_distribution"),
            new Field(new BigUIntValue(new BigNumber("94720000000000000000000")), "prize_pool"),
        ]);

        let encodedExpected = serialized(
            "[0000000b|6c75636b792d746f6b656e] [00000001|01] [00000000] [000000005fc2b9db] [ffffffff] [00000001|64] [0000000a|140ec80fa7ee88000000]",
        );
        let encoded = codec.encodeNested(fooStruct);
        assert.deepEqual(encoded, encodedExpected);

        let [decoded, decodedLength] = codec.decodeNested(encodedExpected, fooType);
        assert.equal(decodedLength, encodedExpected.length);
        assert.deepEqual(decoded, fooStruct);

        let plainFoo = decoded.valueOf();
        assert.deepEqual(plainFoo, {
            token_identifier: "lucky-token",
            ticket_price: new BigNumber("1"),
            tickets_left: new BigNumber(0),
            deadline: new BigNumber("0x000000005fc2b9db", 16),
            max_entries_per_user: new BigNumber(0xffffffff),
            prize_distribution: Buffer.from([0x64]),
            prize_pool: new BigNumber("94720000000000000000000"),
        });
    });

    it("should encode / decode structs containing a TokenIdentifier", async () => {
        let codec = new BinaryCodec();
        let paymentType = new StructType("Payment", [
            new FieldDefinition("token_identifier", "", new TokenIdentifierType()),
            new FieldDefinition("nonce", "", new U64Type()),
            new FieldDefinition("amount", "", new BigUIntType()),
        ]);

        let paymentStruct = new Struct(paymentType, [
            new Field(new TokenIdentifierValue("TEST-1234"), "token_identifier"),
            new Field(new U64Value(new BigNumber(42)), "nonce"),
            new Field(new BigUIntValue(new BigNumber("123450000000000000000")), "amount"),
        ]);

        let encodedExpected = serialized(
            "[00000009|544553542d31323334] [000000000000002a] [00000009|06b13680ef11f90000]",
        );
        let encoded = codec.encodeNested(paymentStruct);
        assert.deepEqual(encoded, encodedExpected);

        let [decoded, decodedLength] = codec.decodeNested(encodedExpected, paymentType);
        assert.equal(decodedLength, encodedExpected.length);
        assert.deepEqual(decoded, paymentStruct);

        let decodedPayment = decoded.valueOf();
        assert.deepEqual(decodedPayment, {
            token_identifier: "TEST-1234",
            nonce: new BigNumber(42),
            amount: new BigNumber("123450000000000000000"),
        });
    });

    it("should encode / decode enums", async () => {
        let codec = new BinaryCodec();
        let enumType = new EnumType("Colour", [
            new EnumVariantDefinition("Orange", 0),
            new EnumVariantDefinition("Green", 1),
            new EnumVariantDefinition("Blue", 255),
        ]);

        let orange = EnumValue.fromName(enumType, "Orange");
        let green = EnumValue.fromName(enumType, "Green");
        let blue = EnumValue.fromName(enumType, "Blue");

        assert.deepEqual(codec.encodeNested(orange), Buffer.from([0x00]));
        assert.deepEqual(codec.encodeTopLevel(orange), Buffer.from([]));
        assert.deepEqual(codec.encodeNested(green), Buffer.from([0x01]));
        assert.deepEqual(codec.encodeTopLevel(green), Buffer.from([0x01]));
        assert.deepEqual(codec.encodeNested(blue), Buffer.from([0xff]));
        assert.deepEqual(codec.encodeTopLevel(blue), Buffer.from([0xff]));

        assert.isTrue(orange.equals(<EnumValue>codec.decodeTopLevel(Buffer.from([]), enumType)));
        assert.isTrue(green.equals(<EnumValue>codec.decodeTopLevel(Buffer.from([0x01]), enumType)));
        assert.isTrue(blue.equals(<EnumValue>codec.decodeTopLevel(Buffer.from([0xff]), enumType)));

        let [decoded] = codec.decodeNested(Buffer.from([0x00]), enumType);
        assert.deepEqual(decoded, orange);
        [decoded] = codec.decodeNested(Buffer.from([0x01]), enumType);
        assert.deepEqual(decoded, green);
        [decoded] = codec.decodeNested(Buffer.from([0xff]), enumType);
        assert.deepEqual(decoded, blue);
    });

    it("should encode / decode (heterogeneous) enums with fields", async () => {
        let codec = new BinaryCodec();
        let typeOfListOfStrings = new ListType(new BytesType());

        let orangeVariant = new EnumVariantDefinition("Orange", 0, [
            new FieldDefinition("0", "red component", new U8Type()),
            new FieldDefinition("1", "green component", new U8Type()),
            new FieldDefinition("2", "blue component", new U8Type()),
            new FieldDefinition("3", "hex code", new BytesType()),
            new FieldDefinition("4", "fruits", typeOfListOfStrings),
        ]);

        let blueVariant = new EnumVariantDefinition("Blue", 1, [
            new FieldDefinition("0", "hex code", new BytesType()),
            new FieldDefinition("1", "fruits", typeOfListOfStrings),
        ]);

        let enumType = new EnumType("Colour", [orangeVariant, blueVariant]);

        let orange = new EnumValue(enumType, orangeVariant, [
            new Field(new U8Value(255), "0"),
            new Field(new U8Value(165), "1"),
            new Field(new U8Value(0), "2"),
            new Field(BytesValue.fromUTF8("#FFA500"), "3"),
            new Field(
                new List(typeOfListOfStrings, [BytesValue.fromUTF8("orange"), BytesValue.fromUTF8("persimmon")]),
                "4",
            ),
        ]);

        let blue = new EnumValue(enumType, blueVariant, [
            new Field(BytesValue.fromUTF8("#0000FF"), "0"),
            new Field(
                new List(typeOfListOfStrings, [BytesValue.fromUTF8("blueberry"), BytesValue.fromUTF8("plum")]),
                "1",
            ),
        ]);

        // Orange
        // [[discriminant = 0]] [R] [G] [B] [bytes for hex code] [list of 2 elements (fruits)]
        let orangeEncodedNested = serialized(
            "[[00]] [ff] [a5] [00] [00000007 | 23464641353030] [00000002 | [00000006|6f72616e6765] [00000009|70657273696d6d6f6e]]",
        );
        let orangeEncodedTopLevel = orangeEncodedNested;
        assert.deepEqual(codec.encodeNested(orange), orangeEncodedNested);
        assert.deepEqual(codec.encodeTopLevel(orange), orangeEncodedTopLevel);

        let [decoded] = codec.decodeNested(orangeEncodedNested, enumType);
        assert.deepEqual(decoded, orange);
        decoded = codec.decodeTopLevel(orangeEncodedTopLevel, enumType);
        assert.deepEqual(decoded, orange);

        // Blue
        // [[discriminant = 01]] [bytes for hex code] [list of 2 elements (fruits)]
        let blueEncodedNested = serialized(
            "[[01]] [00000007 | 23303030304646] [ 00000002 | [00000009|626c75656265727279] [00000004|706c756d]]",
        );
        let blueEncodedTopLevel = blueEncodedNested;
        assert.deepEqual(codec.encodeNested(blue), blueEncodedNested);
        assert.deepEqual(codec.encodeTopLevel(blue), blueEncodedTopLevel);

        [decoded] = codec.decodeNested(blueEncodedNested, enumType);
        assert.deepEqual(decoded, blue);
        decoded = codec.decodeTopLevel(blueEncodedTopLevel, enumType);
        assert.deepEqual(decoded, blue);
    });
});

function serialized(prettyHex: string): Buffer {
    let uglyHex = prettyHex.replace(/[\|\s\[\]]/gi, "");
    let buffer = Buffer.from(uglyHex, "hex");
    return buffer;
}

describe("test codec utilities", () => {
    it("should check whether isMsbOne", async () => {
        assert.isTrue(isMsbOne(Buffer.from([0xff]), 0));
        assert.isTrue(isMsbOne(Buffer.from([0x00, 0xff]), 1));
        assert.isTrue(isMsbOne(Buffer.from([0x00, 0xff, 0xff]), 2));

        assert.isFalse(isMsbOne(Buffer.from([1])));
        assert.isFalse(isMsbOne(Buffer.from([2])));
        assert.isFalse(isMsbOne(Buffer.from([3])));
        assert.isFalse(isMsbOne(Buffer.from([127])));
        assert.isTrue(isMsbOne(Buffer.from([128])));
        assert.isTrue(isMsbOne(Buffer.from([255])));

        assert.isTrue(isMsbOne(Buffer.from([0b10001000]), 0));
        assert.isFalse(isMsbOne(Buffer.from([0b01001000]), 0));
        assert.isTrue(isMsbOne(Buffer.from([0b00000000, 0b10000000]), 1));
        assert.isFalse(isMsbOne(Buffer.from([0b00000000, 0b01000000]), 1));

        let buffer: Buffer;

        buffer = Buffer.alloc(2);
        buffer.writeUInt16BE(65535);
        assert.isTrue(isMsbOne(buffer));
        buffer.writeInt16BE(-32768);
        assert.isTrue(isMsbOne(buffer));
        buffer.writeInt16BE(32767);
        assert.isFalse(isMsbOne(buffer));

        buffer = Buffer.alloc(8);
        buffer.writeBigUInt64BE(BigInt("18446744073709551615"));
        assert.isTrue(isMsbOne(buffer));
        buffer.writeBigInt64BE(BigInt("-9223372036854775808"));
        assert.isTrue(isMsbOne(buffer));
        buffer.writeBigInt64BE(BigInt("9223372036854775807"));
        assert.isFalse(isMsbOne(buffer));
    });
});
