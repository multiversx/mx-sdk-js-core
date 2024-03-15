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
            if (this.isPunctuation(token)) {
                if (this.isEndOfTypeParameters(token)) {
                    const typeFormula = this.acquireTypeWithParameters(stack);
                    stack.push(typeFormula);
                } else if (this.isBeginningOfTypeParameters(token)) {
                    // This symbol is pushed as a simple string.
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

        if (item instanceof TypeFormula) {
            return item;
        } else if (typeof item === "string") {
            // Expression contained a simple, non-generic type.
            return new TypeFormula(item, []);
        } else {
            throw new Error(`Unexpected item on stack: ${item}`);
        }
    }

    private tokenizeExpression(expression: string): string[] {
        const tokens: string[] = [];
        let currentToken = "";

        for (const character of expression) {
            if (this.isPunctuation(character)) {
                if (currentToken) {
                    // Retain current token
                    tokens.push(currentToken.trim());
                    // Reset current token
                    currentToken = "";
                }

                // Punctuation character
                tokens.push(character);
            } else {
                currentToken += character;
            }
        }

        if (currentToken) {
            // Retain the last token (if any).
            tokens.push(currentToken.trim());
        }

        return tokens;
    }

    private acquireTypeWithParameters(stack: any[]): TypeFormula {
        const typeParameters = this.acquireTypeParameters(stack);
        const typeName = stack.pop();
        const typeFormula = new TypeFormula(typeName, typeParameters.reverse());
        return typeFormula;
    }

    private acquireTypeParameters(stack: any[]): TypeFormula[] {
        const typeParameters: TypeFormula[] = [];

        while (true) {
            const item = stack.pop();

            if (item === undefined) {
                throw new Error("Badly specified type parameters");
            }

            if (this.isBeginningOfTypeParameters(item)) {
                // We've acquired all type parameters.
                break;
            }

            if (item instanceof TypeFormula) {
                // Type parameter is a previously-acquired type.
                typeParameters.push(item);
            } else if (typeof item === "string") {
                // Type parameter is a simple, non-generic type.
                typeParameters.push(new TypeFormula(item, []));
            } else {
                throw new Error(`Unexpected type parameter object in stack: ${item}`);
            }
        }

        return typeParameters;
    }

    private isPunctuation(token: string): boolean {
        return TypeFormulaParser.PUNCTUATION.includes(token);
    }

    private isEndOfTypeParameters(token: string): boolean {
        return token === TypeFormulaParser.END_TYPE_PARAMETERS;
    }

    private isBeginningOfTypeParameters(token: string): boolean {
        return token === TypeFormulaParser.BEGIN_TYPE_PARAMETERS;
    }
}
