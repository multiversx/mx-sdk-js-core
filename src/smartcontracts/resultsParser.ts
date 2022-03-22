import { ErrCannotParseContractResults, ErrInvariantFailed } from "../errors";
import { TransactionOnNetwork } from "../transactionOnNetwork";
import { ArgSerializer } from "./argSerializer";
import { TypedOutcomeBundle, IResultsParser, UntypedOutcomeBundle } from "./interface";
import { QueryResponse } from "./queryResponse";
import { ReturnCode } from "./returnCode";
import { EndpointDefinition } from "./typesystem";

enum WellKnownEvents {
    OnTransactionCompleted = "completedTxEvent",
    OnContractDeployment = "SCDeploy",
    OnUserError = "signalError"
}

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

    /**
     * TODO: Upon further analysis, improve this function. Currently, the implementation makes some (possibly inaccurate) assumptions on the SCR & logs emission logic.
     */
    parseUntypedOutcome(transaction: TransactionOnNetwork): UntypedOutcomeBundle {
        let resultItems = transaction.results.getAll();
        // Let's search the result holding the returnData
        // (possibly inaccurate logic at this moment)
        let resultItemWithReturnData = resultItems.find(item => item.nonce.valueOf() != 0);

        // If we didn't find it, then fallback to events & logs:
        // (possibly inaccurate logic at this moment)
        if (!resultItemWithReturnData) {
            let returnCode = ReturnCode.Unknown;

            if (transaction.logs.findEventByIdentifier(WellKnownEvents.OnTransactionCompleted)) {
                // We do not extract any return data.
                returnCode = ReturnCode.Ok;
            } else if (transaction.logs.findEventByIdentifier(WellKnownEvents.OnContractDeployment)) {
                // When encountering this event, we assume a successful deployment.
                // We do not extract any return data.
                // (possibly inaccurate logic at this moment, especially in case of deployments from other contracts)
                returnCode = ReturnCode.Ok;
            } else if (transaction.logs.findEventByIdentifier(WellKnownEvents.OnUserError)) {
                returnCode = ReturnCode.UserError;
            }

            // TODO: Also handle "too much gas provided" (writeLog event) - in this case, the returnData is held in the event.data field.

            return {
                returnCode: returnCode,
                returnMessage: returnCode.toString(),
                values: []
            };
        }

        let parts = resultItemWithReturnData.getDataParts();
        let { returnCode, returnDataParts } = this.sliceDataParts(parts);

        return {
            returnCode: returnCode,
            returnMessage: returnCode.toString(),
            values: returnDataParts
        };
    }

    private sliceDataParts(parts: Buffer[]): { returnCode: ReturnCode, returnDataParts: Buffer[] } {
        let emptyReturnPart = parts[0] || Buffer.from([]);
        let returnCodePart = parts[1] || Buffer.from([]);
        let returnDataParts = parts.slice(2);

        if (emptyReturnPart.length != 0) {
            throw new ErrCannotParseContractResults("no leading empty part");
        }
        if (returnCodePart.length == 0) {
            throw new ErrCannotParseContractResults("no return code");
        }

        let returnCode = ReturnCode.fromBuffer(returnCodePart);
        return { returnCode, returnDataParts };
    }
}
