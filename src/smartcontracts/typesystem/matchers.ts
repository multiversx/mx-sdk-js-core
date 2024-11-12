import * as errors from "../../errors";
import { AddressType, AddressValue } from "./address";
import { BooleanType, BooleanValue } from "./boolean";
import { BytesType, BytesValue } from "./bytes";
import { CodeMetadataType, CodeMetadataValue } from "./codeMetadata";
import { EnumType, EnumValue } from "./enum";
import { ExplicitEnumType, ExplicitEnumValue } from "./explicit-enum";
import { List, ListType, OptionType, OptionValue } from "./generic";
import { ArrayVec, ArrayVecType } from "./genericArray";
import { H256Type, H256Value } from "./h256";
import { ManagedDecimalType, ManagedDecimalValue } from "./managedDecimal";
import { ManagedDecimalSignedType, ManagedDecimalSignedValue } from "./managedDecimalSigned";
import { NothingType, NothingValue } from "./nothing";
import { NumericalType, NumericalValue } from "./numerical";
import { StringType, StringValue } from "./string";
import { Struct, StructType } from "./struct";
import { TokenIdentifierType, TokenIdentifierValue } from "./tokenIdentifier";
import { Tuple, TupleType } from "./tuple";
import { PrimitiveType, PrimitiveValue, Type, TypedValue } from "./types";

// TODO: Extend functionality or rename wrt. restricted / reduced functionality (not all types are handled: composite, variadic).
export function onTypeSelect<TResult>(
    type: Type,
    selectors: {
        onOption: () => TResult;
        onList: () => TResult;
        onArray: () => TResult;
        onPrimitive: () => TResult;
        onStruct: () => TResult;
        onTuple: () => TResult;
        onEnum: () => TResult;
        onExplicitEnum: () => TResult;
        onManagedDecimal: () => TResult;
        onManagedDecimalSigned: () => TResult;
        onOther?: () => TResult;
    },
): TResult {
    if (type.hasExactClass(OptionType.ClassName)) {
        return selectors.onOption();
    }
    if (type.hasExactClass(ListType.ClassName)) {
        return selectors.onList();
    }
    if (type.hasExactClass(ArrayVecType.ClassName)) {
        return selectors.onArray();
    }
    if (type.hasClassOrSuperclass(PrimitiveType.ClassName)) {
        return selectors.onPrimitive();
    }
    if (type.hasExactClass(StructType.ClassName)) {
        return selectors.onStruct();
    }
    if (type.hasExactClass(TupleType.ClassName)) {
        return selectors.onTuple();
    }
    if (type.hasExactClass(EnumType.ClassName)) {
        return selectors.onEnum();
    }
    if (type.hasExactClass(ExplicitEnumType.ClassName)) {
        return selectors.onExplicitEnum();
    }

    if (type.hasExactClass(ManagedDecimalType.ClassName)) {
        return selectors.onManagedDecimal();
    }

    if (type.hasExactClass(ManagedDecimalSignedType.ClassName)) {
        return selectors.onManagedDecimalSigned();
    }

    if (selectors.onOther) {
        return selectors.onOther();
    }

    throw new errors.ErrTypingSystem(`type isn't known: ${type}`);
}

export function onTypedValueSelect<TResult>(
    value: TypedValue,
    selectors: {
        onPrimitive: () => TResult;
        onOption: () => TResult;
        onList: () => TResult;
        onArray: () => TResult;
        onStruct: () => TResult;
        onTuple: () => TResult;
        onEnum: () => TResult;
        onExplicitEnum: () => TResult;
        onManagedDecimal: () => TResult;
        onManagedDecimalSigned: () => TResult;
        onOther?: () => TResult;
    },
): TResult {
    if (value.hasClassOrSuperclass(PrimitiveValue.ClassName)) {
        return selectors.onPrimitive();
    }
    if (value.hasExactClass(OptionValue.ClassName)) {
        return selectors.onOption();
    }
    if (value.hasExactClass(List.ClassName)) {
        return selectors.onList();
    }
    if (value.hasExactClass(ArrayVec.ClassName)) {
        return selectors.onArray();
    }
    if (value.hasExactClass(Struct.ClassName)) {
        return selectors.onStruct();
    }
    if (value.hasExactClass(Tuple.ClassName)) {
        return selectors.onTuple();
    }
    if (value.hasExactClass(EnumValue.ClassName)) {
        return selectors.onEnum();
    }
    if (value.hasExactClass(ExplicitEnumValue.ClassName)) {
        return selectors.onExplicitEnum();
    }
    if (value.hasExactClass(ManagedDecimalValue.ClassName)) {
        return selectors.onManagedDecimal();
    }
    if (value.hasExactClass(ManagedDecimalSignedValue.ClassName)) {
        return selectors.onManagedDecimalSigned();
    }

    if (selectors.onOther) {
        return selectors.onOther();
    }

    throw new errors.ErrTypingSystem(`value isn't typed: ${value}`);
}

