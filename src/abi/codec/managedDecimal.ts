import BigNumber from "bignumber.js";
import { BigUIntType, BigUIntValue, ManagedDecimalType, ManagedDecimalValue, U32Value } from "../typesystem";
import { BinaryCodec } from "./binary";
import { SizeOfU32 } from "./constants";
import { bufferToBigInt } from "./utils";

export class ManagedDecimalCodec {
    private readonly binaryCodec: BinaryCodec;

    constructor(binaryCodec: BinaryCodec) {
        this.binaryCodec = binaryCodec;
    }

    decodeNested(buffer: Buffer, type: ManagedDecimalType): [ManagedDecimalValue, number] {
        let payload: Buffer;
        let length: number = 0;

        if (type.isVariable()) {
            // read biguint value length
            const bigUintSizeBytes = buffer.slice(0, SizeOfU32);
            const bigUintLength = bigUintSizeBytes.readUInt32BE(0);

            length = SizeOfU32 + bigUintLength + SizeOfU32;
            payload = buffer.slice(0, length);
        } else {
            length = buffer.readUInt32BE(0);
            payload = buffer.slice(0, length);
        }

        const result = this.decodeTopLevel(payload, type);
        return [result, length];
    }

    decodeTopLevel(buffer: Buffer, type: ManagedDecimalType): ManagedDecimalValue {
        if (buffer.length === 0) {
            return new ManagedDecimalValue(new BigNumber(0), 0);
        }

        if (type.isVariable()) {
            const bigUintSize = buffer.length - SizeOfU32;

            const [value] = this.binaryCodec.decodeNested(buffer.slice(0, bigUintSize), new BigUIntType());
            const scale = buffer.readUInt32BE(bigUintSize);
            return new ManagedDecimalValue(value.valueOf().shiftedBy(-scale), scale, true);
        }

        const value = bufferToBigInt(buffer);
        const metadata = type.getMetadata();

        // if this code executes, metadata is guaranteed to be a number
        const scale = metadata !== "usize" ? parseInt(metadata.toString()) : 0;
        return new ManagedDecimalValue(value.shiftedBy(-scale), scale, false);
    }

    encodeNested(value: ManagedDecimalValue): Buffer {
        let buffers: Buffer[] = [];
        const rawValue = new BigUIntValue(value.valueOf().shiftedBy(value.getScale()));
        if (value.isVariable()) {
            buffers.push(Buffer.from(this.binaryCodec.encodeNested(rawValue)));
            buffers.push(Buffer.from(this.binaryCodec.encodeNested(new U32Value(value.getScale()))));
        } else {
            buffers.push(this.binaryCodec.encodeTopLevel(rawValue));
        }
        return Buffer.concat(buffers);
    }

    encodeTopLevel(value: ManagedDecimalValue): Buffer {
        return this.encodeNested(value);
    }
}
