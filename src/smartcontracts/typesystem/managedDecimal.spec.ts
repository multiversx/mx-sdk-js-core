import { assert } from "chai";
import { ManagedDecimalType, ManagedDecimalValue } from "./managedDecimal";
import BigNumber from "bignumber.js";

describe("test managed decimal", () => {
    it("should get correct metadata set", () => {
        let type = new ManagedDecimalType("8");
        const expectedMetadata = "8";

        assert.equal(type.getMetadata(), expectedMetadata);
        assert.isFalse(type.isVariable());
    });

    it("should get correct metadata set when variable", () => {
        let type = new ManagedDecimalType("usize");
        const expectedMetadata = "usize";

        assert.equal(type.getMetadata(), expectedMetadata);
        assert.isTrue(type.isVariable());
    });

    it("should return the expected values for scale and metadata", () => {
        let firstValue = new ManagedDecimalValue(new BigNumber(1), 2, false);
        let secondValue = new ManagedDecimalValue(new BigNumber(2), 2, false);
        const expectedMetadata = "2";
        const type = firstValue.getType() as ManagedDecimalType;

        assert.equal(type.getMetadata(), expectedMetadata);
        assert.isFalse(type.isVariable());
        assert.equal(firstValue.getScale(), 2);
        assert.equal(firstValue.toString(), "1.00");
        assert.isFalse(firstValue.equals(secondValue));
    });

    it("should compare correctly two managed decimals even with different scale", () => {
        let firstValue = new ManagedDecimalValue(new BigNumber(1.234), 3, false);
        let secondValue = new ManagedDecimalValue(new BigNumber(12.34), 2, false);

        assert.isFalse(firstValue.equals(secondValue));
    });

    it("should set the correct scale when variable decimals", () => {
        let value = new ManagedDecimalValue(new BigNumber(1.3), 2, true);
        const expectedMetadata = "usize";
        const type = value.getType() as ManagedDecimalType;

        assert.equal(type.getMetadata(), expectedMetadata);
        assert.isTrue(type.isVariable());
        assert.equal(value.toString(), "1.30");
        assert.equal(value.getScale(), 2);
    });
});
