import { assert } from "chai";
import { ManagedDecimalType, ManagedDecimalValue } from "./managedDecimal";

describe("test managed decimal", () => {
    it("should get correct metadata set", () => {
        const type = new ManagedDecimalType(8);
        const expectedMetadata = 8;

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
        const firstValue = new ManagedDecimalValue("1", 2, false);
        const secondValue = new ManagedDecimalValue("2", 2, false);
        const expectedMetadata = 2;
        const type = firstValue.getType();

        assert.equal(type.getMetadata(), expectedMetadata);
        assert.isFalse(firstValue.isVariable());
        assert.equal(firstValue.getScale(), 2);
        assert.equal(firstValue.toString(), "1.00");
        assert.isFalse(firstValue.equals(secondValue));
    });

    it("should compare correctly two managed decimals even with different scale", () => {
        const firstValue = new ManagedDecimalValue("1.234", 3, false);
        const secondValue = new ManagedDecimalValue("12.34", 2, false);

        assert.isFalse(firstValue.equals(secondValue));
    });

    it("should compare correctly two managed decimals even with different scale", () => {
        const firstValue = new ManagedDecimalValue("1.234", 3, false);
        const secondValue = new ManagedDecimalValue("1.234", 3, false);

        assert.isTrue(firstValue.equals(secondValue));
    });

    it("should set the correct scale when variable decimals", () => {
        const value = new ManagedDecimalValue("1.3", 2, true);

        assert.isTrue(value.isVariable());
        assert.equal(value.toString(), "1.30");
        assert.equal(value.getScale(), 2);
    });
});
