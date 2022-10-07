import { guardLength } from "../../utils";
import { Type, TypeCardinality, TypedValue } from "./types";

export class CompositeType extends Type {
    static ClassName = "CompositeType";

    constructor(...typeParameters: Type[]) {
        super("Composite", typeParameters, TypeCardinality.variable(typeParameters.length));
    }

    getClassName(): string {
        return CompositeType.ClassName;
    }
}

export class CompositeValue extends TypedValue {
    static ClassName = "CompositeValue";
    private readonly items: TypedValue[];

    constructor(type: CompositeType, items: TypedValue[]) {
        super(type);

        guardLength(items, type.getTypeParameters().length);

        // TODO: assert type of each item (wrt. type.getTypeParameters()).

        this.items = items;
    }

    getClassName(): string {
        return CompositeValue.ClassName;
    }

    static fromItems(...items: TypedValue[]): CompositeValue {
        let typeParameters = items.map(value => value.getType());
        let type = new CompositeType(...typeParameters);
        return new CompositeValue(type, items);
    }

    getItems(): ReadonlyArray<TypedValue> {
        return this.items;
    }

    valueOf(): any[] {
        return this.items.map(item => item?.valueOf());
    }

    equals(other: CompositeValue): boolean {
        if (this.getType().differs(other.getType())) {
            return false;
        }

        for (let i = 0; i < this.items.length; i++) {
            let selfItem = this.items[i];
            let otherItem = other.items[i];

            if (!selfItem.equals(otherItem)) {
                return false;
            }
        }

        return true;
    }
}
