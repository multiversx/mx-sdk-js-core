import { ArgSerializer } from "../argSerializer";
import { ContractFunction } from "../function";
import { NativeSerializer } from "../nativeSerializer";
import { EndpointDefinition, TypedValue } from "../typesystem";

/**
 * Creates a FormattedCall from the given endpoint and args.
 */
export function formatEndpoint(executingEndpoint: EndpointDefinition, interpretingEndpoint: EndpointDefinition, ...args: any[]): FormattedCall {
    return new FormattedCall(executingEndpoint, interpretingEndpoint, args);
}

/**
 * Formats and validates the arguments of a bound call.
 * A bound call is represented by a function and its arguments packed together.
 * A function is defined as something that has an EndpointDefinition and may be:
 * - a smart contract method
 * - a built-in function (such as an ESDT transfer)
 */
export class FormattedCall {
    readonly executingEndpoint: EndpointDefinition;
    interpretingEndpoint: EndpointDefinition;
    readonly args: any[];

    constructor(executingEndpoint: EndpointDefinition, interpretingEndpoint: EndpointDefinition, args: any[]) {
        this.executingEndpoint = executingEndpoint;
        this.interpretingEndpoint = interpretingEndpoint;
        this.args = args;
    }

    getExecutingFunction(): ContractFunction {
        return new ContractFunction(this.executingEndpoint.name);
    }

    getInterpretingFunction(): ContractFunction {
        return new ContractFunction(this.interpretingEndpoint.name);
    }

    /**
     * Takes the given arguments, and converts them to typed values, validating them against the given endpoint in the process.
     */
    toTypedValues(): TypedValue[] {
        let expandedArgs = this.getExpandedArgs();
        return NativeSerializer.nativeToTypedValues(expandedArgs, this.executingEndpoint);
    }

    toArgBuffers(): Buffer[] {
        let typedValues = this.toTypedValues();
        return new ArgSerializer().valuesToBuffers(typedValues);
    }

    /**
     * Formats the function name and its arguments as an array of buffers.
     * This is useful for nested calls (for the multisig smart contract or for ESDT transfers).
     * A formatted deploy call does not return the function name.
     */
    toCallBuffers(): Buffer[] {
        if (this.executingEndpoint.isConstructor()) {
            return this.toArgBuffers();
        }
        return [Buffer.from(this.executingEndpoint.name), ...this.toArgBuffers()];
    }

    private getExpandedArgs(): any[] {
        let expanded: any[] = [];
        for (let value of this.args) {
            if (value instanceof FormattedCall) {
                expanded = expanded.concat(value.toCallBuffers());
            } else {
                expanded.push(value);
            }
        }
        return expanded;
    }
}
