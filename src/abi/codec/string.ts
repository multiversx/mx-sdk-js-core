import { StringValue } from "../typesystem";
import { BytesValue } from "../typesystem/bytes";
import { BytesBinaryCodec } from "./bytes";

export class StringBinaryCodec {
    private readonly bytesBinaryCodec = new BytesBinaryCodec();

    decodeNested(buffer: Buffer): [StringValue, number] {
        let [decoded, length] = this.bytesBinaryCodec.decodeNested(buffer);
        let decodedAsString = new StringValue(decoded.valueOf().toString());
        return [decodedAsString, length];
    }

    decodeTopLevel(buffer: Buffer): StringValue {
        return new StringValue(buffer.toString());
    }

    encodeNested(value: StringValue): Buffer {
        let valueAsBytes = BytesValue.fromUTF8(value.valueOf());
        return this.bytesBinaryCodec.encodeNested(valueAsBytes);
    }

    encodeTopLevel(value: StringValue): Buffer {
        return Buffer.from(value.valueOf());
    }
}
