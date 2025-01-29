import * as errors from "../../core/errors";
import { TypeExpressionParser } from "./typeExpressionParser";
import { Type, TypedValue } from "./types";

export class FieldDefinition {
    readonly name: string;
    readonly description: string;
    readonly type: Type;

    constructor(name: string, description: string, type: Type) {
        this.name = name;
        this.description = description;
        this.type = type;
    }

    static fromJSON(json: { name: string; description: string; type: string }): FieldDefinition {
        let parsedType = new TypeExpressionParser().parse(json.type);
        return new FieldDefinition(json.name, json.description, parsedType);
    }
}

export class Field {
    readonly value: TypedValue;
    readonly name: string;

    constructor(value: TypedValue, name: string = "") {
        this.value = value;
        this.name = name;
    }

    checkTyping(expectedDefinition: FieldDefinition) {
        const actualType: Type = this.value.getType();

        if (!actualType.equals(expectedDefinition.type)) {
            throw new errors.ErrTypingSystem(
                `check type of field "${expectedDefinition.name}; expected: ${expectedDefinition.type}, actual: ${actualType}"`,
            );
        }
        if (this.name != expectedDefinition.name) {
            throw new errors.ErrTypingSystem(`check name of field "${expectedDefinition.name}"`);
        }
    }

    equals(other: Field) {
        return this.name == other.name && this.value.equals(other.value);
    }
}

export class Fields {
    static checkTyping(fields: Field[], definitions: FieldDefinition[]) {
        if (fields.length != definitions.length) {
            throw new errors.ErrTypingSystem("fields length vs. field definitions length");
        }

        for (let i = 0; i < fields.length; i++) {
            let field = fields[i];
            let definition = definitions[i];

            field.checkTyping(definition);
        }
    }

    static equals(actual: ReadonlyArray<Field>, expected: ReadonlyArray<Field>): boolean {
        if (actual.length != expected.length) {
            return false;
        }

        for (let i = 0; i < actual.length; i++) {
            let selfField = actual[i];
            let otherField = expected[i];

            if (!selfField.equals(otherField)) {
                return false;
            }
        }

        return true;
    }

    static getNamesOfTypeDependencies(definitions: FieldDefinition[]): string[] {
        const dependencies: string[] = [];

        for (const definition of definitions) {
            dependencies.push(definition.type.getName());
            dependencies.push(...definition.type.getNamesOfDependencies());
        }

        return [...new Set(dependencies)];
    }
}
