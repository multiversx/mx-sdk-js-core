import { PrimitiveType, PrimitiveValue } from "./types";

export class NothingType extends PrimitiveType {
    static ClassName = "NothingType";

    constructor() {
        super("nothing");
    }

    getClassName(): string {
        return NothingType.ClassName;
    }
}

export class NothingValue extends PrimitiveValue {
    static ClassName = "NothingValue";

    constructor() {
        super(new NothingType());
    }

    getClassName(): string {
        return NothingValue.ClassName;
    }

    equals(_other: NothingValue): boolean {
        return false;
    }

    valueOf(): any {
        return {};
    }
}
