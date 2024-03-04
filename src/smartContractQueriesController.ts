import { Err } from "./errors";
import { IContractQueryResponse } from "./interfaceOfNetwork";
import { SmartContractQuery, SmartContractQueryResponse } from "./smartContractQuery";
import { ArgSerializer, ContractFunction, EndpointDefinition, NativeSerializer, Query } from "./smartcontracts";

interface Abi {
    getEndpoint(name: string | ContractFunction): EndpointDefinition;
}

interface INetworkProvider {
    queryContract(query: Query): Promise<IContractQueryResponse>;
}

export class SmartContractQueriesController {
    private readonly abi?: Abi;
    private readonly networkProvider: INetworkProvider;

    constructor(options: { abi?: Abi; networkProvider: INetworkProvider }) {
        this.abi = options.abi;
        this.networkProvider = options.networkProvider;
    }

    createQuery(options: {
        contract: string;
        caller?: string;
        value?: bigint;
        function: string;
        arguments: Uint8Array[];
    }): SmartContractQuery {
        const preparedArguments = this.encodeArguments(options.function, options.arguments);

        return new SmartContractQuery({
            contract: options.contract,
            caller: options.caller,
            function: options.function,
            arguments: preparedArguments,
            value: options.value,
        });
    }

    private encodeArguments(functionName: string, args: any[]): Uint8Array[] {
        const endpoint = this.abi?.getEndpoint(functionName);

        if (endpoint) {
            const typedArgs = NativeSerializer.nativeToTypedValues(args, endpoint);
            return new ArgSerializer().valuesToBuffers(typedArgs);
        }

        if (this.areArgsOfTypedValue(args)) {
            return new ArgSerializer().valuesToBuffers(args);
        }

        if (this.areArgsBuffers(args)) {
            return args.map((arg) => Buffer.from(arg));
        }

        throw new Err("Can't encode arguments");
    }

    private areArgsOfTypedValue(args: any[]): boolean {
        for (const arg of args) {
            if (!arg.belongsToTypesystem) {
                return false;
            }
        }

        return true;
    }

    private areArgsBuffers(args: any[]): boolean {
        for (const arg of args) {
            if (!ArrayBuffer.isView(arg)) {
                return false;
            }
        }

        return true;
    }

    runQuery(_query: SmartContractQuery): SmartContractQueryResponse {
        throw new Err("Not implemented");
    }

    parseQueryResponse(_response: SmartContractQueryResponse): any[] {
        throw new Err("Not implemented");
    }
}
