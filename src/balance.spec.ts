import { assert } from "chai";
import { Balance } from "./balance";
import { createBalanceBuilder, Egld } from "./balanceBuilder";
import { Token, TokenType } from "./token";

describe("test balance", () => {
    it("should have desired precision", () => {
        assert.equal(Balance.egld(1).toString(), "1000000000000000000");
        assert.equal(Balance.egld(10).toString(), "10000000000000000000");
        assert.equal(Balance.egld(100).toString(), "100000000000000000000");
        assert.equal(Balance.egld(1000).toString(), "1000000000000000000000");

        assert.equal(Balance.egld(0.1).toString(), "100000000000000000");
        assert.equal(Balance.egld("0.1").toString(), "100000000000000000");

        assert.equal(Balance.egld("0.123456789").toString(), "123456789000000000");
        assert.equal(Balance.egld("0.123456789123456789").toString(), "123456789123456789");
        assert.equal(Balance.egld("0.123456789123456789777").toString(), "123456789123456789");
        assert.equal(Balance.egld("0.123456789123456789777777888888").toString(), "123456789123456789");
    });

    it("should format as currency", () => {
        assert.equal(Balance.egld(0.1).toCurrencyString(), "0.100000000000000000 EGLD");
        assert.equal(Balance.egld(1).toCurrencyString(), "1.000000000000000000 EGLD");
        assert.equal(Balance.egld(10).toCurrencyString(), "10.000000000000000000 EGLD");
        assert.equal(Balance.egld(100).toCurrencyString(), "100.000000000000000000 EGLD");
        assert.equal(Balance.egld(1000).toCurrencyString(), "1000.000000000000000000 EGLD");
        assert.equal(Balance.egld("0.123456789").toCurrencyString(), "0.123456789000000000 EGLD");
        assert.equal(Balance.egld("0.123456789123456789777777888888").toCurrencyString(), "0.123456789123456789 EGLD");
    });

    it("test Egld builder", () => {
        assert.equal(Egld(3.14).toDenominated(), "3.140000000000000000");
        assert.equal(Egld(0.01).toDenominated(), "0.010000000000000000");
        assert.equal(Egld.raw('5000000000000000042').toDenominated(), "5.000000000000000042");
        assert.equal(Egld.raw('1000000000').toDenominated(), "0.000000001000000000");
    });

    it("test USDT builder", () => {
        const USDTToken = createBalanceBuilder(new Token({ identifier: "USDT", name: "USDT", decimals: 6, type: TokenType.Fungible }));
        assert.equal(USDTToken(10).toDenominated(), "10.000000");
        assert.equal(USDTToken(10).toString(), "10000000");
    });
});
