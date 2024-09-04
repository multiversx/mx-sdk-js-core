import BigNumber from "bignumber.js";
import { BigUIntValue, ManagedDecimalType, ManagedDecimalValue, U64Value } from "../typesystem";
import { BinaryCodec } from "./binary";
import { cloneBuffer } from "./utils";

export class ManagedDecimalCodec {
    private readonly binaryCodec: BinaryCodec;

    constructor(binaryCodec: BinaryCodec) {
        this.binaryCodec = binaryCodec;
    }

    decodeNested(buffer: Buffer, type: ManagedDecimalType): [ManagedDecimalValue, number] {
        let [bytesValue, length] = this.binaryCodec.decodeNested(buffer, type);
        console.log(11111, { bytesValue });
        return [new ManagedDecimalValue(new BigNumber(1), 1), length];
    }

    decodeTopLevel(buffer: Buffer, type: ManagedDecimalType): ManagedDecimalValue {
        let payload = cloneBuffer(buffer);
        let empty = buffer.length == 0;
        if (empty) {
            return new ManagedDecimalValue(new BigNumber(0), type.getScale());
        }

        console.log({ bsc: type });
        const decimalBuff = Buffer.from(this.binaryCodec.encodeTopLevel(new U64Value(type.getScale())));
        const bigUintSize = buffer.length - decimalBuff.length; // Remaining bytes are for BigUInt
        console.log({ buffer, l: buffer.length, d: decimalBuff.length, bigUintSize, decimalBuff, sc: type });

        // Read BigUInt (dynamic size)
        const bigUintBuffer = payload.slice(0, bigUintSize);
        const u64Buffer = payload.slice(bigUintSize, payload.length);
        const bigUint = new BigNumber(bigUintBuffer.toString("hex"), 16);
        console.log({ payload, bigUintBuffer, u64Buffer });
        const u64Value = new U64Value(u64Buffer.toString("hex")).toString();

        console.log({ payload, bigUintBuffer, u64Buffer, u64Value });
        return new ManagedDecimalValue(bigUint, type.getScale());
    }

    encodeNested(value: ManagedDecimalValue): Buffer {
        let buffers: Buffer[] = [];
        buffers.push(Buffer.from(this.binaryCodec.encodeTopLevel(new BigUIntValue(value.valueOf()))));
        return Buffer.concat(buffers);
    }

    encodeTopLevel(value: ManagedDecimalValue): Buffer {
        return this.encodeNested(value);
    }
}
