import { StringValue } from "../typesystem";
import { ExplicitEnumType, ExplicitEnumValue, ExplicitEnumVariantDefinition } from "../typesystem/explicit-enum";
import { StringBinaryCodec } from "./string";

export class ExplicitEnumBinaryCodec {
    private readonly stringCodec: StringBinaryCodec;

    constructor() {
        this.stringCodec = new StringBinaryCodec();
    }

    decodeTopLevel(buffer: Buffer, type: ExplicitEnumType): ExplicitEnumValue {
        const stringValue = this.stringCodec.decodeTopLevel(buffer);
        return new ExplicitEnumValue(type, new ExplicitEnumVariantDefinition(stringValue.valueOf()));
    }

    decodeNested(buffer: Buffer, type: ExplicitEnumType): [ExplicitEnumValue, number] {
        const [value, length] = this.stringCodec.decodeNested(buffer);
        const enumValue = new ExplicitEnumValue(type, new ExplicitEnumVariantDefinition(value.valueOf()));

        return [enumValue, length];
    }

    encodeNested(enumValue: ExplicitEnumValue): Buffer {
        const buffer = this.stringCodec.encodeNested(new StringValue(enumValue.valueOf().name));
        return buffer;
    }

    encodeTopLevel(enumValue: ExplicitEnumValue): Buffer {
        const buffer = this.stringCodec.encodeTopLevel(new StringValue(enumValue.valueOf().name));
        return buffer;
    }
}
