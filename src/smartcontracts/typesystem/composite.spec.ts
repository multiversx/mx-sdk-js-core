import { assert } from "chai";
import { ArgSerializer } from "../argSerializer";
import { BytesType, BytesValue } from "./bytes";
import { CompositeType, CompositeValue } from "./composite";
import { EndpointParameterDefinition } from "./endpoint";
import { U32Type, U32Value } from "./numerical";


describe("test composite", () => {
    const serializer = new ArgSerializer();

    it("should get valueOf()", () => {
        const compositeType = new CompositeType(new U32Type(), new BytesType());
        const compositeValue = new CompositeValue(compositeType, [new U32Value(7), BytesValue.fromUTF8("hello")]);

        const values = compositeValue.valueOf();
        assert.lengthOf(values, 2);
        assert.equal(7, values[0]);
        assert.equal("hello", values[1]);
    });

    it("should get valueOf() upon decoding", () => {
        const compositeType = new CompositeType(new U32Type(), new BytesType());
        const endpointDefinition = new EndpointParameterDefinition("", "", compositeType)

        const [compositeValue] = serializer.stringToValues("2a@abba", [endpointDefinition]);
        const values = compositeValue.valueOf();
        assert.lengthOf(values, 2);
        assert.equal(42, values[0]);
        assert.deepEqual(Buffer.from([0xab, 0xba]), values[1]);
    });

    it("should get valueOf(), when items are missing", () => {
        const compositeType = new CompositeType(new U32Type(), new BytesType());
        const items: any = [null, null];
        const compositeValue = new CompositeValue(compositeType, items);

        const values = compositeValue.valueOf();
        assert.lengthOf(values, 2);
        assert.isUndefined(values[0]);
        assert.isUndefined(values[1]);
    });

    it("should get valueOf() upon decoding, when items are missing", () => {
        const compositeType = new CompositeType(new U32Type(), new BytesType());
        const endpointDefinition = new EndpointParameterDefinition("", "", compositeType)

        const [compositeValue] = serializer.stringToValues("", [endpointDefinition]);
        const values = compositeValue.valueOf();
        assert.lengthOf(values, 2);
        assert.equal(0, values[0]);
        assert.isUndefined(values[1]);
    });
});
