import { FieldDefinition, Field, Fields } from "./fields";
import { CustomType, TypedValue } from "./types";

export class StructType extends CustomType {
    readonly fields: FieldDefinition[] = [];

    constructor(name: string, fields: FieldDefinition[]) {
        super(name);
        this.fields = fields;
    }

    static fromJSON(json: { name: string, fields: any[] }): StructType {
        let fields = (json.fields || []).map(field => FieldDefinition.fromJSON(field));
        return new StructType(json.name, fields);
    }
}

// TODO: implement setField(), convenience method.
// TODO: Hold fields in a map (by name), and use the order within "field definitions" to perform codec operations.
export class Struct extends TypedValue {
    private readonly fields: Field[] = [];

    /**
     * Currently, one can only set fields at initialization time. Construction will be improved at a later time.
     */
    constructor(type: StructType, fields: Field[]) {
        super(type);
        this.fields = fields;

        this.checkTyping();
    }

    private checkTyping() {
        let type = <StructType>this.getType();
        let definitions = type.fields;
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
