import {
    TransactionDecoder,
    TransactionMetadata,
} from "@multiversx/sdk-transaction-decoder/lib/src/transaction.decoder";
import { Address } from "../address";
import { ErrCannotParseContractResults } from "../errors";
import { IAddress } from "../interface";
import {
    IContractQueryResponse,
    IContractResults,
    ITransactionLogs,
    ITransactionOnNetwork,
} from "../interfaceOfNetwork";
import { Logger } from "../logger";
import { ArgSerializer } from "./argSerializer";
import { TypedOutcomeBundle, UntypedOutcomeBundle } from "./interface";
import { ReturnCode } from "./returnCode";
import { Type, TypedValue } from "./typesystem";

enum WellKnownEvents {
    OnTransactionCompleted = "completedTxEvent",
    OnSignalError = "signalError",
    OnWriteLog = "writeLog",
}

enum WellKnownTopics {
    TooMuchGas = "@too much gas provided for processing",
}

interface IResultsParserOptions {
    argsSerializer: IArgsSerializer;
}

interface IParameterDefinition {
    type: Type;
}

interface IEventInputDefinition {
    name: string;
    type: Type;
    indexed: boolean;
}

interface ITransactionEvent {
    readonly topics: { valueOf(): Uint8Array }[];
    readonly dataPayload?: { valueOf(): Uint8Array };
    readonly additionalData?: { valueOf(): Uint8Array }[];
}

interface IArgsSerializer {
    buffersToValues(buffers: Buffer[], parameters: IParameterDefinition[]): TypedValue[];
    stringToBuffers(joinedString: string): Buffer[];
}

// TODO: perhaps move default construction options to a factory (ResultsParserFactory), instead of referencing them in the constructor
// (postpone as much as possible, breaking change)
const defaultResultsParserOptions: IResultsParserOptions = {
    argsSerializer: new ArgSerializer(),
};

/**
 * Legacy component.
 * For parsing contract query responses, use the "SmartContractQueriesController" instead.
 * For parsing smart contract outcome (return data), use the "SmartContractTransactionsOutcomeParser" instead.
 * For parding smart contract events, use the "TransactionEventsParser" instead.
 *
 * Parses contract query responses and smart contract results.
 * The parsing involves some heuristics, in order to handle slight inconsistencies (e.g. some SCRs are present on API, but missing on Gateway).
 */
export class ResultsParser {
    private readonly argsSerializer: IArgsSerializer;

    constructor(options?: IResultsParserOptions) {
        options = { ...defaultResultsParserOptions, ...options };
        this.argsSerializer = options.argsSerializer;
    }

