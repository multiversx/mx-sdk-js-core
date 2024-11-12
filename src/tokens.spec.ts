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
    });

    it("should fail if prefix longer than expected", async () => {
        const nftIdentifier = "prefix-TEST-123456";
        assert.throw(
            () => tokenComputer.extractIdentifierFromExtendedIdentifier(nftIdentifier),
            "The identifier is not valid. The prefix does not have the right length",
        );
    });
});

describe("test token transfer (legacy)", () => {
    it("should work with EGLD", () => {
        assert.equal(TokenTransfer.egldFromAmount("1").toString(), "1000000000000000000");
        assert.equal(TokenTransfer.egldFromAmount("10").toString(), "10000000000000000000");
        assert.equal(TokenTransfer.egldFromAmount("100").toString(), "100000000000000000000");
        assert.equal(TokenTransfer.egldFromAmount("1000").toString(), "1000000000000000000000");
        assert.equal(TokenTransfer.egldFromAmount("0.1").toString(), "100000000000000000");
        assert.equal(TokenTransfer.egldFromAmount("0.123456789").toString(), "123456789000000000");
        assert.equal(TokenTransfer.egldFromAmount("0.123456789123456789").toString(), "123456789123456789");
        assert.equal(TokenTransfer.egldFromAmount("0.123456789123456789777").toString(), "123456789123456789");
        assert.equal(TokenTransfer.egldFromAmount("0.123456789123456789777777888888").toString(), "123456789123456789");

        assert.equal(TokenTransfer.egldFromAmount(0.1).toPrettyString(), "0.100000000000000000 EGLD");
        assert.equal(TokenTransfer.egldFromAmount(1).toPrettyString(), "1.000000000000000000 EGLD");
        assert.equal(TokenTransfer.egldFromAmount(10).toPrettyString(), "10.000000000000000000 EGLD");
        assert.equal(TokenTransfer.egldFromAmount(100).toPrettyString(), "100.000000000000000000 EGLD");
        assert.equal(TokenTransfer.egldFromAmount(1000).toPrettyString(), "1000.000000000000000000 EGLD");
        assert.equal(TokenTransfer.egldFromAmount("0.123456789").toPrettyString(), "0.123456789000000000 EGLD");
        assert.equal(
            TokenTransfer.egldFromAmount("0.123456789123456789777777888888").toPrettyString(),
            "0.123456789123456789 EGLD",
        );

        assert.equal(TokenTransfer.egldFromBigInteger("1").toString(), "1");
        assert.equal(TokenTransfer.egldFromBigInteger("1").toPrettyString(), "0.000000000000000001 EGLD");
        assert.isTrue(TokenTransfer.egldFromAmount("1").isEgld());
    });

    it("should work with USDC (legacy)", () => {
        const identifier = "USDC-c76f1f";
        const numDecimals = 6;

        assert.equal(TokenTransfer.fungibleFromAmount(identifier, "1", numDecimals).toString(), "1000000");
        assert.equal(TokenTransfer.fungibleFromAmount(identifier, "0.1", numDecimals).toString(), "100000");
        assert.equal(TokenTransfer.fungibleFromAmount(identifier, "0.123456789", numDecimals).toString(), "123456");
        assert.equal(TokenTransfer.fungibleFromBigInteger(identifier, "1000000", numDecimals).toString(), "1000000");
        assert.equal(
            TokenTransfer.fungibleFromBigInteger(identifier, "1000000", numDecimals).toPrettyString(),
            "1.000000 USDC-c76f1f",
        );
    });

    it("should work with MetaESDT (legacy)", () => {
        const identifier = "MEXFARML-28d646";
        const numDecimals = 18;
        const nonce = 12345678;
        const transfer = TokenTransfer.metaEsdtFromAmount(identifier, nonce, "0.1", numDecimals);

        assert.equal(transfer.tokenIdentifier, identifier);
        assert.equal(transfer.nonce, nonce);
        assert.equal(transfer.toString(), "100000000000000000");
    });

    it("should work with NFTs (legacy)", () => {
        const identifier = "TEST-38f249";
        const nonce = 1;
        const transfer = TokenTransfer.nonFungible(identifier, nonce);

        assert.equal(transfer.tokenIdentifier, identifier);
        assert.equal(transfer.nonce, nonce);
        assert.equal(transfer.toPrettyString(), "1 TEST-38f249");
    });

    it("should create TokenTransfer from native token amount", () => {
        const transfer = TokenTransfer.newFromEgldAmount(1000000000000000000n);

        assert.equal(transfer.token.identifier, "EGLD-000000");
        assert.equal(transfer.token.nonce, 0n);
        assert.equal(transfer.amount, 1000000000000000000n);
    });
});
