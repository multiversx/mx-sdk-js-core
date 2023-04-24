import { assert } from "chai";
import { Address } from "../address";
import { NativeSerializer } from "./nativeSerializer";
import { AbiRegistry, AddressType, BigUIntType, BooleanType, BooleanValue, EndpointDefinition, EndpointModifiers, EndpointParameterDefinition, ListType, NullType, OptionalType, OptionType, U32Type, VariadicType, VariadicValue } from "./typesystem";
import { BytesType, BytesValue } from "./typesystem/bytes";

describe("test native serializer", () => {
    it("should perform type inference", async () => {
        const endpointModifiers = new EndpointModifiers("", []);
        const inputParameters = [
            new EndpointParameterDefinition("", "", new BigUIntType()),
            new EndpointParameterDefinition("", "", new ListType(new AddressType())),
            new EndpointParameterDefinition("", "", new BytesType()),
            new EndpointParameterDefinition("", "", new BytesType()),
            new EndpointParameterDefinition("", "", new OptionType(new U32Type())),
            new EndpointParameterDefinition("", "", new OptionType(new U32Type())),
            new EndpointParameterDefinition("", "", new OptionalType(new BytesType()))
        ];
        const endpoint = new EndpointDefinition("foo", inputParameters, [], endpointModifiers);

        const p0 = 42;
        const p1 = [new Address("erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha"), new Address("erd1r69gk66fmedhhcg24g2c5kn2f2a5k4kvpr6jfw67dn2lyydd8cfswy6ede")];
        const p2 = Buffer.from("abba", "hex");
        const p3 = Number(0xabba);
        const p4 = null;
        const p5 = 7;

        // Let's not provide the last parameter
        const typedValues = NativeSerializer.nativeToTypedValues([p0, p1, p2, p3, p4, p5], endpoint);

        assert.deepEqual(typedValues[0].getType(), new BigUIntType());
        assert.deepEqual(typedValues[0].valueOf().toNumber(), p0);
        assert.deepEqual(typedValues[1].getType(), new ListType(new AddressType()));
        assert.deepEqual(typedValues[1].valueOf(), p1);
        assert.deepEqual(typedValues[2].getType(), new BytesType());
        assert.deepEqual(typedValues[2].valueOf(), p2);
        assert.deepEqual(typedValues[3].getType(), new BytesType());
        assert.deepEqual(typedValues[3].valueOf(), Buffer.from("abba", "hex"));
        assert.deepEqual(typedValues[4].getType(), new OptionType(new NullType()));
        assert.deepEqual(typedValues[4].valueOf(), null);
        assert.deepEqual(typedValues[5].getType(), new OptionType(new U32Type()));
        assert.deepEqual(typedValues[5].valueOf().toNumber(), p5);
        assert.deepEqual(typedValues[6].getType(), new OptionalType(new BytesType()));
        assert.deepEqual(typedValues[6].valueOf(), null);
    });

    it("should accept a mix between typed values and regular JavaScript objects", async () => {
        let endpointModifiers = new EndpointModifiers("", []);
        let inputParameters = [
            new EndpointParameterDefinition("a", "a", new BigUIntType()),
            new EndpointParameterDefinition("b", "b", new ListType(new AddressType())),
            new EndpointParameterDefinition("c", "c", new BytesType())
        ];
        let endpoint = new EndpointDefinition("foo", inputParameters, [], endpointModifiers);

        let a = 42;
        let b = [new Address("erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha")];
        let c = BytesValue.fromUTF8("test");

        let typedValues = NativeSerializer.nativeToTypedValues([a, b, c], endpoint);

        assert.deepEqual(typedValues[0].getType(), new BigUIntType());
        assert.deepEqual(typedValues[0].valueOf().toNumber(), a);
        assert.deepEqual(typedValues[1].getType(), new ListType(new AddressType()));
        assert.deepEqual(typedValues[1].valueOf(), b);
        assert.deepEqual(typedValues[2].getType(), new BytesType());
        assert.deepEqual(typedValues[2].valueOf(), c.valueOf());
    });

    it("should accept a mix between typed values and regular JavaScript objects (variadic)", async () => {
        const endpoint = AbiRegistry.create({
            "endpoints": [
                {
                    "name": "foo",
                    "inputs": [{
                        "type": "bool"
                    }, {
                        "type": "optional<bool>"
                    }, {
                        "type": "variadic<bool>"
                    }],
                    "outputs": []
                }
            ]
        }).getEndpoint("foo");

        // Using only native JavaScript objects
        let typedValues = NativeSerializer.nativeToTypedValues([
            true,
            null,
            true,
            false,
            true
        ], endpoint);

        assert.deepEqual(typedValues[0].getType(), new BooleanType());
        assert.deepEqual(typedValues[0].valueOf(), true);
        assert.deepEqual(typedValues[1].getType(), new OptionalType(new BooleanType()));
        assert.deepEqual(typedValues[1].valueOf(), null);
        assert.deepEqual(typedValues[2].getType(), new VariadicType(new BooleanType()));
        assert.deepEqual(typedValues[2].valueOf(), [true, false, true]);

        // Using both native JavaScript objects and typed values
        typedValues = NativeSerializer.nativeToTypedValues([
            true,
            null,
            VariadicValue.fromItems(new BooleanValue(true), new BooleanValue(false), new BooleanValue(true)),
        ], endpoint);

        assert.deepEqual(typedValues[0].getType(), new BooleanType());
        assert.deepEqual(typedValues[0].valueOf(), true);
        assert.deepEqual(typedValues[1].getType(), new OptionalType(new BooleanType()));
        assert.deepEqual(typedValues[1].valueOf(), null);
        assert.deepEqual(typedValues[2].getType(), new VariadicType(new BooleanType()));
        assert.deepEqual(typedValues[2].valueOf(), [true, false, true]);
    });
});
