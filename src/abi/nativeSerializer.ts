/* eslint-disable @typescript-eslint/no-namespace */
import BigNumber from "bignumber.js";
import { Address } from "../core/address";
import { ErrInvalidArgument } from "../core/errors";
import { numberToPaddedHex } from "../core/utils.codec";
import { ArgumentErrorContext } from "./argumentErrorContext";
import {
    AddressType,
    AddressValue,
    BigIntType,
    BigIntValue,
    BigUIntType,
    BigUIntValue,
    BooleanType,
    BooleanValue,
    BytesType,
    BytesValue,
    CompositeType,
    CompositeValue,
    EndpointDefinition,
    EndpointParameterDefinition,
    EnumType,
    EnumValue,
    ExplicitEnumType,
    ExplicitEnumValue,
    Field,
    I16Type,
    I16Value,
    I32Type,
    I32Value,
    I64Type,
    I64Value,
    I8Type,
    I8Value,
    isTyped,
    List,
    ListType,
    ManagedDecimalType,
    ManagedDecimalValue,
    NumericalType,
    OptionalType,
    OptionalValue,
    OptionType,
    OptionValue,
    PrimitiveType,
    Struct,
    StructType,
    TokenIdentifierType,
    TokenIdentifierValue,
    Tuple,
    TupleType,
    Type,
    TypedValue,
    U16Type,
    U16Value,
    U32Type,
    U32Value,
    U64Type,
    U64Value,
    U8Type,
    U8Value,
    VariadicType,
    VariadicValue,
} from "./typesystem";

export namespace NativeTypes {
    export type NativeBuffer = Buffer | string;
    export type NativeBytes = Buffer | { valueOf(): Buffer } | string;
    export type NativeAddress = string | Buffer | Address | { getAddress(): Address };
    export type NativeBigNumber = BigNumber.Value | bigint;
}

export namespace NativeSerializer {
    /**
     * Interprets a set of native javascript values into a set of typed values, given parameter definitions.
     */
    export function nativeToTypedValues(args: any[], endpoint: EndpointDefinition): TypedValue[] {
        args = args || [];

        checkArgumentsCardinality(args, endpoint);

        if (hasNonCountedVariadicParameter(endpoint)) {
            args = repackNonCountedVariadicParameters(args, endpoint);
        } else {
            // Repacking makes sense (it's possible) only for regular, non-counted variadic parameters.
        }

        let parameters = endpoint.input;
        let values: TypedValue[] = [];

        for (let i = 0; i < parameters.length; i++) {
            let parameter = parameters[i];
            let errorContext = new ArgumentErrorContext(endpoint.name, i, parameter);
            let value = convertToTypedValue(args[i], parameter.type, errorContext);
            values.push(value);
        }

        return values;
    }

    function checkArgumentsCardinality(args: any[], endpoint: EndpointDefinition) {
        // With respect to the notes of "repackNonCountedVariadicParameters", "getArgumentsCardinality" will not be needed anymore.
        // Currently, it is used only for a arguments count check, which will become redundant.
        const { min, max } = getArgumentsCardinality(endpoint.input);
        if (!(min <= args.length && args.length <= max)) {
            throw new ErrInvalidArgument(
                `Wrong number of arguments for endpoint ${endpoint.name}: expected between ${min} and ${max} arguments, have ${args.length}`,
            );
        }
    }

    function hasNonCountedVariadicParameter(endpoint: EndpointDefinition): boolean {
        const lastParameter = endpoint.input[endpoint.input.length - 1];
        return lastParameter?.type instanceof VariadicType && !lastParameter.type.isCounted;
    }

