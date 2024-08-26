import BigNumber from "bignumber.js";
import { ManagedDecimalType, ManagedDecimalValue, NumericalValue } from "../typesystem";
import { BytesValue } from "../typesystem/bytes";
import { BinaryCodec } from "./binary";
import { cloneBuffer } from "./utils";

export class ManagedDecimalCodec {
    private readonly binaryCodec: BinaryCodec;

    constructor(binaryCodec: BinaryCodec) {
        this.binaryCodec = binaryCodec;
    }

    decodeNested(buffer: Buffer, type: ManagedDecimalType): [ManagedDecimalValue, number] {
        let [bytesValue, length] = this.binaryCodec.decodeNested(buffer);
        console.log({ bytesValue, length });
        return [new ManagedDecimalValue(new BigNumber(1), 1), length];
    }

    decodeTopLevel(buffer: Buffer, type: ManagedDecimalType): ManagedDecimalValue {
        let payload = cloneBuffer(buffer);

        let empty = buffer.length == 0;
        if (empty) {
            return new ManagedDecimalValue(new BigNumber(0));
        }

        let isPositive = !type.withSign || isMsbZero(payload);
        if (isPositive) {
            let value = bufferToBigInt(payload);
            return new NumericalValue(type, value);
        }

        // Also see: https://github.com/multiversx/mx-components-big-int/blob/master/twos-complement/twos2bigint.go
        flipBufferBitsInPlace(payload);
        let value = bufferToBigInt(payload);
        let negativeValue = value.multipliedBy(new BigNumber(-1));
        let negativeValueMinusOne = negativeValue.minus(new BigNumber(1));

        return new NumericalValue(type, negativeValueMinusOne);
        let bytesValue = this.binaryCodec.decodeTopLevel(buffer);
        console.log({ bytesValue });
        return new ManagedDecimalValue(new BigNumber(1), 1);
    }

    encodeNested(value: ManagedDecimalValue): Buffer {
        let bytesValue = new BytesValue(Buffer.from(value));
        return this.binaryCodec.encodeNested(bytesValue);
    }

    encodeTopLevel(tokenIdentifier: ManagedDecimalValue): Buffer {
        return Buffer.from(tokenIdentifier.valueOf());
    }
}
