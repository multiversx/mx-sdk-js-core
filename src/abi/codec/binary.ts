import * as errors from "../../errors";
import { guardTrue } from "../../utils";
import {
    ArrayVec,
    ArrayVecType,
    EnumType,
    EnumValue,
    ExplicitEnumType,
    ExplicitEnumValue,
    List,
    ManagedDecimalSignedType,
    ManagedDecimalSignedValue,
    ManagedDecimalType,
    ManagedDecimalValue,
    onTypedValueSelect,
    onTypeSelect,
    OptionValue,
    PrimitiveType,
    PrimitiveValue,
    Struct,
    StructType,
    Tuple,
    TupleType,
    Type,
    TypedValue,
} from "../typesystem";
import { ArrayVecBinaryCodec } from "./arrayVec";
import { EnumBinaryCodec } from "./enum";
import { ExplicitEnumBinaryCodec } from "./explicit-enum";
import { ListBinaryCodec } from "./list";
import { ManagedDecimalCodec } from "./managedDecimal";
import { ManagedDecimalSignedCodec } from "./managedDecimalSigned";
import { OptionValueBinaryCodec } from "./option";
import { PrimitiveBinaryCodec } from "./primitive";
import { StructBinaryCodec } from "./struct";
import { TupleBinaryCodec } from "./tuple";

export class BinaryCodec {
    readonly constraints: BinaryCodecConstraints;
    private readonly optionCodec: OptionValueBinaryCodec;
    private readonly listCodec: ListBinaryCodec;
    private readonly arrayCodec: ArrayVecBinaryCodec;
    private readonly primitiveCodec: PrimitiveBinaryCodec;
    private readonly structCodec: StructBinaryCodec;
    private readonly tupleCodec: TupleBinaryCodec;
    private readonly enumCodec: EnumBinaryCodec;
    private readonly explicitEnumCodec: ExplicitEnumBinaryCodec;
    private readonly managedDecimalCodec: ManagedDecimalCodec;
    private readonly managedDecimalSignedCodec: ManagedDecimalSignedCodec;

    constructor(constraints: BinaryCodecConstraints | null = null) {
        this.constraints = constraints || new BinaryCodecConstraints();
        this.optionCodec = new OptionValueBinaryCodec(this);
        this.listCodec = new ListBinaryCodec(this);
        this.arrayCodec = new ArrayVecBinaryCodec(this);
        this.primitiveCodec = new PrimitiveBinaryCodec(this);
        this.structCodec = new StructBinaryCodec(this);
        this.tupleCodec = new TupleBinaryCodec(this);
        this.enumCodec = new EnumBinaryCodec(this);
        this.explicitEnumCodec = new ExplicitEnumBinaryCodec();
        this.managedDecimalCodec = new ManagedDecimalCodec(this);
        this.managedDecimalSignedCodec = new ManagedDecimalSignedCodec(this);
    }

    decodeTopLevel<TResult extends TypedValue = TypedValue>(buffer: Buffer, type: Type): TResult {
        this.constraints.checkBufferLength(buffer);

        let typedValue = onTypeSelect<TypedValue>(type, {
            onOption: () => this.optionCodec.decodeTopLevel(buffer, type.getFirstTypeParameter()),
            onList: () => this.listCodec.decodeTopLevel(buffer, type),
            onArray: () => this.arrayCodec.decodeTopLevel(buffer, <ArrayVecType>type),
            onPrimitive: () => this.primitiveCodec.decodeTopLevel(buffer, <PrimitiveType>type),
            onStruct: () => this.structCodec.decodeTopLevel(buffer, <StructType>type),
            onTuple: () => this.tupleCodec.decodeTopLevel(buffer, <TupleType>type),
            onEnum: () => this.enumCodec.decodeTopLevel(buffer, <EnumType>type),
            onExplicitEnum: () => this.explicitEnumCodec.decodeTopLevel(buffer, <ExplicitEnumType>type),
            onManagedDecimal: () => this.managedDecimalCodec.decodeTopLevel(buffer, <ManagedDecimalType>type),
            onManagedDecimalSigned: () =>
                this.managedDecimalSignedCodec.decodeTopLevel(buffer, <ManagedDecimalSignedType>type),
        });

        return <TResult>typedValue;
    }

