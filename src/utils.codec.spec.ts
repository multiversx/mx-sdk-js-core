import { assert } from "chai";
import { isPaddedHex, numberToPaddedHex, zeroPadStringIfOddLength } from "./utils.codec";

describe("test codec utils", () => {
    it("should convert numberToPaddedHex", () => {
        assert.equal(numberToPaddedHex(1), "01");
        assert.equal(numberToPaddedHex(10), "0a");
        assert.equal(numberToPaddedHex(256), "0100");
    });

    it("should check if isPaddedHex", () => {
        assert.isTrue(isPaddedHex("0A"));
        assert.isTrue(isPaddedHex("0a"));
        assert.isTrue(isPaddedHex("00ABCD"));
        assert.isTrue(isPaddedHex("0000"));
        assert.isFalse(isPaddedHex("000"));
        assert.isFalse(isPaddedHex("1"));
    });

    it("should zeroPadStringIfOddLength", () => {
        assert.equal(zeroPadStringIfOddLength("1"), "01");
        assert.equal(zeroPadStringIfOddLength("01"), "01");
    });
});
