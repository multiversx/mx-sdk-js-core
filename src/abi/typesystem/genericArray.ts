import { guardLength, guardTrue } from "../../core/utils";
import { CollectionOfTypedValues } from "./collections";
import { Type, TypedValue } from "./types";

// A type for known-length arrays. E.g. "array20", "array32", "array64" etc.
export class ArrayVecType extends Type {
    static ClassName = "ArrayVecType";
    readonly length: number;

    constructor(length: number, typeParameter: Type) {
        super("Array", [typeParameter]);

        guardTrue(length > 0, "array length > 0");
        this.length = length;
    }

    getClassName(): string {
        return ArrayVecType.ClassName;
    }
}

export class ArrayVec extends TypedValue {
    static ClassName = "ArrayVec";
    private readonly backingCollection: CollectionOfTypedValues;

    constructor(type: ArrayVecType, items: TypedValue[]) {
        super(type);
        guardLength(items, type.length);
        this.backingCollection = new CollectionOfTypedValues(items);
    }

    getClassName(): string {
        return ArrayVec.ClassName;
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

    equals(other: ArrayVec): boolean {
        return this.backingCollection.equals(other.backingCollection);
    }
}
