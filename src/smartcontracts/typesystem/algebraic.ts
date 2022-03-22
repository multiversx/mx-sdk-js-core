import { guardValueIsSet } from "../../utils";
import { NullType, Type, TypeCardinality, TypedValue } from "./types";

/**
 * An optional is an algebraic type. It holds zero or one values.
 */
export class OptionalType extends Type {
    constructor(typeParameter: Type) {
        super("Optional", [typeParameter], TypeCardinality.variable(1));
    }

    isAssignableFrom(type: Type): boolean {
        if (!(type.hasJavascriptConstructor(OptionalType.name))) {
            return false;
        }

        let invariantTypeParameters = this.getFirstTypeParameter().equals(type.getFirstTypeParameter());
        let fakeCovarianceToNull = type.getFirstTypeParameter().hasJavascriptConstructor(NullType.name);
        return invariantTypeParameters || fakeCovarianceToNull;
    }
}

export class OptionalValue extends TypedValue {
    private readonly value: TypedValue | null;

    constructor(type: OptionalType, value: TypedValue | null = null) {
        super(type);

        // TODO: assert value is of type type.getFirstTypeParameter()

        this.value = value;
    }

    /**
     * Creates an OptionalValue, as not provided (missing).
     */
    static newMissing(): OptionalValue {
        let type = new OptionalType(new NullType());
        return new OptionalValue(type);
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