    // In a future version of the type inference system, re-packing logic will be removed.
    // The client code will be responsible for passing the correctly packed arguments (variadic arguments explicitly packed as arrays).
    // For developers, calling `foo(["erd1", 42, [1, 2, 3]])` will be less ambiguous than `foo(["erd1", 42, 1, 2, 3])`.
    // Furthermore, multiple counted-variadic arguments cannot be expressed in the current variant.
    // E.g. now, it's unreasonable to decide that `foo([1, 2, 3, "a", "b", "c"])` calls `foo(counted-variadic<int>, counted-variadic<string>)`.
    function repackNonCountedVariadicParameters(args: any[], endpoint: EndpointDefinition) {
        const lastEndpointParamIndex = endpoint.input.length - 1;
        const argAtIndex = args[lastEndpointParamIndex];

        if (argAtIndex?.belongsToTypesystem) {
            const isVariadicValue = argAtIndex.hasClassOrSuperclass(VariadicValue.ClassName);
            if (!isVariadicValue) {
                throw new ErrInvalidArgument(
                    `Wrong argument type for endpoint ${endpoint.name}: typed value provided; expected variadic type, have ${argAtIndex.getClassName()}`,
                );
            }

            // Do not repack.
        } else {
            args[lastEndpointParamIndex] = args.slice(lastEndpointParamIndex);
        }

        return args;
    }

    // A function may have one of the following formats:
    // f(arg1, arg2, optional<arg3>, optional<arg4>) returns { min: 2, max: 4, variadic: false }
    // f(arg1, variadic<bytes>) returns { min: 1, max: Infinity, variadic: true }
    // f(arg1, arg2, optional<arg3>, arg4, optional<arg5>, variadic<bytes>) returns { min: 2, max: Infinity, variadic: true }
    export function getArgumentsCardinality(parameters: EndpointParameterDefinition[]): {
        min: number;
        max: number;
        variadic: boolean;
    } {
        let reversed = [...parameters].reverse(); // keep the original unchanged
        let min = parameters.length;
        let max = parameters.length;
        let variadic = false;

        if (reversed.length > 0 && reversed[0].type.getCardinality().isComposite()) {
            max = Infinity;
            variadic = true;
        }

        for (let parameter of reversed) {
            // It's a single-value, not a multi-value parameter. Thus, cardinality isn't affected.
            if (parameter.type.getCardinality().isSingular()) {
                break;
            }

            // It's a multi-value parameter: optional, variadic etc.
            min -= 1;
        }

        return { min, max, variadic };
    }

    function convertToTypedValue(value: any, type: Type, errorContext: ArgumentErrorContext): TypedValue {
        if (value && isTyped(value)) {
            // Value is already typed, no need to convert it.
            return value;
        }

        if (type instanceof OptionType) {
            return toOptionValue(value, type, errorContext);
        }
        if (type instanceof OptionalType) {
            return toOptionalValue(value, type, errorContext);
        }
        if (type instanceof VariadicType) {
            return toVariadicValue(value, type, errorContext);
        }
        if (type instanceof CompositeType) {
            return toCompositeValue(value, type, errorContext);
        }
        if (type instanceof TupleType) {
            return toTupleValue(value, type, errorContext);
        }
        if (type instanceof StructType) {
            return toStructValue(value, type, errorContext);
        }
        if (type instanceof ListType) {
            return toListValue(value, type, errorContext);
        }
        if (type instanceof PrimitiveType) {
            return toPrimitive(value, type, errorContext);
        }
        if (type instanceof EnumType) {
            return toEnumValue(value, type, errorContext);
        }
        if (type instanceof ExplicitEnumType) {
            return toExplicitEnumValue(value, type, errorContext);
        }
        if (type instanceof ManagedDecimalType) {
            return toManagedDecimal(value, type, errorContext);
        }
        errorContext.throwError(`convertToTypedValue: unhandled type ${type}`);
    }

    function toOptionValue(native: any, type: Type, errorContext: ArgumentErrorContext): TypedValue {
        if (native == null) {
            return OptionValue.newMissing();
        }
        let converted = convertToTypedValue(native, type.getFirstTypeParameter(), errorContext);
        return OptionValue.newProvided(converted);
    }

    function toOptionalValue(native: any, type: Type, errorContext: ArgumentErrorContext): TypedValue {
        if (native == null) {
            return new OptionalValue(type);
        }
        let converted = convertToTypedValue(native, type.getFirstTypeParameter(), errorContext);
        return new OptionalValue(type, converted);
    }

