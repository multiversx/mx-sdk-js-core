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
    readonly indexed: boolean;

    constructor(options: { name: string, type: Type, indexed: boolean }) {
        this.name = options.name;
        this.type = options.type;
        this.indexed = options.indexed;
    }

    static fromJSON(json: { name?: string, type: string, indexed: boolean }): EventTopicDefinition {
        const parsedType = new TypeExpressionParser().parse(json.type);

        return new EventTopicDefinition({
            name: json.name || NamePlaceholder,
            type: parsedType,
            indexed: json.indexed
        });
    }
}
