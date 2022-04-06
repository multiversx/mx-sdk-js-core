// deprecatedContractResults.ts
/**
 * This file contains the old (before erdjs 10) logic dealing with SCRs. 
 * The components / functions were moved here in order to change erdjs-repl / contract wrapper components as little as possible.
 * When splitting the erdjs repository into multiple ones (for wallet providers, walletcore etc.), we should consider extracting erdjs-repl / contract wrappers
 * to a separate repository, as well. Though excellent for CLI, these components are not suited for minimal web dApps - different use cases.
 * @module
 */

import { ContractResultItem } from "../../networkProvider/contractResults";
import { IContractResultItem, IContractResults, ITransactionOnNetwork } from "../../interfaceOfNetwork";
import { ArgSerializer } from "../argSerializer";
import { QueryResponse } from "../queryResponse";
import { ReturnCode } from "../returnCode";
import { EndpointDefinition, TypedValue } from "../typesystem";
import { Result } from "./result";

/**
 * @deprecated The concept of immediate results / resulting calls does not exist in the Protocol / in the API.
 * The SCRs are more alike a graph.
 */
export function interpretExecutionResults(endpoint: EndpointDefinition, transactionOnNetwork: ITransactionOnNetwork): ExecutionResultsBundle {
    let smartContractResults = transactionOnNetwork.contractResults;
    let immediateResult = findImmediateResult(smartContractResults)!;
    let resultingCalls = findResultingCalls(smartContractResults);

    let buffers = immediateResult.outputUntyped();
    let values = new ArgSerializer().buffersToValues(buffers, endpoint.output);
    let returnCode = immediateResult.getReturnCode();

    return {
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
    smartContractResults: IContractResults;
    immediateResult: TypedResult;
    /**
     * @deprecated Most probably, we should use logs & events instead
     */
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
 * The SCRs are more like a graph.
 */
export function findImmediateResult(results: IContractResults): TypedResult | undefined {
    let immediateItem = results.items.filter(item => isImmediateResult(item))[0];
    if (immediateItem) {
        return new TypedResult(immediateItem);
    }
    return undefined;
}

/**
 * @deprecated The concept of immediate results / resulting calls does not exist in the Protocol / in the API.
 * The SCRs are more like a graph.
 */
export function findResultingCalls(results: IContractResults): TypedResult[] {
    let otherItems = results.items.filter(item => !isImmediateResult(item));
    let resultingCalls = otherItems.map(item => new TypedResult(item));
    return resultingCalls;
}

/**
 * @deprecated The concept of immediate results / resulting calls does not exist in the Protocol / in the API.
 * The SCRs are more like a graph.
 */
function isImmediateResult(item: IContractResultItem): boolean {
    return item.nonce.valueOf() != 0;
}

/**
 * @deprecated getReturnCode(), outputUntyped are a bit fragile. 
 * They are not necessarily applicable to SCRs, in general (only in particular).
 */
export class TypedResult extends ContractResultItem implements Result.IResult {
    /**
    * If available, will provide typed output arguments (with typed values).
    */
    endpointDefinition?: EndpointDefinition;

    constructor(init?: Partial<IContractResultItem>) {
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
        let tokens = new ArgSerializer().stringToBuffers(this.data);
        if (tokens.length < 2) {
            return ReturnCode.None;
        }
        let returnCodeToken = tokens[1];
        return ReturnCode.fromBuffer(returnCodeToken);
    }

    outputUntyped(): Buffer[] {
        this.assertSuccess();

        // Skip the first 2 SCRs (eg. the @6f6b from @6f6b@2b).
        let dataParts = new ArgSerializer().stringToBuffers(this.data);
        return dataParts.slice(2);
    }

    /**
     * @deprecated The return message isn't available on SmartContractResultItem (not provided by the API).
     */
    getReturnMessage(): string {
        return this.getReturnCode().toString();
    }
}
