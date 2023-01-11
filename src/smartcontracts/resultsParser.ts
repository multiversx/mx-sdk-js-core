import { TransactionDecoder, TransactionMetadata } from "@multiversx/sdk-transaction-decoder/lib/src/transaction.decoder";
import { Address } from "../address";
import { ErrCannotParseContractResults } from "../errors";
import { IAddress } from "../interface";
import { IContractQueryResponse, IContractResults, ITransactionLogs, ITransactionOnNetwork } from "../interfaceOfNetwork";
import { Logger } from "../logger";
import { ArgSerializer } from "./argSerializer";
import { TypedOutcomeBundle, UntypedOutcomeBundle } from "./interface";
import { ReturnCode } from "./returnCode";
import { EndpointDefinition, EndpointParameterDefinition, TypedValue } from "./typesystem";

enum WellKnownEvents {
    OnTransactionCompleted = "completedTxEvent",
    OnSignalError = "signalError",
    OnWriteLog = "writeLog"
}

enum WellKnownTopics {
    TooMuchGas = "@too much gas provided for processing"
}

interface IResultsParserOptions {
    argsSerializer: IArgsSerializer;
}

interface IArgsSerializer {
    buffersToValues(buffers: Buffer[], parameters: EndpointParameterDefinition[]): TypedValue[];
    stringToBuffers(joinedString: string): Buffer[];
}

// TODO: perhaps move default construction options to a factory (ResultsParserFactory), instead of referencing them in the constructor
// (postpone as much as possible, breaking change)
const defaultResultsParserOptions: IResultsParserOptions = {
    argsSerializer: new ArgSerializer()
};

/**
 * Parses contract query responses and smart contract results.
 * The parsing involves some heuristics, in order to handle slight inconsistencies (e.g. some SCRs are present on API, but missing on Gateway).
 */
export class ResultsParser {
    private readonly argsSerializer: IArgsSerializer;

    constructor(options?: IResultsParserOptions) {
        options = { ...defaultResultsParserOptions, ...options };
        this.argsSerializer = options.argsSerializer;
    }

    parseQueryResponse(queryResponse: IContractQueryResponse, endpoint: EndpointDefinition): TypedOutcomeBundle {
        let parts = queryResponse.getReturnDataParts();
        let values = this.argsSerializer.buffersToValues(parts, endpoint.output);
        let returnCode = new ReturnCode(queryResponse.returnCode.toString());

        return {
            returnCode: returnCode,
            returnMessage: queryResponse.returnMessage,
            values: values,
            firstValue: values[0],
            secondValue: values[1],
            thirdValue: values[2],
            lastValue: values[values.length - 1]
        };
    }

    parseUntypedQueryResponse(queryResponse: IContractQueryResponse): UntypedOutcomeBundle {
        let returnCode = new ReturnCode(queryResponse.returnCode.toString())

        return {
            returnCode: returnCode,
            returnMessage: queryResponse.returnMessage,
            values: queryResponse.getReturnDataParts()
        };
    }

    parseOutcome(transaction: ITransactionOnNetwork, endpoint: EndpointDefinition): TypedOutcomeBundle {
        let untypedBundle = this.parseUntypedOutcome(transaction);
        let values = this.argsSerializer.buffersToValues(untypedBundle.values, endpoint.output);

        return {
            returnCode: untypedBundle.returnCode,
            returnMessage: untypedBundle.returnMessage,
            values: values,
            firstValue: values[0],
            secondValue: values[1],
            thirdValue: values[2],
            lastValue: values[values.length - 1]
        };
    }

