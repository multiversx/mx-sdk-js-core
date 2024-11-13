import { assert } from "chai";
import { ExplicitEnumType, ExplicitEnumValue, ExplicitEnumVariantDefinition } from "./explicit-enum";

describe("test explicit-enums", () => {
    it("should get valueOf()", () => {
        // Define variants
        let greenVariant = new ExplicitEnumVariantDefinition("Green");

        let orangeVariant = new ExplicitEnumVariantDefinition("Orange");

        let yellowVariant = new ExplicitEnumVariantDefinition("Yellow");

        // Define enum type
        let explicitEnumType = new ExplicitEnumType("Colour", [greenVariant, orangeVariant, yellowVariant]);

        // Create enum values
        let green = new ExplicitEnumValue(explicitEnumType, greenVariant);

        // Test valueOf()
        assert.deepEqual(green.valueOf(), { name: "Green" });
    });
});
