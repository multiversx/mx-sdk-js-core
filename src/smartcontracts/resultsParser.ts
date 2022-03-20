import { ErrInvariantFailed } from "../errors";
import { TransactionOnNetwork } from "../transactionOnNetwork";
import { ArgSerializer } from "./argSerializer";
import { TypedOutcomeBundle, IResultsParser, UntypedOutcomeBundle } from "./interface";
import { QueryResponse } from "./queryResponse";
import { ReturnCode } from "./returnCode";
import { EndpointDefinition } from "./typesystem";

export class ResultsParser implements IResultsParser {
    parseQueryResponse(queryResponse: QueryResponse, endpoint: EndpointDefinition): TypedOutcomeBundle {
        let parts = queryResponse.getReturnDataParts();
        let values = new ArgSerializer().buffersToValues(parts, endpoint.output);

        return {
            returnCode: queryResponse.returnCode,
            returnMessage: queryResponse.returnMessage,
            values: values,
            firstValue: values[0],
            secondValue: values[1],
            thirdValue: values[2]
        };
    }

    parseUntypedQueryResponse(queryResponse: QueryResponse): UntypedOutcomeBundle {
        return {
            returnCode: queryResponse.returnCode,
            returnMessage: queryResponse.returnMessage,
            values: queryResponse.getReturnDataParts()
        };
    }

    /**
     * TODO: Improve this function. Currently, the implementation makes some (possibly incorrect) assumptions on the SCR & logs construction logic.
     * 
     * @param transaction The transaction holding the contract execution outcome (results and logs).
     * @param endpoint The endpoint definition (ABI)
     */
    parseOutcome(transaction: TransactionOnNetwork, endpoint: EndpointDefinition): TypedOutcomeBundle {
        let untypedBundle = this.parseUntypedOutcome(transaction);
        let values = new ArgSerializer().buffersToValues(untypedBundle.values, endpoint.output);

        return {
            returnCode: untypedBundle.returnCode,
            returnMessage: untypedBundle.returnMessage,
            values: values,
            firstValue: values[0],
            secondValue: values[1],
            thirdValue: values[2]
        };
    }
    
    // TODO: Handle code duplication.
    parseUntypedOutcome(transaction: TransactionOnNetwork): UntypedOutcomeBundle {
        let resultItems = transaction.results.getAll();
        // TODO: Fix! The filtering condition below IS NOT necessarily CORRECT (not sufficient).
        let resultItemWithReturnData = resultItems.find(item => item.nonce.valueOf() != 0);

        if (!resultItemWithReturnData) {
            let returnCode = ReturnCode.Unknown;

            if (transaction.logs.findEventByIdentifier("completedTxEvent")) {
                returnCode = ReturnCode.Ok;
            } else if (transaction.logs.findEventByIdentifier("signalError")) {
                returnCode = ReturnCode.UserError;
            }

            // TODO: Also handle "too much gas provided" (writeLog event) - in this case, the returnData (from the contract) is held in the event.data field.

            return {
                returnCode: returnCode,
                returnMessage: returnCode.toString(),
                values: []
            };
        }

        let parts = resultItemWithReturnData.getDataParts();
        let emptyReturnPart = parts[0] || Buffer.from([]);
        let returnCodePart = parts[1] || Buffer.from([]);
        let returnDataParts = parts.slice(2);

        if (emptyReturnPart.length != 0) {
            throw new ErrInvariantFailed("Cannot parse contract return data. No leading empty part.");
        }

        if (returnCodePart.length == 0) {
            throw new ErrInvariantFailed("Cannot parse contract return code.");
        }

        let returnCode = ReturnCode.fromBuffer(returnCodePart);

        return {
            returnCode: returnCode,
            returnMessage: returnCode.toString(),
            values: returnDataParts
        };
    }
}
