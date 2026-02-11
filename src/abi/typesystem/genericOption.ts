import * as errors from "../../core/errors";
import { guardValueIsSet } from "../../core/utils";
import { NullType, Type, TypedValue } from "./types";

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

export class OptionValue extends TypedValue {
    static ClassName = "OptionValue";
    private readonly value: TypedValue | null;

    constructor(type: OptionType, value: TypedValue | null = null) {
        super(type);

        if (value !== null && !value.getType().equals(type.getFirstTypeParameter())) {
            throw new errors.ErrInvariantFailed(
                `OptionValue: value type mismatch. Expected: ${type.getFirstTypeParameter().getName()}, got: ${value.getType().getName()}`,
            );
        }

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