export function onPrimitiveValueSelect<TResult>(
    value: PrimitiveValue,
    selectors: {
        onBoolean: () => TResult;
        onNumerical: () => TResult;
        onAddress: () => TResult;
        onBytes: () => TResult;
        onString: () => TResult;
        onH256: () => TResult;
        onTypeIdentifier: () => TResult;
        onCodeMetadata: () => TResult;
        onNothing: () => TResult;
        onOther?: () => TResult;
    },
): TResult {
    if (value.hasExactClass(BooleanValue.ClassName)) {
        return selectors.onBoolean();
    }
    if (value.hasClassOrSuperclass(NumericalValue.ClassName)) {
        return selectors.onNumerical();
    }
    if (value.hasExactClass(AddressValue.ClassName)) {
        return selectors.onAddress();
    }
    if (value.hasExactClass(BytesValue.ClassName)) {
        return selectors.onBytes();
    }
    if (value.hasExactClass(StringValue.ClassName)) {
        return selectors.onString();
    }
    if (value.hasExactClass(H256Value.ClassName)) {
        return selectors.onH256();
    }
    if (value.hasExactClass(TokenIdentifierValue.ClassName)) {
        return selectors.onTypeIdentifier();
    }
    if (value.hasExactClass(CodeMetadataValue.ClassName)) {
        return selectors.onCodeMetadata();
    }
    if (value.hasExactClass(NothingValue.ClassName)) {
        return selectors.onNothing();
    }

    if (selectors.onOther) {
        return selectors.onOther();
    }

    throw new errors.ErrTypingSystem(`value isn't a primitive: ${value.getType()}`);
}

export function onPrimitiveTypeSelect<TResult>(
    type: PrimitiveType,
    selectors: {
        onBoolean: () => TResult;
        onNumerical: () => TResult;
        onAddress: () => TResult;
        onBytes: () => TResult;
        onString: () => TResult;
        onH256: () => TResult;
        onTokenIndetifier: () => TResult;
        onCodeMetadata: () => TResult;
        onNothing: () => TResult;
        onOther?: () => TResult;
    },
): TResult {
    if (type.hasExactClass(BooleanType.ClassName)) {
        return selectors.onBoolean();
    }
    if (type.hasClassOrSuperclass(NumericalType.ClassName)) {
        return selectors.onNumerical();
    }
    if (type.hasExactClass(AddressType.ClassName)) {
        return selectors.onAddress();
    }
    if (type.hasExactClass(BytesType.ClassName)) {
        return selectors.onBytes();
    }
    if (type.hasExactClass(StringType.ClassName)) {
        return selectors.onString();
    }
    if (type.hasExactClass(H256Type.ClassName)) {
        return selectors.onH256();
    }
    if (type.hasExactClass(TokenIdentifierType.ClassName)) {
        return selectors.onTokenIndetifier();
    }
    if (type.hasExactClass(CodeMetadataType.ClassName)) {
        return selectors.onCodeMetadata();
    }
    if (type.hasExactClass(NothingType.ClassName)) {
        return selectors.onNothing();
    }
    if (selectors.onOther) {
        return selectors.onOther();
    }

    throw new errors.ErrTypingSystem(`type isn't a known primitive: ${type}`);
}
