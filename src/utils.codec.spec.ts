import { assert } from "chai";
import { byteArrayToHex, isPaddedHex, numberToPaddedHex, utf8ToHex, zeroPadStringIfOddLength } from "./utils.codec";

describe("test codec utils", () => {
    it("should convert numberToPaddedHex", () => {
        assert.equal(numberToPaddedHex(0), "00");
        assert.equal(numberToPaddedHex(1), "01");
        assert.equal(numberToPaddedHex(10), "0a");
        assert.equal(numberToPaddedHex(256), "0100");

        assert.equal(numberToPaddedHex(0n), "00");
        assert.equal(numberToPaddedHex(1n), "01");
        assert.equal(numberToPaddedHex(10n), "0a");
        assert.equal(numberToPaddedHex(256n), "0100");

        assert.equal(numberToPaddedHex("0"), "00");
        assert.equal(numberToPaddedHex("1"), "01");
        assert.equal(numberToPaddedHex("10"), "0a");
        assert.equal(numberToPaddedHex("256"), "0100");
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

    it("should convert byteArrayToHex", () => {
        const firstArray = new Uint8Array([0x05, 0x00]);
        const secondArray = new Uint8Array([0x7]);

        assert.equal(byteArrayToHex(firstArray), "0500");
        assert.equal(byteArrayToHex(secondArray), "07");
    });

    it("should convert utf8ToHex", () => {
        assert.equal(utf8ToHex("stringandnumber7"), "737472696e67616e646e756d62657237");
        assert.equal(utf8ToHex("somestring"), "736f6d65737472696e67");
        assert.equal(utf8ToHex("aaa"), "616161");
    });
});
