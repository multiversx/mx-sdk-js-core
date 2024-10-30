import { assert } from "chai";
import { CodeMetadata } from "./codeMetadata";

describe("CodeMetadata Class Tests", function () {
    it("should create a default CodeMetadata instance", function () {
        const metadata = new CodeMetadata();
        assert.isTrue(metadata.upgradeable);
        assert.isFalse(metadata.readable);
        assert.isFalse(metadata.payable);
        assert.isFalse(metadata.payableBySc);
    });

    it("should toggle properties correctly", function () {
        const metadata = new CodeMetadata();
        metadata.toggleUpgradeable(false);
        metadata.toggleReadable(true);
        metadata.togglePayable(true);
        metadata.togglePayableBySc(true);

        assert.isFalse(metadata.upgradeable);
        assert.isTrue(metadata.readable);
        assert.isTrue(metadata.payable);
        assert.isTrue(metadata.payableBySc);
    });

    it("should convert to buffer correctly", function () {
        const metadata = new CodeMetadata(true, true, true, true);
        const buffer = metadata.toBuffer();

        assert.equal(buffer.length, 2);
        assert.equal(buffer[0], CodeMetadata.ByteZero.Upgradeable | CodeMetadata.ByteZero.Readable);
        assert.equal(buffer[1], CodeMetadata.ByteOne.Payable | CodeMetadata.ByteOne.PayableBySc);
    });

    it("should create from buffer correctly when all flags are set", function () {
        const buffer = Buffer.from([
            CodeMetadata.ByteZero.Upgradeable | CodeMetadata.ByteZero.Readable,
            CodeMetadata.ByteOne.Payable | CodeMetadata.ByteOne.PayableBySc,
        ]);
        const metadata = CodeMetadata.fromBuffer(buffer);

        assert.isTrue(metadata.upgradeable);
        assert.isTrue(metadata.readable);
        assert.isTrue(metadata.payable);
        assert.isTrue(metadata.payableBySc);
    });

    it("should create from buffer correctly when some flags are set", function () {
        const buffer = Buffer.from([CodeMetadata.ByteZero.Upgradeable, CodeMetadata.ByteOne.PayableBySc]);
        const metadata = CodeMetadata.fromBuffer(buffer);

        assert.isTrue(metadata.upgradeable);
        assert.isFalse(metadata.readable);
        assert.isFalse(metadata.payable);
        assert.isTrue(metadata.payableBySc);
    });

    it("should handle buffer too short error", function () {
        const buffer = Buffer.from([CodeMetadata.ByteZero.Upgradeable]);

        assert.throws(
            () => {
                CodeMetadata.fromBuffer(buffer);
            },
            Error,
            "code metadata buffer has length 1, expected 2",
        );
    });

    it("should test code metadata from bytes", () => {
        const bytes = new Uint8Array([1, 0]);
        const codeMetadata = CodeMetadata.fromBytes(bytes);

        assert.equal(codeMetadata.toString(), "0100");
        assert.deepEqual(codeMetadata.toJSON(), {
            upgradeable: true,
            readable: false,
            payable: false,
            payableBySc: false,
        });
    });
});
