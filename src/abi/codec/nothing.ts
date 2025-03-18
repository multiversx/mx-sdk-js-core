import { NothingValue } from "../typesystem";

export class NothingCodec {
    decodeNested(): [NothingValue, number] {
        return [new NothingValue(), 0];
    }

    decodeTopLevel(): NothingValue {
        return new NothingValue();
    }

    encodeNested(): Buffer {
        return Buffer.from([]);
    }

    encodeTopLevel(): Buffer {
        return Buffer.from([]);
    }
}
