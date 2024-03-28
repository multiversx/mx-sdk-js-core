import { guardValueIsSet } from "../../utils";
import { CollectionOfTypedValues } from "./collections";
import { Type, TypedValue, NullType, TypePlaceholder } from "./types";

// TODO: Move to a new file, "genericOption.ts"
export class OptionType extends Type {
    static ClassName = "OptionType";

    constructor(typeParameter: Type) {
        super("Option", [typeParameter]);
    }

    getClassName(): string {
        return OptionType.ClassName;
    }

    isAssignableFrom(type: Type): boolean {
        if (!type.hasExactClass(OptionType.ClassName)) {
            return false;
        }

        let invariantTypeParameters = this.getFirstTypeParameter().equals(type.getFirstTypeParameter());
        let fakeCovarianceToNull = type.getFirstTypeParameter().hasExactClass(NullType.ClassName);
        return invariantTypeParameters || fakeCovarianceToNull;
    }
}

// TODO: Move to a new file, "genericList.ts"
export class ListType extends Type {
    static ClassName = "ListType";

    constructor(typeParameter: Type) {
        super("List", [typeParameter]);
    }

    getClassName(): string {
        return ListType.ClassName;
    }
}

// TODO: Move to a new file, "genericOption.ts"
export class OptionValue extends TypedValue {
    static ClassName = "OptionValue";
    private readonly value: TypedValue | null;

    constructor(type: OptionType, value: TypedValue | null = null) {
        super(type);

        // TODO: assert value is of type type.getFirstTypeParameter()

        this.value = value;
    }

    getClassName(): string {
        return OptionValue.ClassName;
    }

    /**
     * Creates an OptionValue, as a missing option argument.
     */
    static newMissing(): OptionValue {
        let type = new OptionType(new NullType());
        return new OptionValue(type);
    }

    static newMissingTyped(type: Type): OptionValue {
        return new OptionValue(new OptionType(type));
    }

    /**
     * Creates an OptionValue, as a provided option argument.
     */
    static newProvided(typedValue: TypedValue): OptionValue {
        let type = new OptionType(typedValue.getType());
        return new OptionValue(type, typedValue);
    }

    isSet(): boolean {
        return this.value ? true : false;
    }

    getTypedValue(): TypedValue {
        guardValueIsSet("value", this.value);
        return this.value!;
    }

    valueOf(): any {
        return this.value ? this.value.valueOf() : null;
    }

    equals(other: OptionValue): boolean {
        return this.value?.equals(other.value) || false;
    }
}

// TODO: Move to a new file, "genericList.ts"
// TODO: Rename to ListValue, for consistency (though the term is slighly unfortunate).
// Question for review: or not?
export class List extends TypedValue {
    static ClassName = "List";
    private readonly backingCollection: CollectionOfTypedValues;

    /**
     *
     * @param type the type of this TypedValue (an instance of ListType), not the type parameter of the ListType
     * @param items the items, having the type type.getFirstTypeParameter()
     */
    constructor(type: ListType, items: TypedValue[]) {
        super(type);

        // TODO: assert items are of type type.getFirstTypeParameter()

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
