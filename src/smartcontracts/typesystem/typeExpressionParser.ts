import { TypeFormula } from "../../abi/typeFormula";
import { TypeFormulaParser } from "../../abi/typeFormulaParser";
import { ErrTypingSystem } from "../../errors";
import { Type } from "./types";

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
