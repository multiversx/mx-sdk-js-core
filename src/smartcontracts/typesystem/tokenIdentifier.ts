import { PrimitiveType, PrimitiveValue } from "./types";

export class TokenIdentifierType extends PrimitiveType {
    static ClassName = "TokenIdentifierType";

    constructor() {
        super("TokenIdentifier");
    }

    getClassName(): string {
        return TokenIdentifierType.ClassName;
    }
}

export class TokenIdentifierValue extends PrimitiveValue {
    static ClassName = "TokenIdentifierValue";
    private readonly value: string;

    constructor(value: string) {
        super(new TokenIdentifierType());
        this.value = value;
    }

    getClassName(): string {
        return TokenIdentifierValue.ClassName;
    }

    getLength(): number {
        return this.value.length;
    }

    /**
     * Returns whether two objects have the same value.
     */
    equals(other: TokenIdentifierValue): boolean {
        if (this.getLength() != other.getLength()) {
            return false;
        }
        
        return this.value == other.value;
    }

    valueOf(): string {
        return this.value;
    }

    toString(): string {
        return this.value.toString();
    }
}
