import assert from "assert";
import { NonFungibleTokenOfAccountOnNetwork } from "./tokens";

describe("NFT account balance", function () {
    it("keeps a numeric zero balance", function () {
        const parsed = NonFungibleTokenOfAccountOnNetwork.fromApiHttpResponse({
            identifier: "TOKEN-abc",
            collection: "TOKEN-abc",
            balance: 0,
        });
        assert.strictEqual(parsed.balance.toFixed(), "0");
        assert.strictEqual(parsed.supply.toFixed(), "0");
    });

    it("keeps a positive balance and defaults a missing one to 1", function () {
        const held = NonFungibleTokenOfAccountOnNetwork.fromApiHttpResponse({
            identifier: "TOKEN-abc",
            collection: "TOKEN-abc",
            balance: 2,
        });
        assert.strictEqual(held.balance.toFixed(), "2");

        const missing = NonFungibleTokenOfAccountOnNetwork.fromApiHttpResponse({
            identifier: "TOKEN-abc",
            collection: "TOKEN-abc",
        });
        assert.strictEqual(missing.balance.toFixed(), "1");
    });
});
