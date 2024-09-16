import BigNumber from "bignumber.js";
import { BigIntType, BigIntValue, ManagedDecimalSignedType, ManagedDecimalSignedValue, U32Value } from "../typesystem";
import { BinaryCodec } from "./binary";
import { bufferToBigInt } from "./utils";
import { SizeOfU32 } from "./constants";

export class ManagedDecimalSignedCodec {
    private readonly binaryCodec: BinaryCodec;

    constructor(binaryCodec: BinaryCodec) {
        this.binaryCodec = binaryCodec;
    }

    decodeNested(buffer: Buffer, type: ManagedDecimalSignedType): [ManagedDecimalSignedValue, number] {
        const length = buffer.readUInt32BE(0);
        const payload = buffer.slice(0, length);

        const result = this.decodeTopLevel(payload, type);
        return [result, length];
    }

    decodeTopLevel(buffer: Buffer, type: ManagedDecimalSignedType): ManagedDecimalSignedValue {
        if (buffer.length === 0) {
            return new ManagedDecimalSignedValue(new BigNumber(0), 0);
        }

        if (type.isVariable()) {
            const bigintSize = buffer.length - SizeOfU32;

            const [value] = this.binaryCodec.decodeNested(buffer.slice(0, bigintSize), new BigIntType());
            const scale = buffer.readUInt32BE(bigintSize);

            return new ManagedDecimalSignedValue(value.valueOf().shiftedBy(-scale), scale);
        }

        const value = bufferToBigInt(buffer);
        const metadata = type.getMetadata();
        const scale = metadata !== "usize" ? parseInt(metadata.toString()) : 0;
        return new ManagedDecimalSignedValue(value.shiftedBy(-scale), scale);
    }

    encodeNested(value: ManagedDecimalSignedValue): Buffer {
        let buffers: Buffer[] = [];
        const rawValue = new BigIntValue(value.valueOf().shiftedBy(value.getScale()));
        if (value.isVariable()) {
            buffers.push(Buffer.from(this.binaryCodec.encodeNested(rawValue)));
            buffers.push(Buffer.from(this.binaryCodec.encodeNested(new U32Value(value.getScale()))));
        } else {
            buffers.push(Buffer.from(this.binaryCodec.encodeTopLevel(rawValue)));
        }
        return Buffer.concat(buffers);
    }

    encodeTopLevel(value: ManagedDecimalSignedValue): Buffer {
        return this.encodeNested(value);
    }
}
