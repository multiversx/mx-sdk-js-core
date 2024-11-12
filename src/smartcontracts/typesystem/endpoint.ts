import { TypeExpressionParser } from "./typeExpressionParser";
import { Type } from "./types";

const NamePlaceholder = "?";
const DescriptionPlaceholder = "N / A";

export class EndpointDefinition {
    readonly name: string;
    readonly title: string;
    readonly input: EndpointParameterDefinition[] = [];
    readonly output: EndpointParameterDefinition[] = [];
    readonly modifiers: EndpointModifiers;

    constructor(
        name: string,
        input: EndpointParameterDefinition[],
        output: EndpointParameterDefinition[],
        modifiers: EndpointModifiers,
        title?: string,
    ) {
        this.name = name;
        this.title = title || "";
        this.input = input || [];
        this.output = output || [];
        this.modifiers = modifiers;
    }

    isConstructor(): boolean {
        return this.name == "constructor";
    }

    static fromJSON(json: {
        name: string;
        title?: string;
        onlyOwner?: boolean;
        mutability: string;
        payableInTokens: string[];
        inputs: any[];
        outputs: any[];
    }): EndpointDefinition {
        json.name = json.name == null ? NamePlaceholder : json.name;
        json.onlyOwner = json.onlyOwner || false;
        json.title = json.title || "";
        json.payableInTokens = json.payableInTokens || [];
        json.inputs = json.inputs || [];
        json.outputs = json.outputs || [];

        let input = json.inputs.map((param) => EndpointParameterDefinition.fromJSON(param));
        let output = json.outputs.map((param) => EndpointParameterDefinition.fromJSON(param));
        let modifiers = new EndpointModifiers(json.mutability, json.payableInTokens, json.onlyOwner);

        return new EndpointDefinition(json.name, input, output, modifiers, json.title);
    }
}

export class EndpointModifiers {
    readonly mutability: string;
    readonly payableInTokens: string[];
    readonly onlyOwner: boolean;

    constructor(mutability: string, payableInTokens: string[], onlyOwner?: boolean) {
        this.mutability = mutability || "";
        this.payableInTokens = payableInTokens || [];
        this.onlyOwner = onlyOwner || false;
    }

    isPayableInEGLD(): boolean {
        return this.isPayableInToken("EGLD");
    }

    isPayableInToken(token: string) {
        if (this.payableInTokens.includes(token)) {
            return true;
        }

        if (this.payableInTokens.includes(`!${token}`)) {
            return false;
        }

        if (this.payableInTokens.includes("*")) {
            return true;
        }

        return false;
    }

    isPayable() {
        return this.payableInTokens.length != 0;
    }

    isReadonly() {
        return this.mutability == "readonly";
    }

    isOnlyOwner() {
        return this.onlyOwner;
    }
}

export class EndpointParameterDefinition {
    readonly name: string;
    readonly description: string;
    readonly type: Type;

    constructor(name: string, description: string, type: Type) {
        this.name = name;
        this.description = description;
        this.type = type;
    }

    static fromJSON(json: { name?: string; description?: string; type: string }): EndpointParameterDefinition {
        let parsedType = new TypeExpressionParser().parse(json.type);
        return new EndpointParameterDefinition(
            json.name || NamePlaceholder,
            json.description || DescriptionPlaceholder,
            parsedType,
        );
    }
}