    parseUntypedOutcome(transaction: ITransactionOnNetwork): UntypedOutcomeBundle {
        let bundle: UntypedOutcomeBundle | null;

        let transactionMetadata = this.parseTransactionMetadata(transaction);

        bundle = this.createBundleOnSimpleMoveBalance(transaction)
        if (bundle) {
            Logger.trace("parseUntypedOutcome(): on simple move balance");
            return bundle;
        }

        bundle = this.createBundleOnInvalidTransaction(transaction);
        if (bundle) {
            Logger.trace("parseUntypedOutcome(): on invalid transaction");
            return bundle;
        }

        bundle = this.createBundleOnEasilyFoundResultWithReturnData(transaction.contractResults);
        if (bundle) {
            Logger.trace("parseUntypedOutcome(): on easily found result with return data");
            return bundle;
        }

        bundle = this.createBundleOnSignalError(transaction.logs);
        if (bundle) {
            Logger.trace("parseUntypedOutcome(): on signal error");
            return bundle;
        }

        bundle = this.createBundleOnTooMuchGasWarning(transaction.logs);
        if (bundle) {
            Logger.trace("parseUntypedOutcome(): on 'too much gas' warning");
            return bundle;
        }

        bundle = this.createBundleOnWriteLogWhereFirstTopicEqualsAddress(transaction.logs, transaction.sender);
        if (bundle) {
            Logger.trace("parseUntypedOutcome(): on writelog with topics[0] == tx.sender");
            return bundle;
        }

        bundle = this.createBundleWithCustomHeuristics(transaction, transactionMetadata);
        if (bundle) {
            Logger.trace("parseUntypedOutcome(): with custom heuristics");
            return bundle;
        }

        bundle = this.createBundleWithFallbackHeuristics(transaction, transactionMetadata);
        if (bundle) {
            Logger.trace("parseUntypedOutcome(): with fallback heuristics");
            return bundle;
        }

        throw new ErrCannotParseContractResults(`transaction ${transaction.hash.toString()}`);
    }

    private parseTransactionMetadata(transaction: ITransactionOnNetwork): TransactionMetadata {
        return new TransactionDecoder().getTransactionMetadata({
            sender: transaction.sender.bech32(),
            receiver: transaction.receiver.bech32(),
            data: transaction.data.toString("base64"),
            value: transaction.value.toString()
        });
    }

    private createBundleOnSimpleMoveBalance(transaction: ITransactionOnNetwork): UntypedOutcomeBundle | null {
        let noResults = transaction.contractResults.items.length == 0;
        let noLogs = transaction.logs.events.length == 0;

        if (noResults && noLogs) {
            return {
                returnCode: ReturnCode.None,
                returnMessage: ReturnCode.None.toString(),
                values: []
            };
        }

        return null;
    }

    private createBundleOnInvalidTransaction(transaction: ITransactionOnNetwork): UntypedOutcomeBundle | null {
        if (transaction.status.isInvalid()) {
            if (transaction.receipt.data) {
                return {
                    returnCode: ReturnCode.OutOfFunds,
                    returnMessage: transaction.receipt.data,
                    values: []
                };
            }

            // If there's no receipt message, let other heuristics to handle the outcome (most probably, a log with "signalError" is emitted).
        }

        return null;
    }

    private createBundleOnEasilyFoundResultWithReturnData(results: IContractResults): UntypedOutcomeBundle | null {
        let resultItemWithReturnData = results.items.find(item => item.nonce.valueOf() != 0 && item.data.startsWith("@"));
        if (!resultItemWithReturnData) {
            return null;
        }

        let { returnCode, returnDataParts } = this.sliceDataFieldInParts(resultItemWithReturnData.data);
        let returnMessage = resultItemWithReturnData.returnMessage || returnCode.toString();

        return {
            returnCode: returnCode,
            returnMessage: returnMessage,
            values: returnDataParts
        };
    }

    private createBundleOnSignalError(logs: ITransactionLogs): UntypedOutcomeBundle | null {
        let eventSignalError = logs.findSingleOrNoneEvent(WellKnownEvents.OnSignalError);
        if (!eventSignalError) {
            return null;
        }

        let { returnCode, returnDataParts } = this.sliceDataFieldInParts(eventSignalError.data);
        let lastTopic = eventSignalError.getLastTopic();
        let returnMessage = lastTopic?.toString() || returnCode.toString();

        return {
            returnCode: returnCode,
            returnMessage: returnMessage,
            values: returnDataParts
        };
    }

