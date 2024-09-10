import BigNumber from "bignumber.js";
import { BigUIntValue, ManagedDecimalType, ManagedDecimalValue, U32Value } from "../typesystem";
import { BinaryCodec } from "./binary";
import { bufferToBigInt } from "./utils";
import { SizeOfU32 } from "./constants";

export class ManagedDecimalCodec {
    private readonly binaryCodec: BinaryCodec;

    constructor(binaryCodec: BinaryCodec) {
        this.binaryCodec = binaryCodec;
    }

    decodeNested(buffer: Buffer, type: ManagedDecimalType): [ManagedDecimalValue, number] {
        const length = buffer.readUInt32BE(0);
        const payload = buffer.slice(0, length);

        const result = this.decodeTopLevel(payload, type);
        return [result, length];
    }

    decodeTopLevel(buffer: Buffer, type: ManagedDecimalType): ManagedDecimalValue {
        if (buffer.length === 0) {
            return new ManagedDecimalValue(new BigNumber(0), 0);
        }

        if (type.isVariable()) {
            const bigUintSize = buffer.length - SizeOfU32;

            const value = new BigNumber(buffer.slice(0, bigUintSize).toString("hex"), 16);
            const scale = buffer.readUInt32BE(bigUintSize);

            return new ManagedDecimalValue(value, scale);
        }

        const value = bufferToBigInt(buffer);
        const metadata = type.getMetadata();
        const scale = typeof metadata === "number" ? metadata : 0;
        return new ManagedDecimalValue(value, scale);
    }

    encodeNested(value: ManagedDecimalValue): Buffer {
        let buffers: Buffer[] = [];
        if (value.isVariable()) {
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
