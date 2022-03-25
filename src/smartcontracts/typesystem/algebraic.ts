import { guardValueIsSet } from "../../utils";
import { Type, TypeCardinality, TypedValue } from "./types";

/**
 * An optional is an algebraic type. It holds zero or one values.
 */
export class OptionalType extends Type {
    static ClassName = "OptionalType";

    constructor(typeParameter: Type) {
        super("Optional", [typeParameter], TypeCardinality.variable(1));
    }

    getClassName(): string {
        return OptionalType.ClassName;
    }
}

export class OptionalValue extends TypedValue {
    static ClassName = "OptionalValue";
    private readonly value: TypedValue | null;

    constructor(type: OptionalType, value: TypedValue | null = null) {
        super(type);

        // TODO: assert value is of type type.getFirstTypeParameter()

        this.value = value;
    }

    getClassName(): string {
        return OptionalValue.ClassName;
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

    equals(other: OptionalValue): boolean {
        return this.value?.equals(other.value) || false;
    }
}
