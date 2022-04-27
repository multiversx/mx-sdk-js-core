import { assert } from "chai";
import { TokenPayment } from "./tokenPayment";

describe("test token payment", () => {
    it("should work with EGLD", () => {
        assert.equal(TokenPayment.egldFromAmount("1").toString(), "1000000000000000000");
        assert.equal(TokenPayment.egldFromAmount("10").toString(), "10000000000000000000");
        assert.equal(TokenPayment.egldFromAmount("100").toString(), "100000000000000000000");
        assert.equal(TokenPayment.egldFromAmount("1000").toString(), "1000000000000000000000");
        assert.equal(TokenPayment.egldFromAmount("0.1").toString(), "100000000000000000");
        assert.equal(TokenPayment.egldFromAmount("0.123456789").toString(), "123456789000000000");
        assert.equal(TokenPayment.egldFromAmount("0.123456789123456789").toString(), "123456789123456789");
        assert.equal(TokenPayment.egldFromAmount("0.123456789123456789777").toString(), "123456789123456789");
        assert.equal(TokenPayment.egldFromAmount("0.123456789123456789777777888888").toString(), "123456789123456789");

        assert.equal(TokenPayment.egldFromAmount(0.1).toPrettyString(), "0.100000000000000000 EGLD");
        assert.equal(TokenPayment.egldFromAmount(1).toPrettyString(), "1.000000000000000000 EGLD");
        assert.equal(TokenPayment.egldFromAmount(10).toPrettyString(), "10.000000000000000000 EGLD");
        assert.equal(TokenPayment.egldFromAmount(100).toPrettyString(), "100.000000000000000000 EGLD");
        assert.equal(TokenPayment.egldFromAmount(1000).toPrettyString(), "1,000.000000000000000000 EGLD");
        assert.equal(TokenPayment.egldFromAmount("0.123456789").toPrettyString(), "0.123456789000000000 EGLD");
        assert.equal(TokenPayment.egldFromAmount("0.123456789123456789777777888888").toPrettyString(), "0.123456789123456789 EGLD");

        assert.equal(TokenPayment.egldFromBigInteger("1").toString(), "1");
        assert.equal(TokenPayment.egldFromBigInteger("1").toPrettyString(), "0.000000000000000001 EGLD");
        assert.isTrue(TokenPayment.egldFromAmount("1").isEgld());
    });

    it("should work with USDC", () => {
        let identifier = "USDC-c76f1f";
        let numDecimals = 6;

        assert.equal(TokenPayment.fungibleFromAmount(identifier, "1", numDecimals).toString(), "1000000");
        assert.equal(TokenPayment.fungibleFromAmount(identifier, "0.1", numDecimals).toString(), "100000");
        assert.equal(TokenPayment.fungibleFromAmount(identifier, "0.123456789", numDecimals).toString(), "123456");
        assert.equal(TokenPayment.fungibleFromBigInteger(identifier, "1000000", numDecimals).toString(), "1000000");
        assert.equal(TokenPayment.fungibleFromBigInteger(identifier, "1000000", numDecimals).toPrettyString(), "1.000000 USDC-c76f1f");
    });

    it("should work with MetaESDT", () => {
        let identifier = "MEXFARML-28d646";
        let numDecimals = 18;
        let nonce = 12345678;

        let tokenPayment = TokenPayment.metaEsdtFromAmount(identifier, nonce, "0.1", numDecimals)
        assert.equal(tokenPayment.tokenIdentifier, identifier);
        assert.equal(tokenPayment.nonce, nonce);
        assert.equal(tokenPayment.toString(), "100000000000000000");
    });

    it("should work with NFTs", () => {
        let identifier = "ERDJS-38f249";
        let nonce = 1;

        let tokenPayment = TokenPayment.nonFungible(identifier, nonce)
        assert.equal(tokenPayment.tokenIdentifier, identifier);
        assert.equal(tokenPayment.nonce, nonce);
        assert.equal(tokenPayment.toPrettyString(), "1 ERDJS-38f249");
    });

    it("should format a pretty string", () => {
        assert.equal(TokenPayment.egldFromAmount(0.1).toPrettyString({ decimalPlaces: 2 }), "0.10 EGLD");
        assert.equal(TokenPayment.egldFromAmount(1).toPrettyString({ decimalPlaces: 2 }), "1.00 EGLD");
        assert.equal(TokenPayment.egldFromAmount(10).toPrettyString({ decimalPlaces: 2 }), "10.00 EGLD");
        assert.equal(TokenPayment.egldFromAmount(100).toPrettyString({ decimalPlaces: 2 }), "100.00 EGLD");
        assert.equal(TokenPayment.egldFromAmount(1000).toPrettyString({ decimalPlaces: 2 }), "1,000.00 EGLD");
        assert.equal(TokenPayment.egldFromAmount("0.123456789").toPrettyString({ decimalPlaces: 4 }), "0.1234 EGLD");
        assert.equal(TokenPayment.fungibleFromBigInteger("USDC-c76f1f", "1000000", 6).toPrettyString({ decimalPlaces: 2, tokenTicker: "USDC" }), "1.00 USDC");
        assert.equal(TokenPayment.fungibleFromBigInteger("FOOBAR-123456", "1000000", 3).toPrettyString({ decimalPlaces: 4, tokenTicker: "FOO" }), "1,000.0000 FOO");
        assert.equal(TokenPayment.nonFungible("ERDJS-38f249", 7).toPrettyString(), "1 ERDJS-38f249");
    });
});
