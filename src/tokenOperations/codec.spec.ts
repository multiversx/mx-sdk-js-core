import BigNumber from "bignumber.js";
import { assert } from "chai";
import { MaxNumericByteLength } from "../abi/codec/constants";
import { bigIntToBuffer, bigIntToHex, bufferToBigInt, bufferToHex, stringToBuffer, utf8ToHex } from "./codec";

describe("test codec", () => {
    it("bounds integer conversion before decoding", () => {
        assert.throws(() => bufferToBigInt(Buffer.alloc(MaxNumericByteLength + 1)), "Numeric payload too large");
    });

    it("should properly encode and decode values", () => {
        assert.deepEqual(stringToBuffer("hello"), Buffer.from("hello"));
        assert.deepEqual(bufferToBigInt(Buffer.from("075bcd15", "hex")), new BigNumber("123456789"));
        assert.deepEqual(bufferToBigInt(Buffer.from([])), new BigNumber("0"));
        assert.deepEqual(bigIntToBuffer("123456789"), Buffer.from("075bcd15", "hex"));
        assert.deepEqual(bigIntToBuffer(0), Buffer.from([]));
        assert.equal(bigIntToHex("123456789"), "075bcd15");
        assert.equal(bigIntToHex(0), "");
        assert.equal(utf8ToHex("hello"), "68656c6c6f");
        assert.equal(utf8ToHex(""), "");
        assert.equal(bufferToHex(Buffer.from("hello")), "68656c6c6f");
        assert.equal(bufferToHex(Buffer.from([])), "");
    });
});
