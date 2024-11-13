import * as errors from "../../errors";
import { assert } from "chai";
import { U8Type, U8Value } from "./numerical";
import { Field, FieldDefinition } from "./fields";
import { EnumType, EnumValue, EnumVariantDefinition } from "./enum";
import { StringType, StringValue } from "./string";
import BigNumber from "bignumber.js";

describe("test enums", () => {
    it("should get fields", () => {
        let greenVariant = new EnumVariantDefinition("Green", 0, [
            new FieldDefinition("0", "red component", new U8Type()),
            new FieldDefinition("1", "green component", new U8Type()),
            new FieldDefinition("2", "blue component", new U8Type()),
        ]);

        let orangeVariant = new EnumVariantDefinition("Orange", 1, [
            new FieldDefinition("0", "hex code", new StringType()),
        ]);

        let enumType = new EnumType("Colour", [greenVariant, orangeVariant]);

        let green = new EnumValue(enumType, greenVariant, [
            new Field(new U8Value(0), "0"),
            new Field(new U8Value(255), "1"),
            new Field(new U8Value(0), "2"),
        ]);

        let orange = new EnumValue(enumType, orangeVariant, [new Field(new StringValue("#FFA500"), "0")]);

        assert.lengthOf(green.getFields(), 3);
        assert.lengthOf(orange.getFields(), 1);
        assert.deepEqual(green.getFieldValue("0").toNumber(), 0);
        assert.deepEqual(green.getFieldValue("1").toNumber(), 255);
        assert.deepEqual(green.getFieldValue("2").toNumber(), 0);
        assert.deepEqual(orange.getFieldValue("0"), "#FFA500");
        assert.throw(() => green.getFieldValue("3"), errors.ErrMissingFieldOnEnum);
        assert.throw(() => orange.getFieldValue("1"), errors.ErrMissingFieldOnEnum);
    });

    it("should get valueOf()", () => {
        // Define variants
        let greenVariant = new EnumVariantDefinition("Green", 0, [
            new FieldDefinition("0", "red component", new U8Type()),
            new FieldDefinition("1", "green component", new U8Type()),
            new FieldDefinition("2", "blue component", new U8Type()),
        ]);

        let orangeVariant = new EnumVariantDefinition("Orange", 1, [
            new FieldDefinition("0", "hex code", new StringType()),
        ]);

        let yellowVariant = new EnumVariantDefinition("Yellow", 2, [
            new FieldDefinition("red", "red component", new U8Type()),
            new FieldDefinition("green", "green component", new U8Type()),
            new FieldDefinition("blue", "blue component", new U8Type()),
        ]);

        // Define enum type
        let enumType = new EnumType("Colour", [greenVariant, orangeVariant, yellowVariant]);

        // Create enum values
        let green = new EnumValue(enumType, greenVariant, [
            new Field(new U8Value(0), "0"),
            new Field(new U8Value(255), "1"),
            new Field(new U8Value(0), "2"),
        ]);

        let orange = new EnumValue(enumType, orangeVariant, [new Field(new StringValue("#FFA500"), "0")]);

        let yellow = new EnumValue(enumType, yellowVariant, [
            new Field(new U8Value(255), "red"),
            new Field(new U8Value(255), "green"),
            new Field(new U8Value(0), "blue"),
        ]);

        // Test valueOf()
        assert.deepEqual(green.valueOf(), {
            name: "Green",
            fields: [new BigNumber(0), new BigNumber(255), new BigNumber(0)],
        });

        assert.deepEqual(orange.valueOf(), {
            name: "Orange",
            fields: ["#FFA500"],
        });

        assert.deepEqual(yellow.valueOf(), {
            name: "Yellow",
            fields: [new BigNumber(255), new BigNumber(255), new BigNumber(0)],
        });
    });
});
