import { Address } from "../../address";
import { IAddress } from "../../interface";
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

    constructor(value: IAddress) {
        super(new AddressType());
        this.value = Address.newFromBech32(value.bech32());
    }

    getClassName(): string {
        return AddressValue.ClassName;
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
