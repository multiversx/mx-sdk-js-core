import { guardValueIsSet } from "../../utils";
import { CustomType, TypedValue } from "./types";

export class ExplicitEnumType extends CustomType {
    static ClassName = "ExplicitEnumType";
    readonly variants: ExplicitEnumVariantDefinition[] = [];

    constructor(name: string, variants: ExplicitEnumVariantDefinition[]) {
        super(name);
        this.variants = variants;
    }

    getClassName(): string {
        return ExplicitEnumType.ClassName;
    }

    static fromJSON(json: { name: string; variants: any[] }): ExplicitEnumType {
        const variants = json.variants.map((variant) => ExplicitEnumVariantDefinition.fromJSON(variant));
        return new ExplicitEnumType(json.name, variants);
    }

    getVariantByName(name: string): ExplicitEnumVariantDefinition {
        let result = this.variants.find((e) => e.name == name);
        guardValueIsSet(`variant by name (${name})`, result);
        return result!;
    }
}

export class ExplicitEnumVariantDefinition {
    readonly name: string;

    constructor(name: string) {
        this.name = name;
    }

    static fromJSON(json: { name: string }): ExplicitEnumVariantDefinition {
        return new ExplicitEnumVariantDefinition(json.name);
    }
}

export class ExplicitEnumValue extends TypedValue {
    static ClassName = "ExplicitEnumValue";
    readonly name: string;

    constructor(type: ExplicitEnumType, variant: ExplicitEnumVariantDefinition) {
        super(type);
        this.name = variant.name;
    }

    getClassName(): string {
        return ExplicitEnumValue.ClassName;
    }

    /**
     * Utility (named constructor) to create a simple (i.e. without fields) enum value.
     */
    static fromName(type: ExplicitEnumType, name: string): ExplicitEnumValue {
        let variant = type.getVariantByName(name);

        return new ExplicitEnumValue(type, variant);
    }

    equals(other: ExplicitEnumValue): boolean {
        if (!this.getType().equals(other.getType())) {
            return false;
        }

        return this.name == other.name;
    }

    valueOf() {
        return { name: this.name };
    }
}
