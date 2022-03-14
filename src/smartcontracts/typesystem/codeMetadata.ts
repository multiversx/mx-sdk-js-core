import { CodeMetadata } from "../codeMetadata";
import { PrimitiveType, PrimitiveValue } from "./types";

export class CodeMetadataType extends PrimitiveType {
    constructor() {
        super("CodeMetadata");
    }
}

export class CodeMetadataValue extends PrimitiveValue {
    private readonly value: CodeMetadata;

    constructor(value: CodeMetadata) {
        super(new CodeMetadataType());
        this.value = value;
    }

    equals(other: CodeMetadataValue): boolean {
        return this.value.equals(other.value);
    }

    valueOf(): CodeMetadata {
        return this.value;
    }
}
