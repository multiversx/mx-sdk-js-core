import { TypedValue } from "./types";

export class CollectionOfTypedValues {
    private readonly items: TypedValue[];

    constructor(items: TypedValue[]) {
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

    equals(other: CollectionOfTypedValues): boolean {
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
