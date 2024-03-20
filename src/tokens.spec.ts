import { assert } from "chai";
import { Token, TokenComputer } from "./tokens";

describe("test token computer", async () => {
    const tokenComputer = new TokenComputer();

    it("should test if token is fungible", async () => {
        const fungibleToken = new Token("TEST-123456", 0n);
        const nonFungibleToken = new Token("NFT-987654", 7n);

        assert.equal(tokenComputer.isFungible(fungibleToken), true);
        assert.equal(tokenComputer.isFungible(nonFungibleToken), false);
    });

    it("should extract nonce from extended identifier", async () => {
        const extendedIdentifier = "TEST-123456-0a";
        let nonce = tokenComputer.extractNonceFromExtendedIdentifier(extendedIdentifier);
        assert.equal(nonce, 10);

        const fungibleTokenIdentifier = "FNG-123456";
        nonce = tokenComputer.extractNonceFromExtendedIdentifier(fungibleTokenIdentifier);
        assert.equal(nonce, 0);
    });

    it("should extract identifier from extended identifier", async () => {
        const extendedIdentifier = "TEST-123456-0a";
        let identifier = tokenComputer.extractIdentifierFromExtendedIdentifier(extendedIdentifier);
        assert.equal(identifier, "TEST-123456");

        const fungibleTokenIdentifier = "FNG-123456";
        identifier = tokenComputer.extractIdentifierFromExtendedIdentifier(fungibleTokenIdentifier);
        assert.equal(identifier, "FNG-123456");
    });
});
