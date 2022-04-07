import { IContractQuery } from "../interface";

export class DummyQuery implements IContractQuery {
    contract: string = "";
    function: string = "";
    arguments: string[] = [];
    value: string = "";
    caller: string = "";

    constructor(init?: Partial<DummyQuery>) {
        Object.assign(this, init);
    }

    toHttpRequest() {
        return {
            "scAddress": this.contract,
            "funcName": this.function,
            "args": this.arguments,
            "value": this.value,
            "caller": this.caller
        }
    }
}
