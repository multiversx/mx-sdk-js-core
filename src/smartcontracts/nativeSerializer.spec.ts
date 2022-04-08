import { assert } from "chai";
import { Address } from "../address";
import { AddressType, BigUIntType, EndpointDefinition, EndpointModifiers, EndpointParameterDefinition, ListType, NullType, OptionalType, OptionType, U32Type } from "./typesystem";
import { BytesType, BytesValue } from "./typesystem/bytes";
import { NativeSerializer } from "./nativeSerializer";
import { ErrTypeInferenceSystemRequiresRegularJavascriptObjects } from "../errors";

describe("test native serializer", () => {
    it("should perform type inference", async () => {
        let endpointModifiers = new EndpointModifiers("", []);
        let inputParameters = [
            new EndpointParameterDefinition("a", "a", new BigUIntType()),
            new EndpointParameterDefinition("b", "b", new ListType(new AddressType())),
            new EndpointParameterDefinition("c", "c", new BytesType()),
            new EndpointParameterDefinition("d", "d", new OptionType(new U32Type())),
            new EndpointParameterDefinition("e", "e", new OptionType(new U32Type())),
            new EndpointParameterDefinition("f", "f", new OptionalType(new BytesType()))
        ];
        let endpoint = new EndpointDefinition("foo", inputParameters, [], endpointModifiers);

        let a = 42;
        let b = [new Address("erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha"), new Address("erd1r69gk66fmedhhcg24g2c5kn2f2a5k4kvpr6jfw67dn2lyydd8cfswy6ede")];
        let c = Buffer.from("abba", "hex");
        let d = null;
        let e = 7;
        // Let's not provide "f"
        let typedValues = NativeSerializer.nativeToTypedValues([a, b, c, d, e], endpoint);

        assert.deepEqual(typedValues[0].getType(), new BigUIntType());
        assert.deepEqual(typedValues[0].valueOf().toNumber(), a);
        assert.deepEqual(typedValues[1].getType(), new ListType(new AddressType()));
        assert.deepEqual(typedValues[1].valueOf(), b);
        assert.deepEqual(typedValues[2].getType(), new BytesType());
        assert.deepEqual(typedValues[2].valueOf(), c);
        assert.deepEqual(typedValues[3].getType(), new OptionType(new NullType()));
        assert.deepEqual(typedValues[3].valueOf(), null);
        assert.deepEqual(typedValues[4].getType(), new OptionType(new U32Type()));
        assert.deepEqual(typedValues[4].valueOf().toNumber(), e);
        assert.deepEqual(typedValues[5].getType(), new OptionalType(new BytesType()));
        assert.deepEqual(typedValues[5].valueOf(), null);
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
