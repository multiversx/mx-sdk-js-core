import { TypeExpressionParser } from "./typeExpressionParser";
import { Type } from "./types";

const NamePlaceholder = "?";

export class EventDefinition {
    readonly identifier: string;
    readonly inputs: EventTopicDefinition[] = [];

    constructor(identifier: string, inputs: EventTopicDefinition[]) {
        this.identifier = identifier;
        this.inputs = inputs || [];
    }

    static fromJSON(json: {
        identifier: string,
        inputs: any[]
    }): EventDefinition {
        json.identifier = json.identifier == null ? NamePlaceholder : json.identifier;
        json.inputs = json.inputs || [];

        const inputs = json.inputs.map(param => EventTopicDefinition.fromJSON(param));
        return new EventDefinition(json.identifier, inputs);
    }
}

export class EventTopicDefinition {
    readonly name: string;
    readonly type: Type;

    constructor(name: string, type: Type) {
        this.name = name;
        this.type = type;
    }

    static fromJSON(json: { name?: string, type: string }): EventTopicDefinition {
        let parsedType = new TypeExpressionParser().parse(json.type);
        return new EventTopicDefinition(json.name || NamePlaceholder, parsedType);
    }
}
