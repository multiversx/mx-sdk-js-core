import { ErrMissingFieldOnStruct, ErrTypingSystem } from "../../errors";
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

    getFieldsDefinitions(): FieldDefinition[] {
        return this.fieldsDefinitions;
    }

    getFieldDefinition(name: string): FieldDefinition | undefined {
        return this.fieldsDefinitions.find(item => item.name == name);
    }

    getNamesOfDependencies(): string[] {
        return Fields.getNamesOfTypeDependencies(this.fieldsDefinitions);
    }
}

export class Struct extends TypedValue {
    static ClassName = "Struct";
    private readonly fields: Field[];
    private readonly fieldsByName: Map<string, Field>;

    /**
     * One can only set fields at initialization time.
     */
    constructor(type: StructType, fields: Field[]) {
        super(type);
        this.fields = fields;
        this.fieldsByName = new Map(fields.map(field => [field.name, field]));

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

    getFieldValue(name: string): any {
        let field = this.fieldsByName.get(name);
        if (field) {
            return field.value.valueOf();
        }

        throw new ErrMissingFieldOnStruct(name, this.getType().getName());
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
