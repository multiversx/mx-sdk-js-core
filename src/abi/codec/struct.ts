import { StructType, Struct, Field } from "../typesystem";
import { BinaryCodec } from "./binary";
import { FieldsBinaryCodec } from "./fields";

export class StructBinaryCodec {
    private readonly fieldsCodec: FieldsBinaryCodec;

    constructor(binaryCodec: BinaryCodec) {
        this.fieldsCodec = new FieldsBinaryCodec(binaryCodec);
    }

    decodeTopLevel(buffer: Buffer, type: StructType): Struct {
        let [decoded] = this.decodeNested(buffer, type);
        return decoded;
    }

    decodeNested(buffer: Buffer, type: StructType): [Struct, number] {
        let fieldDefinitions = type.getFieldsDefinitions();
        let [fields, offset]: [Field[], number] = this.fieldsCodec.decodeNested(buffer, fieldDefinitions);
        let struct = new Struct(type, fields);
        return [struct, offset];
    }

    encodeNested(struct: Struct): Buffer {
        let fields = struct.getFields();
        let buffer = this.fieldsCodec.encodeNested(fields);
        return buffer;
    }

    encodeTopLevel(struct: Struct): Buffer {
        return this.encodeNested(struct);
    }
}