    function toVariadicValue(native: any, type: VariadicType, errorContext: ArgumentErrorContext): TypedValue {
        if (type.isCounted) {
            throw new ErrInvalidArgument(
                `Counted variadic arguments must be explicitly typed. E.g. use "VariadicValue.fromItemsCounted()" or "new VariadicValue()"`,
            );
        }

        if (native == null) {
            native = [];
        }
        if (native.map === undefined) {
            errorContext.convertError(native, "Variadic");
        }
        let converted = native.map(function (item: any) {
            return convertToTypedValue(item, type.getFirstTypeParameter(), errorContext);
        });
        return new VariadicValue(type, converted);
    }

    function toListValue(native: any, type: Type, errorContext: ArgumentErrorContext): TypedValue {
        if (native.map === undefined) {
            errorContext.convertError(native, "List");
        }
        let converted = native.map(function (item: any) {
            return convertToTypedValue(item, type.getFirstTypeParameter(), errorContext);
        });
        return new List(type, converted);
    }

    function toCompositeValue(native: any, type: Type, errorContext: ArgumentErrorContext): TypedValue {
        let typedValues = [];
        let typeParameters = type.getTypeParameters();
        errorContext.guardSameLength(native, typeParameters);
        for (let i = 0; i < typeParameters.length; i++) {
            typedValues.push(convertToTypedValue(native[i], typeParameters[i], errorContext));
        }

        return new CompositeValue(type, typedValues);
    }

    function toTupleValue(native: any, type: TupleType, errorContext: ArgumentErrorContext): TypedValue {
        let typedValues = [];
        const fields = type.getFieldsDefinitions();
        errorContext.guardSameLength(native, fields);
        for (let i = 0; i < fields.length; i++) {
            typedValues.push(convertToTypedValue(native[i], fields[i].type, errorContext));
        }
        return Tuple.fromItems(typedValues);
    }

    function toStructValue(native: any, type: StructType, errorContext: ArgumentErrorContext): TypedValue {
        let structFieldValues = [];
        const fields = type.getFieldsDefinitions();
        for (let i = 0; i < fields.length; i++) {
            const fieldName = fields[i].name;
            errorContext.guardHasField(native, fieldName);
            const fieldNativeValue = native[fieldName];
            const fieldTypedValue = convertToTypedValue(fieldNativeValue, fields[i].type, errorContext);
            structFieldValues.push(new Field(fieldTypedValue, fieldName));
        }
        return new Struct(type, structFieldValues);
    }

    function toPrimitive(native: any, type: Type, errorContext: ArgumentErrorContext): TypedValue {
        if (type instanceof NumericalType) {
            const number = new BigNumber(native);
            return convertNumericalType(number, type, errorContext);
        }
        if (type instanceof BytesType) {
            return convertNativeToBytesValue(native, errorContext);
        }
        if (type instanceof AddressType) {
            return new AddressValue(convertNativeToAddress(native, errorContext));
        }
        if (type instanceof BooleanType) {
            const boolValue = native.toString().toLowerCase() === "true" || native.toString() === "1";
            return new BooleanValue(boolValue);
        }
        if (type instanceof TokenIdentifierType) {
            return new TokenIdentifierValue(convertNativeToString(native, errorContext));
        }
        errorContext.throwError(`(function: toPrimitive) unsupported type ${type}`);
    }

