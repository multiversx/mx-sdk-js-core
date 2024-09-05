import BigNumber from "bignumber.js";
import { BigUIntValue, ManagedDecimalType, ManagedDecimalValue, U32Value, U64Value } from "../typesystem";
import { BinaryCodec } from "./binary";
import { bufferToBigInt, cloneBuffer } from "./utils";

export class ManagedDecimalCodec {
    private readonly binaryCodec: BinaryCodec;

    constructor(binaryCodec: BinaryCodec) {
        this.binaryCodec = binaryCodec;
    }

    decodeNested(buffer: Buffer, type: ManagedDecimalType): [ManagedDecimalValue, number] {
        let [bytesValue, length] = this.binaryCodec.decodeNested(buffer, type);
        return [new ManagedDecimalValue(new BigNumber(1), 1), length];
    }

    decodeTopLevel(buffer: Buffer, type: ManagedDecimalType): ManagedDecimalValue {
        let payload = cloneBuffer(buffer);
        let empty = buffer.length == 0;
        if (empty) {
            return new ManagedDecimalValue(new BigNumber(0), 2);
        }

        if (type.getMetadata() == "usize") {
            const u32Size = 4;
            const bigUintSize = buffer.length - u32Size;

            // Read BigUInt (dynamic size)
            const bigUintBuffer = buffer.slice(0, bigUintSize);
            const bigUint = new BigNumber(bigUintBuffer.toString("hex"), 16);

            const u32Offset = bigUintSize;
            const u32 = buffer.readUInt32BE(u32Offset);
            return new ManagedDecimalValue(bigUint, parseInt(u32.toString()));
        }
        let value = bufferToBigInt(payload);
        return new ManagedDecimalValue(value, parseInt(type.getMetadata()));
    }

    encodeNested(value: ManagedDecimalValue): Buffer {
        value.getType().getMetadata();
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
