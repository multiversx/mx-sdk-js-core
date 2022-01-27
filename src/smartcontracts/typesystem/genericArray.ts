import { guardLength, guardTrue, guardValueIsSet } from "../..";
import { Type, TypedValue, TypePlaceholder } from "./types";

// A type for known-length arrays. E.g. "array20", "array32", "array64" etc.
export class ArrayVecType extends Type {
    readonly length: number;

    constructor(length: number, typeParameter: Type) {
        super("Array", [typeParameter]);

        guardTrue(length > 0, "array length > 0");
        this.length = length;
    }
}

export class ArrayVec extends TypedValue {
    private readonly items: TypedValue[];

    constructor(type: ArrayVecType, items: TypedValue[]) {
        super(type);

        guardLength(items, type.length);

        this.items = items;
    }

    getLength(): number {
        return this.items.length;
    }

    getItems(): ReadonlyArray<TypedValue> {
        return this.items;
    }

    valueOf(): any[] {
        return this.items.map((item) => item.valueOf());
    }

    equals(other: ArrayVec): boolean {
        if (this.getLength() != other.getLength()) {
            return false;
        }

        for (let i = 0; i < this.getLength(); i++) {
            let selfItem = this.items[i];
            let otherItem = other.items[i];

            if (!selfItem.equals(otherItem)) {
                return false;
            }
        }

        return true;
    }
}
