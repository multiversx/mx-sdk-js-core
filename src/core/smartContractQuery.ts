import { Address } from "./address";

export class SmartContractQuery {
    contract: Address;
    caller?: Address;
    value?: bigint;
    function: string;
    arguments?: Uint8Array[];

    constructor(options: {
        contract: Address;
        caller?: Address;
        value?: bigint;
        function: string;
        arguments?: Uint8Array[];
    }) {
        this.contract = options.contract;
        this.caller = options.caller;
        this.value = options.value;
        this.function = options.function;
        this.arguments = options.arguments;
    }
}

export type SmartContractQueryInput = {
    contract: Address;
    caller?: Address;
    value?: bigint;
    function: string;
    arguments: any[];
};

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

    static fromHttpResponse(payload: any, functionName: string): SmartContractQueryResponse {
        let returnData = <string[]>payload["returnData"] || payload["ReturnData"];
        let returnCode = payload["returnCode"] || payload["ReturnCode"];
        let returnMessage = payload["returnMessage"] || payload["ReturnMessage"];

        return new SmartContractQueryResponse({
            returnDataParts: returnData?.map((item) => Buffer.from(item || "", "base64")),
            returnCode: returnCode,
            returnMessage: returnMessage,
            function: functionName,
        });
    }
}
