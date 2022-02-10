import { PrimitiveType, PrimitiveValue } from "./types";

export class NothingType extends PrimitiveType {
    constructor() {
        super("nothing");
    }
}

export class NothingValue extends PrimitiveValue {
    constructor() {
        super(new NothingType());
    }

    equals(_other: NothingValue): boolean {
        return false;
    }

    valueOf(): any {
        return {};
    }
}