    private createBundleOnTooMuchGasWarning(logs: ITransactionLogs): UntypedOutcomeBundle | null {
        let eventTooMuchGas = logs.findSingleOrNoneEvent(
            WellKnownEvents.OnWriteLog,
            event => event.findFirstOrNoneTopic(topic => topic.toString().startsWith(WellKnownTopics.TooMuchGas)) != undefined
        );

        if (!eventTooMuchGas) {
            return null;
        }

        let { returnCode, returnDataParts } = this.sliceDataFieldInParts(eventTooMuchGas.data);
        let lastTopic = eventTooMuchGas.getLastTopic();
        let returnMessage = lastTopic?.toString() || returnCode.toString();

        return {
            returnCode: returnCode,
            returnMessage: returnMessage,
            values: returnDataParts
        };
    }

    private createBundleOnWriteLogWhereFirstTopicEqualsAddress(logs: ITransactionLogs, address: IAddress): UntypedOutcomeBundle | null {
        let hexAddress = new Address(address.bech32()).hex();

        let eventWriteLogWhereTopicIsSender = logs.findSingleOrNoneEvent(
            WellKnownEvents.OnWriteLog,
            event => event.findFirstOrNoneTopic(topic => topic.hex() == hexAddress) != undefined
        );

        if (!eventWriteLogWhereTopicIsSender) {
            return null;
        }

        let { returnCode, returnDataParts } = this.sliceDataFieldInParts(eventWriteLogWhereTopicIsSender.data);
        let returnMessage = returnCode.toString();

        return {
            returnCode: returnCode,
            returnMessage: returnMessage,
            values: returnDataParts
        };
    }

    /**
     * Override this method (in a subclass of {@link ResultsParser}) if the basic heuristics of the parser are not sufficient.
     */
    protected createBundleWithCustomHeuristics(_transaction: ITransactionOnNetwork, _transactionMetadata: TransactionMetadata): UntypedOutcomeBundle | null {
        return null;
    }

    private createBundleWithFallbackHeuristics(transaction: ITransactionOnNetwork, transactionMetadata: TransactionMetadata): UntypedOutcomeBundle | null {
        let contractAddress = new Address(transactionMetadata.receiver);

        // Search the nested logs for matching events (writeLog):
        for (const resultItem of transaction.contractResults.items) {
            let writeLogWithReturnData = resultItem.logs.findSingleOrNoneEvent(WellKnownEvents.OnWriteLog, event => {
                let addressIsSender = event.address.bech32() == transaction.sender.bech32();
                let firstTopicIsContract = event.topics[0]?.hex() == contractAddress.hex();
                return addressIsSender && firstTopicIsContract;
            });

            if (writeLogWithReturnData) {
                let { returnCode, returnDataParts } = this.sliceDataFieldInParts(writeLogWithReturnData.data);
                let returnMessage = returnCode.toString();

                return {
                    returnCode: returnCode,
                    returnMessage: returnMessage,
                    values: returnDataParts
                };
            }
        }

        return null;
    }

    private sliceDataFieldInParts(data: string): { returnCode: ReturnCode, returnDataParts: Buffer[] } {
        // By default, skip the first part, which is usually empty (e.g. "[empty]@6f6b")
        let startingIndex = 1;

        // Before trying to parse the hex strings, cut the unwanted parts of the data field, in case of token transfers:
        if (data.startsWith("ESDTTransfer")) {
            // Skip "ESDTTransfer" (1), token identifier (2), amount (3)
            startingIndex = 3;
        } else {
            // TODO: Upon gathering more transaction samples, fix for other kinds of transfers, as well (future PR, as needed).
        }

        let parts = this.argsSerializer.stringToBuffers(data);
        let returnCodePart = parts[startingIndex] || Buffer.from([]);
        let returnDataParts = parts.slice(startingIndex + 1);

        if (returnCodePart.length == 0) {
            throw new ErrCannotParseContractResults("no return code");
        }

        let returnCode = ReturnCode.fromBuffer(returnCodePart);
        return { returnCode, returnDataParts };
    }
}
