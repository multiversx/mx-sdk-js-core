import { SmartContractQuery } from "../core/smartContractQuery";

export class ContractQueryRequest {
    private readonly query: SmartContractQuery;

    constructor(query: SmartContractQuery) {
        this.query = query;
    }

    toHttpRequest() {
        let request: any = {};
        let query = this.query;
        request.scAddress = query.contract.toBech32();
        request.caller = query.caller?.toBech32() ? query.caller.toBech32() : undefined;
        request.funcName = query.function;
        request.value = query.value ? query.value.toString() : undefined;
        request.args = query.arguments?.map((x) => Buffer.from(x).toString("hex"));
        return request;
    }
}
