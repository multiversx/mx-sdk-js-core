import { TransactionOnNetwork } from "../../transactionOnNetwork";
import { ArgSerializer } from "../argSerializer";
import { QueryResponse } from "../queryResponse";
import { ReturnCode } from "../returnCode";
import { SmartContractResultItem, SmartContractResults } from "../smartContractResults";
import { EndpointDefinition, TypedValue } from "../typesystem";
import { Result } from "./result";

/**
 * @deprecated The concept of immediate results / resulting calls does not exist in the Protocol / in the API.
 * The SCRs are more alike a graph.
 */
export function interpretExecutionResults(endpoint: EndpointDefinition, transactionOnNetwork: TransactionOnNetwork): ExecutionResultsBundle {
    let smartContractResults = transactionOnNetwork.results;
    let immediateResult = findImmediateResult(smartContractResults)!;
    let resultingCalls = findResultingCalls(smartContractResults);

    let buffers = immediateResult.outputUntyped();
    let values = new ArgSerializer().buffersToValues(buffers, endpoint.output);
    let returnCode = immediateResult.getReturnCode();

    return {
        transactionOnNetwork: transactionOnNetwork,
        smartContractResults: smartContractResults,
        immediateResult,
        resultingCalls,
        values,
        firstValue: values[0],
        returnCode: returnCode
    };
}

/**
 * @deprecated The concept of immediate results / resulting calls does not exist in the Protocol / in the API.
 * The SCRs are more alike a graph.
 */
export interface ExecutionResultsBundle {
    transactionOnNetwork: TransactionOnNetwork;
    smartContractResults: SmartContractResults;
    immediateResult: TypedResult;
    resultingCalls: TypedResult[];
    values: TypedValue[];
    firstValue: TypedValue;
    returnCode: ReturnCode;
}

export interface QueryResponseBundle {
    queryResponse: QueryResponse;
    firstValue: TypedValue;
    values: TypedValue[];
    returnCode: ReturnCode;
}

/**
 * @deprecated The concept of immediate results / resulting calls does not exist in the Protocol / in the API.
 * The SCRs are more alike a graph.
 */
export function findImmediateResult(results: SmartContractResults): TypedResult | undefined {
    let immediateItem = results.getAll().filter(item => isImmediateResult(item))[0];
    if (immediateItem) {
        return new TypedResult(immediateItem);
    }
    return undefined;
}

/**
 * @deprecated The concept of immediate results / resulting calls does not exist in the Protocol / in the API.
 * The SCRs are more alike a graph.
 */
export function findResultingCalls(results: SmartContractResults): TypedResult[] {
    let otherItems = results.getAll().filter(item => !isImmediateResult(item));
    let resultingCalls = otherItems.map(item => new TypedResult(item));
    return resultingCalls;
}

/**
 * @deprecated The concept of immediate results / resulting calls does not exist in the Protocol / in the API.
 * The SCRs are more alike a graph.
 */
function isImmediateResult(item: SmartContractResultItem): boolean {
    return item.nonce.valueOf() != 0;
}

/**
 * @deprecated getReturnCode(), outputUntyped are a bit fragile. 
 * They are not necessarily applicable to SCRs, in general (only in particular).
 */
export class TypedResult extends SmartContractResultItem implements Result.IResult {
    /**
    * If available, will provide typed output arguments (with typed values).
    */
    endpointDefinition?: EndpointDefinition;

    constructor(init?: Partial<SmartContractResultItem>) {
        super();
        Object.assign(this, init);
    }

    assertSuccess() {
        Result.assertSuccess(this);
    }

    isSuccess(): boolean {
        return this.getReturnCode().isSuccess();
    }

    getReturnCode(): ReturnCode {
        let tokens = this.getDataParts();
        if (tokens.length < 2) {
            return ReturnCode.None;
        }
        let returnCodeToken = tokens[1];
        return ReturnCode.fromBuffer(returnCodeToken);
    }

    outputUntyped(): Buffer[] {
        this.assertSuccess();

        // Skip the first 2 SCRs (eg. the @6f6b from @6f6b@2b).
        return this.getDataParts().slice(2);
    }

    /**
     * @deprecated The return message isn't available on SmartContractResultItem (not provided by the API).
     */
    getReturnMessage(): string {
        return this.getReturnCode().toString();
    }
}
