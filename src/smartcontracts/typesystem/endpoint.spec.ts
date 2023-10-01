import { assert } from "chai";
import { EndpointDefinition } from "./endpoint";


describe("test endpoint", () => {
    it('should handle an only-owner modifier', async () => {
      const actual = EndpointDefinition.fromJSON({
        name: 'foo',
        ownerOnly: true,
        mutability: 'payable',
        payableInTokens: [],
        inputs: [],
        outputs: [],
      })

      assert.isTrue(actual.modifiers.ownerOnly)
      assert.isTrue(actual.modifiers.isOwnerOnly())
    })
});
