import { guardTrue, guardValueIsSet } from "../../utils";
import { Field, FieldDefinition, Fields } from "./fields";
import { CustomType, TypedValue } from "./types";

const SimpleEnumMaxDiscriminant = 256;

export class EnumType extends CustomType {
    readonly variants: EnumVariantDefinition[] = [];

    constructor(name: string, variants: EnumVariantDefinition[]) {
        super(name);
        this.variants = variants;
    }

    static fromJSON(json: { name: string; variants: any[] }): EnumType {
        let variants = (json.variants || []).map((variant) => EnumVariantDefinition.fromJSON(variant));
        return new EnumType(json.name, variants);
    }

    getVariantByDiscriminant(discriminant: number): EnumVariantDefinition {
        let result = this.variants.find((e) => e.discriminant == discriminant);
        guardValueIsSet("result", result);
        return result!;
    }

    getVariantByName(name: string): EnumVariantDefinition {
        let result = this.variants.find((e) => e.name == name);
        guardValueIsSet("result", result);
        return result!;
    }
}

export class EnumVariantDefinition {
    readonly name: string;
    readonly discriminant: number;
    private readonly fieldsDefinitions: FieldDefinition[] = [];

    constructor(name: string, discriminant: number, fieldsDefinitions: FieldDefinition[] = []) {
        guardTrue(
            discriminant < SimpleEnumMaxDiscriminant,
            `discriminant for simple enum should be less than ${SimpleEnumMaxDiscriminant}`
        );

        this.name = name;
        this.discriminant = discriminant;
        this.fieldsDefinitions = fieldsDefinitions;
    }

    static fromJSON(json: { name: string; discriminant: number; fields: any[] }): EnumVariantDefinition {
        let definitions = (json.fields || []).map((definition) => FieldDefinition.fromJSON(definition));
        return new EnumVariantDefinition(json.name, json.discriminant, definitions);
    }

    getFieldsDefinitions() {
        return this.fieldsDefinitions;
    }
}

export class EnumValue extends TypedValue {
    readonly name: string;
    readonly discriminant: number;
    private readonly fields: Field[] = [];

    constructor(type: EnumType, variant: EnumVariantDefinition, fields: Field[]) {
        super(type);
        this.name = variant.name;
        this.discriminant = variant.discriminant;
        this.fields = fields;

        let definitions = variant.getFieldsDefinitions();
        Fields.checkTyping(this.fields, definitions);
    }

    /**
     * Utility (named constructor) to create a simple (i.e. without fields) enum value.
     */
    static fromName(type: EnumType, name: string): EnumValue {
        let variant = type.getVariantByName(name);
        return new EnumValue(type, variant, []);
    }

    /**
     * Utility (named constructor) to create a simple (i.e. without fields) enum value.
     */
    static fromDiscriminant(type: EnumType, discriminant: number): EnumValue {
        let variant = type.getVariantByDiscriminant(discriminant);
        return new EnumValue(type, variant, []);
    }

    equals(other: EnumValue): boolean {
        if (!this.getType().equals(other.getType())) {
            return false;
        }

        let selfFields = this.getFields();
        let otherFields = other.getFields();

        const nameIsSame = this.name == other.name;
        const discriminantIsSame = this.discriminant == other.discriminant;
        const fieldsAreSame = Fields.equals(selfFields, otherFields);

        return nameIsSame && discriminantIsSame && fieldsAreSame;
    }

    getFields(): ReadonlyArray<Field> {
        return this.fields;
    }

    valueOf() {
        let result: any = { name: this.name, fields: [] };

        this.fields.forEach((field) => (result.fields[field.name] = field.value.valueOf()));

        return result;
    }
}
