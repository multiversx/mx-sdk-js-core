import { TypeFormula } from "../../abi/typeFormula";
import { TypeFormulaParser } from "../../abi/typeFormulaParser";
import { ErrTypingSystem } from "../../core/errors";
import { ArrayVecType } from "./genericArray";
import { Type } from "./types";

/**
 * Parses array type expressions like "array16" into ArrayVecType.
 * @param typeName - The type name to parse (e.g., "array16", "array256")
 * @param typeParameter - The element type for the array
 * @returns ArrayVecType if the typeName matches array pattern, null otherwise
 */
export function parseArrayType(typeName: string, typeParameter: Type): Type | null {
    const arrayMatch = typeName.match(/^array(\d+)$/);

    if (arrayMatch) {
        const length = parseInt(arrayMatch[1], 10);
        return new ArrayVecType(length, typeParameter);
    }

    return null;
}

export class TypeExpressionParser {
    private readonly backingTypeFormulaParser: TypeFormulaParser;

    constructor() {
        this.backingTypeFormulaParser = new TypeFormulaParser();
    }

    parse(expression: string): Type {
        try {
            return this.doParse(expression);
        } catch (e) {
            throw new ErrTypingSystem(`Failed to parse type expression: ${expression}. Error: ${e}`);
        }
    }

    private doParse(expression: string): Type {
        const typeFormula = this.backingTypeFormulaParser.parseExpression(expression);
        const type = this.typeFormulaToType(typeFormula);
        return type;
    }

    private typeFormulaToType(typeFormula: TypeFormula): Type {
        const typeParameters = typeFormula.typeParameters.map((typeFormula) => this.typeFormulaToType(typeFormula));
        return new Type(typeFormula.name, typeParameters, undefined, typeFormula.metadata);
    }
}
