import { assert } from "chai";
import { Code } from "./code";

describe("Code Class Tests", function () {
    const sampleHex = "abcdef0123456789";
    const sampleBuffer = Buffer.from(sampleHex, "hex");

    it("should create Code from buffer", function () {
        const code = Code.fromBuffer(sampleBuffer);

        assert.instanceOf(code, Code);
        assert.equal(code.toString(), sampleHex);
    });

    it("should create Code from hex string", function () {
        const code = Code.fromHex(sampleHex);

        assert.instanceOf(code, Code);
        assert.equal(code.toString(), sampleHex);
    });

    it("should return the correct buffer from valueOf", function () {
        const code = Code.fromHex(sampleHex);
        const buffer = code.valueOf();

        assert.isTrue(Buffer.isBuffer(buffer));
        assert.equal(buffer.toString("hex"), sampleHex);
    });

    it("should compute hash correctly", function () {
        const code = Code.fromHex(sampleHex);
        const hash = code.computeHash();

        assert.instanceOf(hash, Buffer);
        assert.equal(hash.toString("hex"), "ac86b78afd9bdda3641a47a4aff2a7ee26acd40cc534d63655e9dfbf3f890a02");
    });
});
