import { Address } from "../../core/address";
import * as errors from "../../core/errors";
import { PrimitiveType, PrimitiveValue } from "./types";

export class AddressType extends PrimitiveType {
    static ClassName = "AddressType";

    constructor() {
        super("Address");
    }

    getClassName(): string {
        return AddressType.ClassName;
    }
}

/**
 * An address fed to or fetched from a Smart Contract contract, as an immutable abstraction.
 */
export class AddressValue extends PrimitiveValue {
    static ClassName = "AddressValue";
    private readonly value: Address;

    constructor(value: Address) {
        super(new AddressType());
        this.value = Address.newFromBech32(value.toBech32());
    }

    getClassName(): string {
        return AddressValue.ClassName;
    }

    /**
     * Creates an AddressValue from various native JavaScript types.
     * @param native - Native value (Address, object with getAddress() or toBech32(), Buffer, or string)
     * @returns AddressValue instance
     * @throws ErrInvalidArgument if conversion fails
     */
    static fromNative(
        native: Address | { getAddress(): Address } | { toBech32(): string } | Buffer | string,
    ): AddressValue {
        if ((<any>native).toBech32) {
            return new AddressValue(<Address>native);
        }
        if ((<any>native).getAddress) {
            return new AddressValue((<any>native).getAddress());
        }

        switch (native.constructor) {
            case Buffer:
            case String:
                return new AddressValue(new Address(<Buffer | string>native));
            default:
                throw new errors.ErrInvalidArgument(`Cannot convert value to AddressValue: ${native}`);
        }
    }

    /**
     * Returns whether two objects have the same value.
     *
     * @param other another AddressValue
     */
    equals(other: AddressValue): boolean {
        return this.value.equals(other.value);
    }

    valueOf(): Address {
        return this.value;
    }
}
