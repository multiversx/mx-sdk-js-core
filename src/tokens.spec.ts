import { Token, TokenTransfer, TokenComputer } from "./tokens";
import { assert } from "chai";

describe("test token computer", async () => {
    const tokenComputer = new TokenComputer();

    it("should test if token is fungible", async () => {
        const fungibleToken = new Token("TEST-123456", 0);
        const nonFungibleToken = new Token("NFT-987654", 7);

        assert.equal(tokenComputer.isFungible(fungibleToken), true);
        assert.equal(tokenComputer.isFungible(nonFungibleToken), false);
    });

    it("should extract nonce from extended identifier", async () => {
        const extendedIdentifier = "TEST-123456-0a";
        const nonce = tokenComputer.extractNonceFromExtendedIdentifier(extendedIdentifier);
        assert.equal(nonce, 10);
    })

    it("should extract identifier from extended identifier", async () => {
        const extendedIdentifier = "TEST-123456-0a";
        const identifier = tokenComputer.extractIdentifierFromExtendedIdentifier(extendedIdentifier);
        assert.equal(identifier, "TEST-123456");
    })
});
