import { FieldDefinition, Field, Fields } from "./fields";
import { CustomType, TypedValue } from "./types";

export class StructType extends CustomType {
    static ClassName = "StructType";
    private readonly fieldsDefinitions: FieldDefinition[] = [];

    constructor(name: string, fieldsDefinitions: FieldDefinition[]) {
        super(name);
        this.fieldsDefinitions = fieldsDefinitions;
    }

    getClassName(): string {
        return StructType.ClassName;
    }

    static fromJSON(json: { name: string, fields: any[] }): StructType {
        let definitions = (json.fields || []).map(definition => FieldDefinition.fromJSON(definition));
        return new StructType(json.name, definitions);
    }

    getFieldsDefinitions() {
        return this.fieldsDefinitions;
    }
}

// TODO: implement setField(), convenience method.
// TODO: Hold fields in a map (by name), and use the order within "field definitions" to perform codec operations.
export class Struct extends TypedValue {
    static ClassName = "Struct";
    private readonly fields: Field[] = [];

    /**
     * Currently, one can only set fields at initialization time. Construction will be improved at a later time.
     */
    constructor(type: StructType, fields: Field[]) {
        super(type);
        this.fields = fields;

        this.checkTyping();
    }

    getClassName(): string {
        return Struct.ClassName;
    }

    private checkTyping() {
        let type = <StructType>this.getType();
        let definitions = type.getFieldsDefinitions();
        Fields.checkTyping(this.fields, definitions);
    }

    getFields(): ReadonlyArray<Field> {
        return this.fields;
    }

    valueOf(): any {
        let result: any = {};

        for (const field of this.fields) {
            result[field.name] = field.value.valueOf();
        }

        return result;
    }
    
    equals(other: Struct): boolean {
        if (!this.getType().equals(other.getType())) {
            return false;
        }

        let selfFields = this.getFields();
        let otherFields = other.getFields();

        return Fields.equals(selfFields, otherFields);
    }
}
