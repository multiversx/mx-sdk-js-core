import { TypeFormula } from "./typeFormula";

export class TypeFormulaParser {
    static BEGIN_TYPE_PARAMETERS = "<";
    static END_TYPE_PARAMETERS = ">";
    static COMMA = ",";
    static PUNCTUATION = [
        TypeFormulaParser.COMMA,
        TypeFormulaParser.BEGIN_TYPE_PARAMETERS,
        TypeFormulaParser.END_TYPE_PARAMETERS,
    ];

    parseExpression(expression: string): TypeFormula {
        expression = expression.trim();

        const tokens = this.tokenizeExpression(expression).filter((token) => token !== TypeFormulaParser.COMMA);

        const stack: any[] = [];

        for (const token of tokens) {
            if (TypeFormulaParser.PUNCTUATION.includes(token)) {
                if (token === TypeFormulaParser.END_TYPE_PARAMETERS) {
                    const type_parameters: TypeFormula[] = [];

                    while (true) {
                        if (stack.length === 0) {
                            throw new Error("Badly specified type parameters.");
                        }

                        if (stack[stack.length - 1] === TypeFormulaParser.BEGIN_TYPE_PARAMETERS) {
                            break;
                        }

                        let item = stack.pop();
                        let type_formula: TypeFormula;

                        if (item instanceof TypeFormula) {
                            type_formula = item;
                        } else {
                            type_formula = new TypeFormula(item, []);
                        }

                        type_parameters.push(type_formula);
                    }

                    stack.pop(); // pop "<" symbol
                    const type_name = stack.pop();
                    const type_formula = new TypeFormula(type_name, type_parameters.reverse());
                    stack.push(type_formula);
                } else if (token === TypeFormulaParser.BEGIN_TYPE_PARAMETERS) {
                    // The symbol is pushed as a simple string,
                    // as it will never be interpreted, anyway.
                    stack.push(token);
                } else {
                    throw new Error(`Unexpected token (punctuation): ${token}`);
                }
            } else {
                // It's a type name. We push it as a simple string.
                stack.push(token);
            }
        }

        if (stack.length !== 1) {
            throw new Error(`Unexpected stack length at end of parsing: ${stack.length}`);
        }
        if (TypeFormulaParser.PUNCTUATION.includes(stack[0])) {
            throw new Error("Unexpected root element.");
        }

        const item = stack[0];

        if (typeof item === "string") {
            // Expression contained a simple, non-generic type
            return new TypeFormula(item, []);
        } else if (item instanceof TypeFormula) {
            return item;
        } else {
            throw new Error(`Unexpected item on stack: ${item}`);
        }
    }

    private tokenizeExpression(expression: string): string[] {
        const tokens: string[] = [];
        let currentToken = "";

        for (const character of expression) {
            if (!TypeFormulaParser.PUNCTUATION.includes(character)) {
                // Non-punctuation character
                currentToken += character;
            } else {
                if (currentToken) {
                    tokens.push(currentToken.trim());
                    currentToken = "";
                }

                // Punctuation character
                tokens.push(character);
            }
        }

        if (currentToken) {
            tokens.push(currentToken.trim());
        }

        return tokens;
    }
}
