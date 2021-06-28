import BigNumber from "bignumber.js";
import { AddressType, AddressValue, BigIntType, BigIntValue, BigUIntType, BigUIntValue, BooleanType, BooleanValue, BytesType, BytesValue, Code, CompositeType, CompositeValue, EndpointDefinition, EndpointParameterDefinition, I16Type, I16Value, I32Type, I32Value, I64Type, I64Value, I8Type, I8Value, List, ListType, NumericalType, OptionalType, OptionalValue, OptionType, OptionValue, PrimitiveType, TokenIdentifierType, TokenIdentifierValue, Type, TypedValue, U16Type, U16Value, U32Type, U32Value, U64Type, U64Value, U8Type, U8Value, VariadicType, VariadicValue } from ".";
import { ErrInvalidArgument, Address, BalanceBuilder } from "..";
import { TestWallet } from "../testutils";
import { ArgumentErrorContext } from "./argumentErrorContext";
import { SmartContract } from "./smartContract";
import { ContractWrapper } from "./wrapper/contractWrapper";

export namespace NativeTypes {
    export type NativeBuffer = Buffer | string | BalanceBuilder;
    export type NativeBytes = Code | Buffer | string | BalanceBuilder;
    export type NativeAddress = Address | string | Buffer | ContractWrapper | SmartContract | TestWallet;
}

export namespace NativeSerializer {
    /**
     * Interprets a set of native javascript values into a set of typed values, given parameter definitions.
     */
    export function nativeToTypedValues(args: any[], endpoint: EndpointDefinition): TypedValue[] {
        args = args || [];
        args = handleVariadicArgsAndRePack(args, endpoint);

        let parameters = endpoint.input;
        let values: TypedValue[] = [];

        for (let i in parameters) {
            let parameter = parameters[i];
            let errorContext = new ArgumentErrorContext(endpoint.name, i, parameter);
            let value = convertToTypedValue(args[i], parameter.type, errorContext);
            values.push(value);
        }

        return values;
    }

    function handleVariadicArgsAndRePack(args: any[], endpoint: EndpointDefinition) {
        let parameters = endpoint.input;

        let { min, max, variadic } = getArgumentsCardinality(parameters);

        if (!(min <= args.length && args.length <= max)) {
            throw new ErrInvalidArgument(`Wrong number of arguments for endpoint ${endpoint.name}: expected between ${min} and ${max} arguments, have ${args.length}`);
        }

        if (variadic) {
            let lastArgIndex = parameters.length - 1;
            let lastArg = args.slice(lastArgIndex);
            if (lastArg.length > 0) {
                args[lastArgIndex] = lastArg;
            }
        }
        return args;
    }


    // A function may have one of the following formats:
    // f(arg1, arg2, optional<arg3>, optional<arg4>) returns { min: 2, max: 4, variadic: false }
    // f(arg1, variadic<bytes>) returns { min: 1, max: Infinity, variadic: true }
    // f(arg1, arg2, optional<arg3>, arg4, optional<arg5>, variadic<bytes>) returns { min: 4, max: Infinity, variadic: true }
    function getArgumentsCardinality(parameters: EndpointParameterDefinition[]): { min: number, max: number, variadic: boolean } {
        let reversed = [...parameters].reverse(); // keep the original unchanged
        let min = parameters.length;
        let max = parameters.length;
        let variadic = false;
        if (reversed.length > 0 && reversed[0].type.getCardinality().isComposite()) {
            max = Infinity;
            variadic = true;
        }
        for (let parameter of reversed) {
            if (parameter.type.getCardinality().isSingular()) {
                break;
            }
            min -= 1;
        }
        return { min, max, variadic };
    }