    /**
     * Legacy method, use "SmartContractQueriesController.parseQueryResponse()" instead.
     */
    parseQueryResponse(
        queryResponse: IContractQueryResponse,
        endpoint: { output: IParameterDefinition[] },
    ): TypedOutcomeBundle {
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
            lastValue: values[values.length - 1],
        };
    }

    /**
     * Legacy method, use "SmartContractQueriesController.parseQueryResponse()" instead.
     */
    parseUntypedQueryResponse(queryResponse: IContractQueryResponse): UntypedOutcomeBundle {
        let returnCode = new ReturnCode(queryResponse.returnCode.toString());

        return {
            returnCode: returnCode,
            returnMessage: queryResponse.returnMessage,
            values: queryResponse.getReturnDataParts(),
        };
    }

    /**
     * Legacy method, use "SmartContractTransactionsOutcomeParser.parseExecute()" instead.
     */
    parseOutcome(transaction: ITransactionOnNetwork, endpoint: { output: IParameterDefinition[] }): TypedOutcomeBundle {
        const untypedBundle = this.parseUntypedOutcome(transaction);
        const typedBundle = this.parseOutcomeFromUntypedBundle(untypedBundle, endpoint);
        return typedBundle;
    }

    /**
     * @internal
     * For internal use only.
     */
    parseOutcomeFromUntypedBundle(bundle: UntypedOutcomeBundle, endpoint: { output: IParameterDefinition[] }) {
        const values = this.argsSerializer.buffersToValues(bundle.values, endpoint.output);

        return {
            returnCode: bundle.returnCode,
            returnMessage: bundle.returnMessage,
            values: values,
            firstValue: values[0],
            secondValue: values[1],
            thirdValue: values[2],
            lastValue: values[values.length - 1],
        };
    }

    /**
     * Legacy method, use "SmartContractTransactionsOutcomeParser.parseExecute()" instead.
     */
    parseUntypedOutcome(transaction: ITransactionOnNetwork): UntypedOutcomeBundle {
        let bundle: UntypedOutcomeBundle | null;

        let transactionMetadata = this.parseTransactionMetadata(transaction);

        bundle = this.createBundleOnSimpleMoveBalance(transaction);
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

    protected parseTransactionMetadata(transaction: ITransactionOnNetwork): TransactionMetadata {
        return new TransactionDecoder().getTransactionMetadata({
            sender: transaction.sender.bech32(),
            receiver: transaction.receiver.bech32(),
            data: transaction.data.toString("base64"),
            value: transaction.value.toString(),
        });
    }

    protected createBundleOnSimpleMoveBalance(transaction: ITransactionOnNetwork): UntypedOutcomeBundle | null {
        let noResults = transaction.contractResults.items.length == 0;
        let noLogs = transaction.logs.events.length == 0;

        if (noResults && noLogs) {
            return {
                returnCode: ReturnCode.None,
                returnMessage: ReturnCode.None.toString(),
                values: [],
            };
        }

        return null;
    }

    protected createBundleOnInvalidTransaction(transaction: ITransactionOnNetwork): UntypedOutcomeBundle | null {
        if (transaction.status.isInvalid()) {
            if (transaction.receipt.data) {
                return {
                    returnCode: ReturnCode.OutOfFunds,
                    returnMessage: transaction.receipt.data,
                    values: [],
                };
            }

            // If there's no receipt message, let other heuristics to handle the outcome (most probably, a log with "signalError" is emitted).
        }

        return null;
    }

    protected createBundleOnEasilyFoundResultWithReturnData(results: IContractResults): UntypedOutcomeBundle | null {
        let resultItemWithReturnData = results.items.find(
            (item) => item.nonce.valueOf() != 0 && item.data.startsWith("@"),
        );
        if (!resultItemWithReturnData) {
            return null;
        }

        let { returnCode, returnDataParts } = this.sliceDataFieldInParts(resultItemWithReturnData.data);
        let returnMessage = resultItemWithReturnData.returnMessage || returnCode.toString();

        return {
            returnCode: returnCode,
            returnMessage: returnMessage,
            values: returnDataParts,
        };
    }

    protected createBundleOnSignalError(logs: ITransactionLogs): UntypedOutcomeBundle | null {
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
            values: returnDataParts,
        };
    }

    protected createBundleOnTooMuchGasWarning(logs: ITransactionLogs): UntypedOutcomeBundle | null {
        let eventTooMuchGas = logs.findSingleOrNoneEvent(
            WellKnownEvents.OnWriteLog,
            (event) =>
                event.findFirstOrNoneTopic((topic) => topic.toString().startsWith(WellKnownTopics.TooMuchGas)) !=
                undefined,
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
            values: returnDataParts,
        };
    }

    protected createBundleOnWriteLogWhereFirstTopicEqualsAddress(
        logs: ITransactionLogs,
        address: IAddress,
    ): UntypedOutcomeBundle | null {
        let hexAddress = new Address(address.bech32()).hex();

        let eventWriteLogWhereTopicIsSender = logs.findSingleOrNoneEvent(
            WellKnownEvents.OnWriteLog,
            (event) => event.findFirstOrNoneTopic((topic) => topic.hex() == hexAddress) != undefined,
        );

        if (!eventWriteLogWhereTopicIsSender) {
            return null;
        }

        let { returnCode, returnDataParts } = this.sliceDataFieldInParts(eventWriteLogWhereTopicIsSender.data);
        let returnMessage = returnCode.toString();

        return {
            returnCode: returnCode,
            returnMessage: returnMessage,
            values: returnDataParts,
        };
    }

    /**
     * Override this method (in a subclass of {@link ResultsParser}) if the basic heuristics of the parser are not sufficient.
     */
    protected createBundleWithCustomHeuristics(
        _transaction: ITransactionOnNetwork,
        _transactionMetadata: TransactionMetadata,
    ): UntypedOutcomeBundle | null {
        return null;
    }

    protected createBundleWithFallbackHeuristics(
        transaction: ITransactionOnNetwork,
        transactionMetadata: TransactionMetadata,
    ): UntypedOutcomeBundle | null {
        let contractAddress = new Address(transactionMetadata.receiver);

        // Search the nested logs for matching events (writeLog):
        for (const resultItem of transaction.contractResults.items) {
            let writeLogWithReturnData = resultItem.logs.findSingleOrNoneEvent(WellKnownEvents.OnWriteLog, (event) => {
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
                    values: returnDataParts,
                };
            }
        }

        // Additional fallback heuristics (alter search constraints):
        for (const resultItem of transaction.contractResults.items) {
            let writeLogWithReturnData = resultItem.logs.findSingleOrNoneEvent(WellKnownEvents.OnWriteLog, (event) => {
                const addressIsContract = event.address.bech32() == contractAddress.toBech32();
                return addressIsContract;
            });

            if (writeLogWithReturnData) {
                const { returnCode, returnDataParts } = this.sliceDataFieldInParts(writeLogWithReturnData.data);
                const returnMessage = returnCode.toString();

                return {
                    returnCode: returnCode,
                    returnMessage: returnMessage,
                    values: returnDataParts,
                };
            }
        }

        return null;
    }

    protected sliceDataFieldInParts(data: string): { returnCode: ReturnCode; returnDataParts: Buffer[] } {
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

    /**
     * Legacy method, use "TransactionEventsParser.parseEvent()" instead.
     */
    parseEvent(transactionEvent: ITransactionEvent, eventDefinition: { inputs: IEventInputDefinition[] }): any {
        // We skip the first topic, because, for log entries emitted by smart contracts, that's the same as the event identifier. See:
        // https://github.com/multiversx/mx-chain-vm-go/blob/v1.5.27/vmhost/contexts/output.go#L283
        const topics = transactionEvent.topics.map((topic) => Buffer.from(topic.valueOf())).slice(1);

        // Before Sirius, there was no "additionalData" field on transaction logs.
        // After Sirius, the "additionalData" field includes the "data" field, as well (as the first element):
        // https://github.com/multiversx/mx-chain-go/blob/v1.6.18/process/transactionLog/process.go#L159
        // Right now, the logic below is duplicated (see "TransactionsConverter"). However, "ResultsParser" will be deprecated & removed at a later time.
        const legacyData = transactionEvent.dataPayload?.valueOf() || Buffer.from([]);
        const dataItems = transactionEvent.additionalData?.map((data) => Buffer.from(data.valueOf())) || [];

        if (dataItems.length === 0) {
            if (legacyData.length) {
                dataItems.push(Buffer.from(legacyData));
            }
        }

        return this.doParseEvent({ topics, dataItems, eventDefinition });
    }

    /**
     * @internal
     * For internal use only.
     *
     * Once the legacy "ResultParser" is deprecated & removed, this logic will be absorbed into "TransactionEventsParser".
     */
    doParseEvent(options: {
        topics: Buffer[];
        dataItems: Buffer[];
        eventDefinition: { inputs: IEventInputDefinition[] };
    }): any {
        const result: any = {};

        // "Indexed" ABI "event.inputs" correspond to "event.topics[1:]":
        const indexedInputs = options.eventDefinition.inputs.filter((input) => input.indexed);
        const decodedTopics = this.argsSerializer.buffersToValues(options.topics, indexedInputs);

        for (let i = 0; i < indexedInputs.length; i++) {
            result[indexedInputs[i].name] = decodedTopics[i].valueOf();
        }

        // "Non-indexed" ABI "event.inputs" correspond to "event.data":
        const nonIndexedInputs = options.eventDefinition.inputs.filter((input) => !input.indexed);
        const decodedDataParts = this.argsSerializer.buffersToValues(options.dataItems, nonIndexedInputs);

        for (let i = 0; i < nonIndexedInputs.length; i++) {
            result[nonIndexedInputs[i].name] = decodedDataParts[i].valueOf();
        }

        return result;
    }
}
