import assert from "assert";

describe("test JSON serialization", function () {
    it("should not deserialize", async function () {
        const JSONbig = require("json-bigint");
        const data = `{"Costum":{"foo_constructor":1}}`;
        assert.throws(() => JSONbig.parse(data));
    });

    it("should deserialize", async function () {
        const JSONbig = require("json-bigint")({ constructorAction: 'ignore' });
        const data = `{"Costum":{"foo_constructor":1}}`;
        JSONbig.parse(data);
    });
});

