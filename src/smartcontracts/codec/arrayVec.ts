import { TypedValue, ArrayVec, ArrayVecType } from "../typesystem";
import { BinaryCodec } from "./binary";

export class ArrayVecBinaryCodec {
    private readonly binaryCodec: BinaryCodec;

    constructor(binaryCodec: BinaryCodec) {
        this.binaryCodec = binaryCodec;
    }

    decodeNested(buffer: Buffer, type: ArrayVecType): [ArrayVec, number] {
        let arrayLength = type.length;
        let typeParameter = type.getFirstTypeParameter();
        let result: TypedValue[] = [];
        let totalLength = 0;

        for (let i = 0; i < arrayLength; i++) {
            let [decoded, decodedLength] = this.binaryCodec.decodeNested(buffer, typeParameter);
            result.push(decoded);
            totalLength += decodedLength;
            buffer = buffer.slice(decodedLength);
        }

        return [new ArrayVec(type, result), totalLength];
    }

    decodeTopLevel(buffer: Buffer, type: ArrayVecType): ArrayVec {
        let [result, _] = this.decodeNested(buffer, type);
        return result;
    }

    encodeNested(array: ArrayVec): Buffer {
        let itemsBuffers: Buffer[] = [];

        for (const item of array.getItems()) {
            let itemBuffer = this.binaryCodec.encodeNested(item);
            itemsBuffers.push(itemBuffer);
        }

        return Buffer.concat(itemsBuffers);
    }

    encodeTopLevel(array: ArrayVec): Buffer {
        return this.encodeNested(array);
    }
}
