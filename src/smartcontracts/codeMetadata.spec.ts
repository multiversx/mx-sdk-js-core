import { assert } from "chai";
import { CodeMetadata, ByteZero, ByteOne } from "./codeMetadata";

describe("CodeMetadata Class Tests", function() {
    it("should create a default CodeMetadata instance", function() {
        const metadata = new CodeMetadata();
        assert.isTrue(metadata.upgradeable);
        assert.isFalse(metadata.readable);
        assert.isFalse(metadata.payable);
        assert.isFalse(metadata.payableBySc);
    });

    it("should toggle properties correctly", function() {
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

    it("should convert to buffer correctly", function() {
        const metadata = new CodeMetadata(true, true, true, true);
        const buffer = metadata.toBuffer();

        assert.equal(buffer.length, 2);
        assert.equal(buffer[0], ByteZero.Upgradeable | ByteZero.Readable);
        assert.equal(buffer[1], ByteOne.Payable | ByteOne.PayableBySc);
    });

    it("should create from buffer correctly when all flags are set", function() {
        const buffer = Buffer.from([ByteZero.Upgradeable | ByteZero.Readable, ByteOne.Payable | ByteOne.PayableBySc]);
        const metadata = CodeMetadata.fromBuffer(buffer);

        assert.isTrue(metadata.upgradeable);
        assert.isTrue(metadata.readable);
        assert.isTrue(metadata.payable);
        assert.isTrue(metadata.payableBySc);
    });

    it.only("should create from buffer correctly when some flags are set", function() {
        const buffer = Buffer.from([ByteZero.Upgradeable, ByteOne.PayableBySc]);
        const metadata = CodeMetadata.fromBuffer(buffer);

        assert.isTrue(metadata.upgradeable);
        assert.isFalse(metadata.readable);
        assert.isFalse(metadata.payable);
        assert.isTrue(metadata.payableBySc);
    });

    it("should handle buffer too short error", function() {
        const buffer = Buffer.from([ByteZero.Upgradeable]);

        assert.throws(() => {
            CodeMetadata.fromBuffer(buffer);
        }, Error, "Buffer is too short.");
    });
});
