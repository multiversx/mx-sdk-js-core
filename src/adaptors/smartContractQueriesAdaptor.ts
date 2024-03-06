import { Address } from "../address";
import { IAddress } from "../interface";
import { IContractQueryResponse } from "../interfaceOfNetwork";
import { SmartContractQuery, SmartContractQueryResponse } from "../smartContractQuery";
import { ContractFunction, EndpointDefinition } from "../smartcontracts";

interface INetworkProvider {
    queryContract(query: ILegacyQuery): Promise<IContractQueryResponse>;
}

interface IAbi {
    getEndpoint(name: string | ContractFunction): EndpointDefinition;
}

interface ILegacyQuery {
    address: IAddress;
    caller?: IAddress;
    func: { toString(): string };
    value?: { toString(): string };
    getEncodedArguments(): string[];
}

export class SmartContractQueriesAdaptor {
    abi?: IAbi;
    networkProvider: INetworkProvider;

    constructor(options: { abi?: IAbi; networkProvider: INetworkProvider }) {
        this.abi = options.abi;
        this.networkProvider = options.networkProvider;
    }

    async queryContract(query: SmartContractQuery): Promise<SmartContractQueryResponse> {
        const legacyQuery: ILegacyQuery = {
            address: Address.fromBech32(query.contract),
            caller: query.caller ? Address.fromBech32(query.caller) : undefined,
            func: query.function,
            value: query.value,
            getEncodedArguments: () => query.arguments.map((arg) => Buffer.from(arg).toString("hex")),
        };

        const legacyQueryResponse = await this.networkProvider.queryContract(legacyQuery);
        const queryResponse = new SmartContractQueryResponse({
            function: query.function,
            returnCode: legacyQueryResponse.returnCode.toString(),
            returnMessage: legacyQueryResponse.returnMessage,
            returnDataParts: legacyQueryResponse.getReturnDataParts(),
        });

        return queryResponse;
    }
}
