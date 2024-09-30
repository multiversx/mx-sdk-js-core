import { IContractQuery } from "./interface";

export class ContractQueryRequest {
    private readonly query: IContractQuery;

    constructor(query: IContractQuery) {
        this.query = query;
    }

    toHttpRequest() {
        let request: any = {};
        let query = this.query;
        request.scAddress = query.address.bech32();
        request.caller = query.caller?.bech32() ? query.caller.bech32() : undefined;
        request.funcName = query.func.toString();
        request.value = query.value ? query.value.toString() : undefined;
        request.args = query.getEncodedArguments();
        
        return request;
    }
}