    function convertToTypedValue(native: any, type: Type, errorContext: ArgumentErrorContext): TypedValue {
        if (type instanceof OptionType) {
            return toOptionValue(native, type, errorContext);
        }
        if (type instanceof OptionalType) {
            return toOptionalValue(native, type, errorContext);
        }
        if (type instanceof VariadicType) {
            return toVariadicValue(native, type, errorContext);
        }
        if (type instanceof CompositeType) {
            return toCompositeValue(native, type, errorContext);
        }
        if (type instanceof ListType) {
            return toListValue(native, type, errorContext);
        }
        if (type instanceof PrimitiveType) {
            return toPrimitive(native, type, errorContext);
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

    function toVariadicValue(native: any, type: Type, errorContext: ArgumentErrorContext): TypedValue {
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
        for (let i in typeParameters) {
            typedValues.push(convertToTypedValue(native[i], typeParameters[i], errorContext));
        }

        return new CompositeValue(type, typedValues);
    }

    function toPrimitive(native: any, type: Type, errorContext: ArgumentErrorContext): TypedValue {
        if (type instanceof NumericalType) {
            let number = new BigNumber(native);
            return convertNumericalType(number, type, errorContext);
        }
        if (type instanceof BytesType) {
            return convertNativeToBytesValue(native, errorContext);
        }
        if (type instanceof AddressType) {
            return new AddressValue(convertNativeToAddress(native, errorContext));
        }
        if (type instanceof BooleanType) {
            return new BooleanValue(native);
        }
        if (type instanceof TokenIdentifierType) {
            return new TokenIdentifierValue(convertNativeToBuffer(native, errorContext));
        }
        errorContext.throwError(`(function: toPrimitive) unsupported type ${type}`);
    }

    function convertNativeToBytesValue(native: NativeTypes.NativeBytes, errorContext: ArgumentErrorContext) {
        if (native instanceof Code) {
            return BytesValue.fromHex(native.toString());
        }
        if (native instanceof Buffer) {
            return new BytesValue(native);
        }
        if (typeof native === "string") {
            return BytesValue.fromUTF8(native);
        }
        if (((<BalanceBuilder>native).getTokenIdentifier)) {
            return BytesValue.fromUTF8(native.getTokenIdentifier());
        }
        errorContext.convertError(native, "BytesValue");
    }

    function convertNativeToBuffer(native: NativeTypes.NativeBuffer, errorContext: ArgumentErrorContext): Buffer {
        if (native instanceof Buffer) {
            return native;
        }
        if (typeof native === "string") {
            return Buffer.from(native);
        }
        if (((<BalanceBuilder>native).getTokenIdentifier)) {
            return Buffer.from(native.getTokenIdentifier());
        }
        errorContext.convertError(native, "Buffer");
    }

    export function convertNativeToAddress(native: NativeTypes.NativeAddress, errorContext: ArgumentErrorContext): Address {
        if (native instanceof Address) {
            return native;
        }
        if (typeof native === "string" || native instanceof Buffer) {
            return new Address(native);
        }
        if (native instanceof ContractWrapper) {
            return native.getAddress();
        }
        if (native instanceof SmartContract) {
            return native.getAddress();
        }
        if (native instanceof TestWallet) {
            return native.address;
        }
        errorContext.convertError(native, "Address");
    }

    function convertNumericalType(number: BigNumber, type: Type, errorContext: ArgumentErrorContext): TypedValue {
        if (type instanceof U8Type) {
            return new U8Value(number);
        }
        if (type instanceof I8Type) {
            return new I8Value(number);
        }
        if (type instanceof U16Type) {
            return new U16Value(number);
        }
        if (type instanceof I16Type) {
            return new I16Value(number);
        }
        if (type instanceof U32Type) {
            return new U32Value(number);
        }
        if (type instanceof I32Type) {
            return new I32Value(number);
        }
        if (type instanceof U64Type) {
            return new U64Value(number);
        }
        if (type instanceof I64Type) {
            return new I64Value(number);
        }
        if (type instanceof BigUIntType) {
            return new BigUIntValue(number);
        }
        if (type instanceof BigIntType) {
            return new BigIntValue(number);
        }
        errorContext.unhandledType("convertNumericalType", type);
    }
}
