import { Address } from "./address";
import { Err } from "./errors";
import { IAddress } from "./interface";
import { IContractQueryResponse } from "./interfaceOfNetwork";
import { SmartContractQuery, SmartContractQueryResponse } from "./smartContractQuery";
import { ArgSerializer, ContractFunction, EndpointDefinition, NativeSerializer } from "./smartcontracts";

interface Abi {
    getEndpoint(name: string | ContractFunction): EndpointDefinition;
}

interface INetworkProvider {
    queryContract(query: ILegacyQuery): Promise<IContractQueryResponse>;
}

interface ILegacyQuery {
    address: IAddress;
    caller?: IAddress;
    func: { toString(): string };
    value?: { toString(): string };
    getEncodedArguments(): string[];
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

    async runQuery(query: SmartContractQuery): Promise<SmartContractQueryResponse> {
        const legacyQuery: ILegacyQuery = {
            address: Address.fromBech32(query.contract),
            caller: query.caller ? Address.fromBech32(query.caller) : undefined,
            func: query.function,
            value: query.value,
            getEncodedArguments: () => query.arguments.map((arg) => Buffer.from(arg).toString("hex")),
        };

        const legacyQueryResponse = await this.networkProvider.queryContract(legacyQuery);
        const queryResponse = new SmartContractQueryResponse({
            returnCode: legacyQueryResponse.returnCode.toString(),
            returnMessage: legacyQueryResponse.returnMessage,
            returnDataParts: legacyQueryResponse.getReturnDataParts(),
        });

        return queryResponse;
    }

    parseQueryResponse(_response: SmartContractQueryResponse): any[] {
        throw new Err("Not implemented");
    }
}