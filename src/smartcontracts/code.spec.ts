import { assert } from "chai";
import { Code } from "./code";
import { Hash } from "../hash";

describe("Code Class Tests", function() {
    const sampleHex = "abcdef0123456789";
    const sampleBuffer = Buffer.from(sampleHex, "hex");

    it("should create Code from buffer", function() {
        const code = Code.fromBuffer(sampleBuffer);

        assert.instanceOf(code, Code);
        assert.equal(code.toString(), sampleHex);
    });

    it("should create Code from hex string", function() {
        const code = Code.fromHex(sampleHex);

        assert.instanceOf(code, Code);
        assert.equal(code.toString(), sampleHex);
    });

    it("should return the correct buffer from valueOf", function() {
        const code = Code.fromHex(sampleHex);
        const buffer = code.valueOf();

        assert.isTrue(Buffer.isBuffer(buffer));
        assert.equal(buffer.toString("hex"), sampleHex);
    });

    it("should compute hash correctly", function() {
        const code = Code.fromHex(sampleHex);
        const hash = code.computeHash();

        assert.instanceOf(hash, Hash);
    });
});
