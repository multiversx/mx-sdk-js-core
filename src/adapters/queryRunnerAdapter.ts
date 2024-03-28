import { Address } from "../address";
import { IAddress } from "../interface";
import { IContractQueryResponse } from "../interfaceOfNetwork";
import { SmartContractQuery, SmartContractQueryResponse } from "../smartContractQuery";

interface INetworkProvider {
    queryContract(query: IQuery): Promise<IContractQueryResponse>;
}

interface IQuery {
    address: IAddress;
    caller?: IAddress;
    func: { toString(): string };
    value?: { toString(): string };
    getEncodedArguments(): string[];
}

export class QueryRunnerAdapter {
    private readonly networkProvider: INetworkProvider;

    constructor(options: { networkProvider: INetworkProvider }) {
        this.networkProvider = options.networkProvider;
    }

    async runQuery(query: SmartContractQuery): Promise<SmartContractQueryResponse> {
        const adaptedQuery: IQuery = {
            address: Address.fromBech32(query.contract),
            caller: query.caller ? Address.fromBech32(query.caller) : undefined,
            func: query.function,
            value: query.value,
            getEncodedArguments: () => query.arguments.map((arg) => Buffer.from(arg).toString("hex")),
        };

        const adaptedQueryResponse = await this.networkProvider.queryContract(adaptedQuery);
        return new SmartContractQueryResponse({
            function: query.function,
            returnCode: adaptedQueryResponse.returnCode.toString(),
            returnMessage: adaptedQueryResponse.returnMessage,
            returnDataParts: adaptedQueryResponse.getReturnDataParts(),
        });
    }
}
