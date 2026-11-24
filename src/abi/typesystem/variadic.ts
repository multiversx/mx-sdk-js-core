import * as errors from "../../core/errors";
import { Type, TypeCardinality, TypedValue, TypePlaceholder } from "./types";

export class VariadicType extends Type {
    static ClassName = "VariadicType";
    public readonly isCounted: boolean;

    constructor(typeParameter: Type, isCounted: boolean = false) {
        super("Variadic", [typeParameter], TypeCardinality.variable());
        this.isCounted = isCounted;
    }

    getClassName(): string {
        return VariadicType.ClassName;
    }
}

export class CountedVariadicType extends Type {
    static ClassName = "VariadicType";

    constructor(typeParameter: Type) {
        super("Variadic", [typeParameter], TypeCardinality.variable());
    }

    getClassName(): string {
        return VariadicType.ClassName;
    }
}

/**
 * An abstraction that represents a sequence of values held under the umbrella of a variadic input / output parameter.
 *
 * Since at the time of constructing input parameters or decoding output parameters, the length is known,
 * this TypedValue behaves similar to a List.
 */
export class VariadicValue extends TypedValue {
    static ClassName = "VariadicValue";
    private readonly items: TypedValue[];

    /**
     *
     * @param type the type of this TypedValue (an instance of VariadicType), not the type parameter of the VariadicType
     * @param items the items, having the type type.getFirstTypeParameter()
     */
    constructor(type: VariadicType, items: TypedValue[]) {
        super(type);

        const expectedType = type.getFirstTypeParameter();
        for (let i = 0; i < items.length; i++) {
            if (!items[i].getType().equals(expectedType)) {
                throw new errors.ErrInvariantFailed(
                    `VariadicValue: item[${i}] type mismatch. Expected: ${expectedType.getName()}, got: ${items[i].getType().getName()}`,
                );
            }
        }

        this.items = items;
    }

    getClassName(): string {
        return VariadicValue.ClassName;
    }

    static fromItems(...items: TypedValue[]): VariadicValue {
        return this.createFromItems(items, false);
    }

    static fromItemsCounted(...items: TypedValue[]): VariadicValue {
        return this.createFromItems(items, true);
    }

    private static createFromItems(items: TypedValue[], isCounted: boolean): VariadicValue {
        if (items.length == 0) {
            return new VariadicValue(new VariadicType(new TypePlaceholder(), isCounted), []);
        }

        const typeParameter = items[0].getType();
        return new VariadicValue(new VariadicType(typeParameter, isCounted), items);
    }

    getItems(): ReadonlyArray<TypedValue> {
        return this.items;
    }

    valueOf(): any[] {
        return this.items.map((item) => item.valueOf());
    }

    equals(other: VariadicValue): boolean {
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
