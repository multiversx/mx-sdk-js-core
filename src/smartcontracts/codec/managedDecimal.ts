import BigNumber from "bignumber.js";
import { BigUIntValue, ManagedDecimalType, ManagedDecimalValue, U32Value } from "../typesystem";
import { BinaryCodec } from "./binary";
import { bufferToBigInt } from "./utils";

export class ManagedDecimalCodec {
    private readonly binaryCodec: BinaryCodec;

    constructor(binaryCodec: BinaryCodec) {
        this.binaryCodec = binaryCodec;
    }

    decodeNested(buffer: Buffer, type: ManagedDecimalType): [ManagedDecimalValue, number] {
        const length = buffer.readUInt32BE(0);
        const payload = buffer.slice(0, length);

        const result = this.decodeTopLevel(payload, type);
        const decodedLength = length;

        return [result, decodedLength];
    }

    decodeTopLevel(buffer: Buffer, type: ManagedDecimalType): ManagedDecimalValue {
        if (buffer.length === 0) {
            return new ManagedDecimalValue(new BigNumber(0), 2);
        }

        const isUsize = type.getMetadata() == "usize";

        if (isUsize) {
            const u32Size = 4;
            const bigUintSize = buffer.length - u32Size;

            const bigUint = new BigNumber(buffer.slice(0, bigUintSize).toString("hex"), 16);
            const u32 = buffer.readUInt32BE(bigUintSize);

            return new ManagedDecimalValue(bigUint, u32);
        }

        const value = bufferToBigInt(buffer);
        return new ManagedDecimalValue(value, parseInt(type.getMetadata()));
    }

    encodeNested(value: ManagedDecimalValue): Buffer {
        let buffers: Buffer[] = [];
        if (value.getType().getMetadata() == "usize") {
            buffers.push(Buffer.from(this.binaryCodec.encodeNested(new BigUIntValue(value.valueOf()))));
            buffers.push(Buffer.from(this.binaryCodec.encodeNested(new U32Value(value.getScale()))));
        } else {
            buffers.push(Buffer.from(this.binaryCodec.encodeTopLevel(new BigUIntValue(value.valueOf()))));
        }
        return Buffer.concat(buffers);
    }

    encodeTopLevel(value: ManagedDecimalValue): Buffer {
        return this.encodeNested(value);
    }
}
