import { assert } from "chai";
import { Token, TokenComputer, TokenTransfer } from "./tokens";

describe("test tokens and token computer", async () => {
    const tokenComputer = new TokenComputer();

    it("should test if token is fungible", async () => {
        const fungibleToken = new Token({ identifier: "TEST-123456" });
        const nonFungibleToken = new Token({ identifier: "NFT-987654", nonce: 7n });

        assert.equal(tokenComputer.isFungible(fungibleToken), true);
        assert.equal(tokenComputer.isFungible(nonFungibleToken), false);
    });

    it("should extract nonce from extended identifier", async () => {
        const extendedIdentifier = "TEST-123456-0a";
        let nonce = tokenComputer.extractNonceFromExtendedIdentifier(extendedIdentifier);
        assert.equal(nonce, 10);

        const extendedIdentifierWithPrefix = "test-TEST-123456-0a";
        nonce = tokenComputer.extractNonceFromExtendedIdentifier(extendedIdentifierWithPrefix);
        assert.equal(nonce, 10);

        const fungibleTokenIdentifier = "FNG-123456";
        nonce = tokenComputer.extractNonceFromExtendedIdentifier(fungibleTokenIdentifier);
        assert.equal(nonce, 0);

        const fungibleTokenIdentifierWithPrefix = "fun-FNG-123456";
        nonce = tokenComputer.extractNonceFromExtendedIdentifier(fungibleTokenIdentifierWithPrefix);
        assert.equal(nonce, 0);
    });

    it("should extract identifier from extended identifier", async () => {
        const extendedIdentifier = "TEST-123456-0a";
        let identifier = tokenComputer.extractIdentifierFromExtendedIdentifier(extendedIdentifier);
        assert.equal(identifier, "TEST-123456");

        const extendedIdentifierWithPrefix = "t0-TEST-123456-0a";
        identifier = tokenComputer.extractIdentifierFromExtendedIdentifier(extendedIdentifierWithPrefix);
        assert.equal(identifier, "t0-TEST-123456");

        const extendedIdentifierWithPrefixWithoutNonce = "t0-TEST-123456";
        identifier = tokenComputer.extractIdentifierFromExtendedIdentifier(extendedIdentifierWithPrefixWithoutNonce);
        assert.equal(identifier, "t0-TEST-123456");

        const fungibleTokenIdentifier = "FNG-123456";
        identifier = tokenComputer.extractIdentifierFromExtendedIdentifier(fungibleTokenIdentifier);
        assert.equal(identifier, "FNG-123456");

        const numericTokenTicker = "2065-65td7s";
        identifier = tokenComputer.extractIdentifierFromExtendedIdentifier(numericTokenTicker);
        assert.equal(identifier, "2065-65td7s");

        const numericTokenTickerWithNonce = "2065-65td7s-01";
        identifier = tokenComputer.extractIdentifierFromExtendedIdentifier(numericTokenTickerWithNonce);
        assert.equal(identifier, "2065-65td7s");

        const numericTokenTickerWithPrefix = "t0-2065-65td7s";
        identifier = tokenComputer.extractIdentifierFromExtendedIdentifier(numericTokenTickerWithPrefix);
        assert.equal(identifier, "t0-2065-65td7s");

        const numericTokenTickerWithPrefixAndNonce = "t0-2065-65td7s";
        identifier = tokenComputer.extractIdentifierFromExtendedIdentifier(numericTokenTickerWithPrefixAndNonce);
        assert.equal(identifier, "t0-2065-65td7s");
    });

    it("should fail if prefix longer than expected", async () => {
        const nftIdentifier = "prefix-TEST-123456";
        assert.throw(
            () => tokenComputer.extractIdentifierFromExtendedIdentifier(nftIdentifier),
            "The identifier is not valid. The prefix does not have the right length",
        );
    });
});

describe("test token transfer", () => {
    it("should work with custom token type", () => {
        const identifier = "MEXFARML-28d646";
        const nonce = 12345678n;
        const transfer = new TokenTransfer({
            token: new Token({ identifier, nonce }),
            amount: BigInt(100000000000000000),
        });

        assert.equal(transfer.token.identifier, identifier);
        assert.equal(transfer.token.nonce, nonce);
        assert.equal(transfer.toString(), "100000000000000000");
    });

    it("should work with NFTs", () => {
        const identifier = "TEST-38f249";
        const nonce = 1n;
        const transfer = new TokenTransfer({ token: new Token({ identifier, nonce }), amount: 1n });

        assert.equal(transfer.tokenIdentifier, identifier);
        assert.equal(transfer.token.nonce, nonce);
        assert.equal(transfer.amount, 1n);
    });

    it("should create TokenTransfer from native token amount", () => {
        const transfer = TokenTransfer.newFromNativeAmount(1000000000000000000n);

        assert.equal(transfer.token.identifier, "EGLD-000000");
        assert.equal(transfer.token.nonce, 0n);
        assert.equal(transfer.amount, 1000000000000000000n);
    });
});