    function toEnumValue(native: any, type: EnumType, errorContext: ArgumentErrorContext): TypedValue {
        if (typeof native === "number") {
            return EnumValue.fromDiscriminant(type, native);
        }
        if (typeof native === "string") {
            return EnumValue.fromName(type, native);
        }
        if (typeof native === "object") {
            errorContext.guardHasField(native, "name");
            const variant = type.getVariantByName(native.name);
            errorContext.guardHasField(native, "fields");
            const nativeFields = native.fields;

            const fieldValues = [];
            const fields = variant.getFieldsDefinitions();
            for (let i = 0; i < fields.length; i++) {
                const fieldName = fields[i].name;
                errorContext.guardHasField(nativeFields, fieldName);
                const fieldNativeValue = nativeFields[fieldName];
                const fieldTypedValue = convertToTypedValue(fieldNativeValue, fields[i].type, errorContext);
                fieldValues.push(new Field(fieldTypedValue, fieldName));
            }

            return new EnumValue(type, variant, fieldValues);
        }
        errorContext.throwError(`(function: toEnumValue) unsupported native type ${typeof native}`);
    }

    function toExplicitEnumValue(native: any, type: ExplicitEnumType, errorContext: ArgumentErrorContext): TypedValue {
        if (typeof native === "string") {
            return ExplicitEnumValue.fromName(type, native);
        }
        if (typeof native === "object") {
            errorContext.guardHasField(native, "name");
            const variant = type.getVariantByName(native.name);

            return new ExplicitEnumValue(type, variant);
        }
        errorContext.throwError(`(function: toExplicitEnumValue) unsupported native type ${typeof native}`);
    }

    function toManagedDecimal(native: any, type: ManagedDecimalType, errorContext: ArgumentErrorContext): TypedValue {
        if (typeof native === "object") {
            return new ManagedDecimalValue(native[0], native[1], type.isVariable());
        }
        errorContext.throwError(`(function: toManagedDecimal) unsupported native type ${typeof native}`);
    }

    // TODO: move logic to typesystem/bytes.ts
    function convertNativeToBytesValue(native: NativeTypes.NativeBytes, errorContext: ArgumentErrorContext) {
        const innerValue = native.valueOf();

        if (native === undefined) {
            errorContext.convertError(native, "BytesValue");
        }
        if (native instanceof Buffer) {
            return new BytesValue(native);
        }
        if (typeof native === "string") {
            return BytesValue.fromUTF8(native);
        }
        if (innerValue instanceof Buffer) {
            return new BytesValue(innerValue);
        }
        if (typeof innerValue === "number") {
            return BytesValue.fromHex(numberToPaddedHex(innerValue));
        }

        errorContext.convertError(native, "BytesValue");
    }

    // TODO: move logic to typesystem/string.ts
    function convertNativeToString(native: NativeTypes.NativeBuffer, errorContext: ArgumentErrorContext): string {
        if (native === undefined) {
            errorContext.convertError(native, "Buffer");
        }
        if (native instanceof Buffer) {
            return native.toString();
        }
        if (typeof native === "string") {
            return native;
        }
        errorContext.convertError(native, "Buffer");
    }

    // TODO: move logic to typesystem/address.ts
    export function convertNativeToAddress(
        native: NativeTypes.NativeAddress,
        errorContext: ArgumentErrorContext,
    ): Address {
        if ((<any>native).toBech32) {
            return <Address>native;
        }
        if ((<any>native).getAddress) {
            return (<any>native).getAddress();
        }

        switch (native.constructor) {
            case Buffer:
            case String:
                return new Address(<Buffer | string>native);
            default:
                errorContext.convertError(native, "Address");
        }
    }

    // TODO: move logic to typesystem/numerical.ts
    function convertNumericalType(
        number: NativeTypes.NativeBigNumber,
        type: Type,
        errorContext: ArgumentErrorContext,
    ): TypedValue {
        switch (type.constructor) {
            case U8Type:
                return new U8Value(number);
            case I8Type:
                return new I8Value(number);
            case U16Type:
                return new U16Value(number);
            case I16Type:
                return new I16Value(number);
            case U32Type:
                return new U32Value(number);
            case I32Type:
                return new I32Value(number);
            case U64Type:
                return new U64Value(number);
            case I64Type:
                return new I64Value(number);
            case BigUIntType:
                return new BigUIntValue(number);
            case BigIntType:
                return new BigIntValue(number);
            default:
                errorContext.unhandledType("convertNumericalType", type);
        }
    }
}
