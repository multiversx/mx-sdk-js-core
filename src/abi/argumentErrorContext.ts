import { ErrInvalidArgument } from "../core/errors";
import { EndpointParameterDefinition, Type } from "./typesystem";

export class ArgumentErrorContext {
    endpointName: string;
    argumentIndex: number;
    parameterDefinition: EndpointParameterDefinition;

    constructor(endpointName: string, argumentIndex: number, parameterDefinition: EndpointParameterDefinition) {
        this.endpointName = endpointName;
        this.argumentIndex = argumentIndex;
        this.parameterDefinition = parameterDefinition;
    }

    throwError(specificError: string): never {
        throw new ErrInvalidArgument(
            `Error when converting arguments for endpoint (endpoint name: ${this.endpointName}, argument index: ${this.argumentIndex}, name: ${this.parameterDefinition.name}, type: ${this.parameterDefinition.type})\nNested error: ${specificError}`,
        );
    }

    convertError(native: any, typeName: string): never {
        this.throwError(
            `Can't convert argument (argument: ${native}, type ${typeof native}), wanted type: ${typeName})`,
        );
    }

    unhandledType(functionName: string, type: Type): never {
        this.throwError(`Unhandled type (function: ${functionName}, type: ${type})`);
    }

    guardSameLength<T>(native: any[], valueTypes: T[]) {
        native = native || [];
        if (native.length != valueTypes.length) {
            this.throwError(
                `Incorrect composite type length: have ${native.length}, expected ${valueTypes.length} (argument: ${native})`,
            );
        }
    }

    guardHasField(native: any, fieldName: string) {
        native = native || {};
        if (!(fieldName in native)) {
            this.throwError(
                `Struct argument does not contain a field named "${fieldName}" (argument: ${JSON.stringify(native)})`,
            );
        }
    }
}
