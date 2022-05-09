import { assert } from "chai";
import { Address } from "../address";
import { AddressType, BigUIntType, EndpointDefinition, EndpointModifiers, EndpointParameterDefinition, ListType, NullType, OptionalType, OptionType, U32Type } from "./typesystem";
import { BytesType, BytesValue } from "./typesystem/bytes";
import { NativeSerializer } from "./nativeSerializer";
import { ErrTypeInferenceSystemRequiresRegularJavascriptObjects } from "../errors";

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

        // Let's not provide "f"
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

    it("should not accept already typed values", async () => {
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

        assert.throw(() => NativeSerializer.nativeToTypedValues([a, b, c], endpoint), ErrTypeInferenceSystemRequiresRegularJavascriptObjects);
    });
});