    decodeNested<TResult extends TypedValue = TypedValue>(buffer: Buffer, type: Type): [TResult, number] {
        this.constraints.checkBufferLength(buffer);

        let [typedResult, decodedLength] = onTypeSelect<[TypedValue, number]>(type, {
            onOption: () => this.optionCodec.decodeNested(buffer, type.getFirstTypeParameter()),
            onList: () => this.listCodec.decodeNested(buffer, type),
            onArray: () => this.arrayCodec.decodeNested(buffer, <ArrayVecType>type),
            onPrimitive: () => this.primitiveCodec.decodeNested(buffer, <PrimitiveType>type),
            onStruct: () => this.structCodec.decodeNested(buffer, <StructType>type),
            onTuple: () => this.tupleCodec.decodeNested(buffer, <TupleType>type),
            onEnum: () => this.enumCodec.decodeNested(buffer, <EnumType>type),
            onExplicitEnum: () => this.explicitEnumCodec.decodeNested(buffer, <ExplicitEnumType>type),
            onManagedDecimal: () => this.managedDecimalCodec.decodeNested(buffer, <ManagedDecimalType>type),
            onManagedDecimalSigned: () =>
                this.managedDecimalSignedCodec.decodeNested(buffer, <ManagedDecimalSignedType>type),
        });

        return [<TResult>typedResult, decodedLength];
    }

    encodeNested(typedValue: TypedValue): Buffer {
        guardTrue(typedValue.getType().getCardinality().isSingular(), "singular cardinality, thus encodable type");

        return onTypedValueSelect(typedValue, {
            onPrimitive: () => this.primitiveCodec.encodeNested(<PrimitiveValue>typedValue),
            onOption: () => this.optionCodec.encodeNested(<OptionValue>typedValue),
            onList: () => this.listCodec.encodeNested(<List>typedValue),
            onArray: () => this.arrayCodec.encodeNested(<ArrayVec>typedValue),
            onStruct: () => this.structCodec.encodeNested(<Struct>typedValue),
            onTuple: () => this.tupleCodec.encodeNested(<Tuple>typedValue),
            onEnum: () => this.enumCodec.encodeNested(<EnumValue>typedValue),
            onExplicitEnum: () => this.explicitEnumCodec.encodeNested(<ExplicitEnumValue>typedValue),
            onManagedDecimal: () => this.managedDecimalCodec.encodeNested(<ManagedDecimalValue>typedValue),
            onManagedDecimalSigned: () =>
                this.managedDecimalSignedCodec.encodeNested(<ManagedDecimalSignedValue>typedValue),
        });
    }

    encodeTopLevel(typedValue: TypedValue): Buffer {
        guardTrue(typedValue.getType().getCardinality().isSingular(), "singular cardinality, thus encodable type");

        return onTypedValueSelect(typedValue, {
            onPrimitive: () => this.primitiveCodec.encodeTopLevel(<PrimitiveValue>typedValue),
            onOption: () => this.optionCodec.encodeTopLevel(<OptionValue>typedValue),
            onList: () => this.listCodec.encodeTopLevel(<List>typedValue),
            onArray: () => this.arrayCodec.encodeTopLevel(<ArrayVec>typedValue),
            onStruct: () => this.structCodec.encodeTopLevel(<Struct>typedValue),
            onTuple: () => this.tupleCodec.encodeTopLevel(<Tuple>typedValue),
            onEnum: () => this.enumCodec.encodeTopLevel(<EnumValue>typedValue),
            onExplicitEnum: () => this.explicitEnumCodec.encodeTopLevel(<ExplicitEnumValue>typedValue),
            onManagedDecimal: () => this.managedDecimalCodec.encodeTopLevel(<ManagedDecimalValue>typedValue),
            onManagedDecimalSigned: () =>
                this.managedDecimalSignedCodec.encodeTopLevel(<ManagedDecimalSignedValue>typedValue),
        });
    }
}

export class BinaryCodecConstraints {
    maxBufferLength: number;
    maxListLength: number;

    constructor(init?: Partial<BinaryCodecConstraints>) {
        this.maxBufferLength = init?.maxBufferLength || 256000;
        this.maxListLength = init?.maxListLength || 128000;
    }

    checkBufferLength(buffer: Buffer) {
        if (buffer.length > this.maxBufferLength) {
            throw new errors.ErrCodec(`Buffer too large: ${buffer.length} > ${this.maxBufferLength}`);
        }
    }

    /**
     * This constraint avoids computer-freezing decode bugs (e.g. due to invalid ABI or struct definitions).
     */
    checkListLength(length: number) {
        if (length > this.maxListLength) {
            throw new errors.ErrCodec(`List too large: ${length} > ${this.maxListLength}`);
        }
    }
}
