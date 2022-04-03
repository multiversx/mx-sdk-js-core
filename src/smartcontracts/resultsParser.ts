import { ErrCannotParseContractResults } from "../errors";
import { TransactionOnNetwork } from "../transactionOnNetwork";
import { ArgSerializer } from "./argSerializer";
import { TypedOutcomeBundle, IResultsParser, UntypedOutcomeBundle } from "./interface";
import { QueryResponse } from "./queryResponse";
import { ReturnCode } from "./returnCode";
import { SmartContractResultItem } from "./smartContractResults";
import { EndpointDefinition } from "./typesystem";

enum WellKnownEvents {
    OnTransactionCompleted = "completedTxEvent",
    OnSignalError = "signalError",
    OnWriteLog = "writeLog"
}

enum WellKnownTopics {
    TooMuchGas = "@too much gas provided for processing"
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

    parseUntypedOutcome(transaction: TransactionOnNetwork): UntypedOutcomeBundle {
        let resultItems = transaction.results.getAll();
        let logs = transaction.logs;

        // Handle simple move balances (or any other transactions without contract results / logs):
        if (resultItems.length == 0 && logs.events.length == 0) {
            return {
                returnCode: ReturnCode.Unknown,
                returnMessage: ReturnCode.Unknown.toString(),
                values: []
            };
        }

        // Handle invalid transactions:
        if (transaction.status.isInvalid()) {
            return {
                returnCode: ReturnCode.Unknown,
                returnMessage: transaction.receipt.message,
                values: []
            };
        }

        // Let's search the contract result holding the returnData:
        let resultItemWithReturnData = this.findResultItemWithReturnData(resultItems);

        if (resultItemWithReturnData) {
            let { returnCode, returnDataParts } = this.sliceDataFieldInParts(resultItemWithReturnData.data);
            let returnMessage = resultItemWithReturnData.returnMessage || returnCode.toString();

            return {
                returnCode: returnCode,
                returnMessage: returnMessage,
                values: returnDataParts
            };
        }

        // If we didn't find it, then fallback to events & logs.
        
        // On "signalError":
        let eventSignalError = logs.findSingleOrNoneEvent(WellKnownEvents.OnSignalError);

        if (eventSignalError) {
            let { returnCode, returnDataParts } = this.sliceDataFieldInParts(eventSignalError.data);
            let lastTopic = eventSignalError.getLastTopic();
            let returnMessage = lastTopic?.toString() || returnCode.toString();

            return {
                returnCode: returnCode,
                returnMessage: returnMessage,
                values: returnDataParts
            };
        }

        // On "writeLog" with topic "@too much gas provided for processing"
        let eventTooMuchGas = logs.findSingleOrNoneEvent(
            WellKnownEvents.OnWriteLog,
            event => event.findFirstOrNoneTopic(topic => topic.toString().startsWith(WellKnownTopics.TooMuchGas)) != undefined
        );

        if (eventTooMuchGas) {
            let { returnCode, returnDataParts } = this.sliceDataFieldInParts(eventTooMuchGas.data);
            let lastTopic = eventTooMuchGas.getLastTopic();
            let returnMessage = lastTopic?.toString() || returnCode.toString();

            return {
                returnCode: returnCode,
                returnMessage: returnMessage,
                values: returnDataParts
            };
        }

        // On "writeLog" with first topic == sender
        let eventWriteLogWhereTopicIsSender = logs.findSingleOrNoneEvent(
            WellKnownEvents.OnWriteLog,
            event => event.findFirstOrNoneTopic(topic => topic.hex() == transaction.sender.hex()) != undefined
        );

        if (eventWriteLogWhereTopicIsSender) {
            let { returnCode, returnDataParts } = this.sliceDataFieldInParts(eventWriteLogWhereTopicIsSender.data);
            let returnMessage = returnCode.toString();

            return {
                returnCode: returnCode,
                returnMessage: returnMessage,
                values: returnDataParts
            };
        }

        throw new ErrCannotParseContractResults(`transaction ${transaction.hash.toString()}`);
    }

    private findResultItemWithReturnData(items: SmartContractResultItem[]) {
        let result = items.find(item => item.nonce.valueOf() != 0 && item.data.startsWith("@"));
        return result;
    }

    private sliceDataFieldInParts(data: string): { returnCode: ReturnCode, returnDataParts: Buffer[] } {
        let parts = new ArgSerializer().stringToBuffers(data);
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
