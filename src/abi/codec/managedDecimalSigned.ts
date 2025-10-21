import BigNumber from "bignumber.js";
import { BigIntType, BigIntValue, ManagedDecimalSignedType, ManagedDecimalSignedValue, U32Value } from "../typesystem";
import { BinaryCodec } from "./binary";
import { SizeOfU32 } from "./constants";
import { bufferToBigInt } from "./utils";

export class ManagedDecimalSignedCodec {
    private readonly binaryCodec: BinaryCodec;

    constructor(binaryCodec: BinaryCodec) {
        this.binaryCodec = binaryCodec;
    }

    decodeNested(buffer: Buffer, type: ManagedDecimalSignedType): [ManagedDecimalSignedValue, number] {
        let payload: Buffer;
        let length: number;

        if (type.isVariable()) {
            // read BigInt value length
            const bigIntSizeBytes = buffer.slice(0, SizeOfU32);
            const bigIntLength = bigIntSizeBytes.readUInt32BE(0);

            length = SizeOfU32 + bigIntLength + SizeOfU32;
            payload = buffer.slice(0, length);
        } else {
            length = buffer.readUInt32BE(0);
            payload = buffer.slice(0, length);
        }

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

            return new ManagedDecimalSignedValue(value.valueOf().shiftedBy(-scale), scale, true);
        }

        const value = bufferToBigInt(buffer);
        const metadata = type.getMetadata();

        // if this code executes, metadata is guaranteed to be a number
        const scale = metadata !== "usize" ? parseInt(metadata.toString()) : 0;
        return new ManagedDecimalSignedValue(value.shiftedBy(-scale), scale, false);
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
