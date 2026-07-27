import * as errors from "../../core/errors";
import { CollectionOfTypedValues } from "./collections";
import { Type, TypedValue, TypePlaceholder } from "./types";

export class ListType extends Type {
    static ClassName = "ListType";

    constructor(typeParameter: Type) {
        super("List", [typeParameter]);
    }

    getClassName(): string {
        return ListType.ClassName;
    }
}

/**
 * A list of typed values.
 */
export class List extends TypedValue {
    static ClassName = "List";
    private readonly backingCollection: CollectionOfTypedValues;

    /**
     * @param type the type of this TypedValue (an instance of ListType), not the type parameter of the ListType
     * @param items the items, having the type type.getFirstTypeParameter()
     */
    constructor(type: ListType, items: TypedValue[]) {
        super(type);

        const expectedType = type.getFirstTypeParameter();
        for (let i = 0; i < items.length; i++) {
            if (!items[i].getType().equals(expectedType)) {
                throw new errors.ErrInvariantFailed(
                    `List: item[${i}] type mismatch. Expected: ${expectedType.getName()}, got: ${items[i].getType().getName()}`,
                );
            }
        }

        this.backingCollection = new CollectionOfTypedValues(items);
    }

    getClassName(): string {
        return List.ClassName;
    }

    static fromItems(items: TypedValue[]): List {
        if (items.length == 0) {
            return new List(new TypePlaceholder(), []);
        }

        let typeParameter = items[0].getType();
        let listType = new ListType(typeParameter);
        return new List(listType, items);
    }

    getLength(): number {
        return this.backingCollection.getLength();
    }

    getItems(): ReadonlyArray<TypedValue> {
        return this.backingCollection.getItems();
    }

    valueOf(): any[] {
        return this.backingCollection.valueOf();
    }

    equals(other: List): boolean {
        return this.backingCollection.equals(other.backingCollection);
    }
}
