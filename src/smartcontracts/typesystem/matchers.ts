import * as errors from "../../errors";
import { AddressType, AddressValue } from "./address";
import { BooleanType, BooleanValue } from "./boolean";
import { BytesType, BytesValue } from "./bytes";
import { EnumType, EnumValue } from "./enum";
import { OptionType, OptionValue, List, ListType } from "./generic";
import { H256Type, H256Value } from "./h256";
import { NumericalType, NumericalValue } from "./numerical";
import { NothingType, NothingValue } from "./nothing";
import { Struct, StructType } from "./struct";
import { TokenIdentifierType, TokenIdentifierValue } from "./tokenIdentifier";
import { Tuple, TupleType } from "./tuple";
import { Type, PrimitiveType, PrimitiveValue } from "./types";
import { ArrayVec, ArrayVecType } from "./genericArray";
import { TypedValue } from "./types";
import { StringType, StringValue } from "./string";

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
        onOther?: () => TResult;
    }
): TResult {
    if (type.hasJavascriptConstructorInHierarchy(OptionType.name)) {
        return selectors.onOption();
    }
    if (type.hasJavascriptConstructorInHierarchy(ListType.name)) {
        return selectors.onList();
    }
    if (type.hasJavascriptConstructorInHierarchy(ArrayVecType.name)) {
        return selectors.onArray();
    }
    if (type.hasJavascriptConstructorInHierarchy(PrimitiveType.name)) {
        return selectors.onPrimitive();
    }
    if (type.hasJavascriptConstructorInHierarchy(StructType.name)) {
        return selectors.onStruct();
    }
    if (type.hasJavascriptConstructorInHierarchy(TupleType.name)) {
        return selectors.onTuple();
    }
    if (type.hasJavascriptConstructorInHierarchy(EnumType.name)) {
        return selectors.onEnum();
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
        onOther?: () => TResult;
    }
): TResult {
    if (value.hasJavascriptConstructorInHierarchy(PrimitiveValue.name)) {
        return selectors.onPrimitive();
    }
    if (value.hasJavascriptConstructorInHierarchy(OptionValue.name)) {
        return selectors.onOption();
    }
    if (value.hasJavascriptConstructorInHierarchy(List.name)) {
        return selectors.onList();
    }
    if (value.hasJavascriptConstructorInHierarchy(ArrayVec.name)) {
        return selectors.onArray();
    }
    if (value.hasJavascriptConstructorInHierarchy(Struct.name)) {
        return selectors.onStruct();
    }
    if (value.hasJavascriptConstructorInHierarchy(Tuple.name)) {
        return selectors.onTuple();
    }
    if (value.hasJavascriptConstructorInHierarchy(EnumValue.name)) {
        return selectors.onEnum();
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
        onNothing: () => TResult;
        onOther?: () => TResult;
    }
): TResult {
    if (value.hasJavascriptConstructorInHierarchy(BooleanValue.name)) {
        return selectors.onBoolean();
    }
    if (value.hasJavascriptConstructorInHierarchy(NumericalValue.name)) {
        return selectors.onNumerical();
    }
    if (value.hasJavascriptConstructorInHierarchy(AddressValue.name)) {
        return selectors.onAddress();
    }
    if (value.hasJavascriptConstructorInHierarchy(BytesValue.name)) {
        return selectors.onBytes();
    }
    if (value.hasJavascriptConstructorInHierarchy(StringValue.name)) {
        return selectors.onString();
    }
    if (value.hasJavascriptConstructorInHierarchy(H256Value.name)) {
        return selectors.onH256();
    }
    if (value.hasJavascriptConstructorInHierarchy(TokenIdentifierValue.name)) {
        return selectors.onTypeIdentifier();
    }
    if (value.hasJavascriptConstructorInHierarchy(NothingValue.name)) {
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
        onNothing: () => TResult;
        onOther?: () => TResult;
    }
): TResult {
    if (type.hasJavascriptConstructorInHierarchy(BooleanType.name)) {
        return selectors.onBoolean();
    }
    if (type.hasJavascriptConstructorInHierarchy(NumericalType.name)) {
        return selectors.onNumerical();
    }
    if (type.hasJavascriptConstructorInHierarchy(AddressType.name)) {
        return selectors.onAddress();
    }
    if (type.hasJavascriptConstructorInHierarchy(BytesType.name)) {
        return selectors.onBytes();
    }
    if (type.hasJavascriptConstructorInHierarchy(StringType.name)) {
        return selectors.onString();
    }
    if (type.hasJavascriptConstructorInHierarchy(H256Type.name)) {
        return selectors.onH256();
    }
    if (type.hasJavascriptConstructorInHierarchy(TokenIdentifierType.name)) {
        return selectors.onTokenIndetifier();
    }
    if (type.hasJavascriptConstructorInHierarchy(NothingType.name)) {
        return selectors.onNothing();
    }
    if (selectors.onOther) {
        return selectors.onOther();
    }

    throw new errors.ErrTypingSystem(`type isn't a known primitive: ${type}`);
}
