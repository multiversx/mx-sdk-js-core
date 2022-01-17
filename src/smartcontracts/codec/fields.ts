import { Field, FieldDefinition } from "../typesystem";
import { BinaryCodec } from "./binary";

export class FieldsBinaryCodec {
    private readonly binaryCodec: BinaryCodec;

    constructor(binaryCodec: BinaryCodec) {
        this.binaryCodec = binaryCodec;
    }

    decodeNested(buffer: Buffer, fieldDefinitions: FieldDefinition[]): [Field[], number] {
        let fields: Field[] = [];
        let totalLength = 0;

        for (const fieldDefinition of fieldDefinitions) {
            let [decoded, decodedLength] = this.binaryCodec.decodeNested(buffer, fieldDefinition.type);
            buffer = buffer.slice(decodedLength);
            totalLength += decodedLength;

            let field = new Field(decoded, fieldDefinition.name);
            fields.push(field);
        }
        
        return [fields, totalLength];
    }

    encodeNested(fields: ReadonlyArray<Field>): Buffer {
        let buffers: Buffer[] = [];
        
        for (const field of fields) {
            let fieldBuffer = this.binaryCodec.encodeNested(field.value);
            buffers.push(fieldBuffer);
        }

        return Buffer.concat(buffers);
    }
}
