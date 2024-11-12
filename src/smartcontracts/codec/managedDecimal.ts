import BigNumber from "bignumber.js";
import { BigUIntType, BigUIntValue, ManagedDecimalType, ManagedDecimalValue, U32Value } from "../typesystem";
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

            const [value] = this.binaryCodec.decodeNested(buffer.slice(0, bigUintSize), new BigUIntType());
            const scale = buffer.readUInt32BE(bigUintSize);
            return new ManagedDecimalValue(value.valueOf().shiftedBy(-scale), scale);
        }

        const value = bufferToBigInt(buffer);
        const metadata = type.getMetadata();
        const scale = metadata !== "usize" ? parseInt(metadata.toString()) : 0;
        return new ManagedDecimalValue(value.shiftedBy(-scale), scale);
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
