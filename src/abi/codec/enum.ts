import { EnumType, U8Type, U8Value, EnumValue, Field } from "../typesystem";
import { BinaryCodec } from "./binary";
import { FieldsBinaryCodec } from "./fields";

export class EnumBinaryCodec {
    private readonly binaryCodec: BinaryCodec;
    private readonly fieldsCodec: FieldsBinaryCodec;

    constructor(binaryCodec: BinaryCodec) {
        this.binaryCodec = binaryCodec;
        this.fieldsCodec = new FieldsBinaryCodec(binaryCodec);
    }

    decodeTopLevel(buffer: Buffer, type: EnumType): EnumValue {
        // This handles enums without fields, with discriminant = 0, as well.
        let [enumValue] = this.decodeNested(buffer, type);
        return enumValue;
    }

    decodeNested(buffer: Buffer, type: EnumType): [EnumValue, number] {
        let [discriminant, lengthOfDiscriminant] = this.readDiscriminant(buffer);
        buffer = buffer.slice(lengthOfDiscriminant);

        let variant = type.getVariantByDiscriminant(discriminant);
        let fieldDefinitions = variant.getFieldsDefinitions();

        let [fields, lengthOfFields]: [Field[], number] = this.fieldsCodec.decodeNested(buffer, fieldDefinitions);
        let enumValue = new EnumValue(type, variant, fields);

        return [enumValue, lengthOfDiscriminant + lengthOfFields];
    }

    private readDiscriminant(buffer: Buffer): [discriminant: number, length: number] {
        let [value, length] = this.binaryCodec.decodeNested(buffer, new U8Type());
        let discriminant = value.valueOf();

        return [discriminant, length];
    }

    encodeNested(enumValue: EnumValue): Buffer {
        let discriminant = new U8Value(enumValue.discriminant);
        let discriminantBuffer = this.binaryCodec.encodeNested(discriminant);

        let fields = enumValue.getFields();
        let fieldsBuffer = this.fieldsCodec.encodeNested(fields);

        return Buffer.concat([discriminantBuffer, fieldsBuffer]);
    }

    encodeTopLevel(enumValue: EnumValue): Buffer {
        let fields = enumValue.getFields();
        let hasFields = fields.length > 0;
        let fieldsBuffer = this.fieldsCodec.encodeNested(fields);

        let discriminant = new U8Value(enumValue.discriminant);
        let discriminantBuffer = hasFields
            ? this.binaryCodec.encodeNested(discriminant)
            : this.binaryCodec.encodeTopLevel(discriminant);

        return Buffer.concat([discriminantBuffer, fieldsBuffer]);
    }
}
