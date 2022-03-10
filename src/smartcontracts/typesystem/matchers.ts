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
    if (type.hasConstructorInHierarchy(OptionType.name)) {
        return selectors.onOption();
    }
    if (type.hasConstructorInHierarchy(ListType.name)) {
        return selectors.onList();
    }
    if (type.hasConstructorInHierarchy(ArrayVecType.name)) {
        return selectors.onArray();
    }
    if (type.hasConstructorInHierarchy(PrimitiveType.name)) {
        return selectors.onPrimitive();
    }
    if (type.hasConstructorInHierarchy(StructType.name)) {
        return selectors.onStruct();
    }
    if (type.hasConstructorInHierarchy(TupleType.name)) {
        return selectors.onTuple();
    }
    if (type.hasConstructorInHierarchy(EnumType.name)) {
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
    if (value instanceof PrimitiveValue) {
        return selectors.onPrimitive();
    }
    if (value instanceof OptionValue) {
        return selectors.onOption();
    }
    if (value instanceof List) {
        return selectors.onList();
    }
    if (value instanceof ArrayVec) {
        return selectors.onArray();
    }
    if (value instanceof Struct) {
        return selectors.onStruct();
    }
    if (value instanceof Tuple) {
        return selectors.onTuple();
    }
    if (value instanceof EnumValue) {
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
        onH256: () => TResult;
        onTypeIdentifier: () => TResult;
        onNothing: () => TResult;
        onOther?: () => TResult;
    }
): TResult {
    if (value instanceof BooleanValue) {
        return selectors.onBoolean();
    }
    if (value instanceof NumericalValue) {
        return selectors.onNumerical();
    }
    if (value instanceof AddressValue) {
        return selectors.onAddress();
    }
    if (value instanceof BytesValue) {
        return selectors.onBytes();
    }
    if (value instanceof H256Value) {
        return selectors.onH256();
    }
    if (value instanceof TokenIdentifierValue) {
        return selectors.onTypeIdentifier();
    }
    if (value instanceof NothingValue) {
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
        onH256: () => TResult;
        onTokenIndetifier: () => TResult;
        onNothing: () => TResult;
        onOther?: () => TResult;
    }
): TResult {
    if (type.hasConstructorInHierarchy(BooleanType.name)) {
        return selectors.onBoolean();
    }
    if (type.hasConstructorInHierarchy(NumericalType.name)) {
        return selectors.onNumerical();
    }
    if (type.hasConstructorInHierarchy(AddressType.name)) {
        return selectors.onAddress();
    }
    if (type.hasConstructorInHierarchy(BytesType.name)) {
        return selectors.onBytes();
    }
    if (type.hasConstructorInHierarchy(H256Type.name)) {
        return selectors.onH256();
    }
    if (type.hasConstructorInHierarchy(TokenIdentifierType.name)) {
        return selectors.onTokenIndetifier();
    }
    if (type.hasConstructorInHierarchy(NothingType.name)) {
        return selectors.onNothing();
    }
    if (selectors.onOther) {
        return selectors.onOther();
    }

    throw new errors.ErrTypingSystem(`type isn't a known primitive: ${type}`);
}
