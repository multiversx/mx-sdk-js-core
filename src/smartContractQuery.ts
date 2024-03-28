export class SmartContractQuery {
    contract: string;
    caller?: string;
    value?: bigint;
    function: string;
    arguments: Uint8Array[];

    constructor(options: {
        contract: string;
        caller?: string;
        value?: bigint;
        function: string;
        arguments: Uint8Array[];
    }) {
        this.contract = options.contract;
        this.caller = options.caller;
        this.value = options.value;
        this.function = options.function;
        this.arguments = options.arguments;
    }
}

export class SmartContractQueryResponse {
    function: string;
    returnCode: string;
    returnMessage: string;
    returnDataParts: Uint8Array[];

    constructor(obj: { function: string; returnCode: string; returnMessage: string; returnDataParts: Uint8Array[] }) {
        this.function = obj.function;
        this.returnCode = obj.returnCode;
        this.returnMessage = obj.returnMessage;
        this.returnDataParts = obj.returnDataParts;
    }
}
