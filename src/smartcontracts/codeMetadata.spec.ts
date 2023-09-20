import { assert } from "chai";
import { CodeMetadata } from "./codeMetadata";

describe("test code metadata", function () {
    it("should test code metadata from bytes", () => {
        const bytes = new Uint8Array([1, 0]);
        const codeMetadata = CodeMetadata.fromBytes(bytes);

        assert.equal(codeMetadata.toString(), "0100");
        assert.deepEqual(codeMetadata.toJSON(), {
            upgradeable: true,
            readable: false,
            payable: false,
            payableBySc: false
        });
    });
});
