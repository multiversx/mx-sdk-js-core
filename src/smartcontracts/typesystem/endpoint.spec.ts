import { assert } from "chai";
import { EndpointDefinition } from "./endpoint";

describe("test endpoint", () => {
    it("should handle an only-owner modifier", async () => {
        const actual = EndpointDefinition.fromJSON({
            name: "foo",
            onlyOwner: true,
            mutability: "payable",
            payableInTokens: [],
            inputs: [],
            outputs: [],
        });

        assert.isTrue(actual.modifiers.onlyOwner);
        assert.isTrue(actual.modifiers.isOnlyOwner());
    });
});
