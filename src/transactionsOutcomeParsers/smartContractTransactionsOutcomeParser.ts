import { Address } from "../address";
import { ARGUMENTS_SEPARATOR } from "../constants";
import { Err } from "../errors";
import { IContractResultItem, ITransactionEvent, ITransactionOnNetwork } from "../interfaceOfNetwork";
import {
    ArgSerializer,
    EndpointDefinition,
    ResultsParser,
    ReturnCode,
    Type,
    UntypedOutcomeBundle,
} from "../smartcontracts";
import { SmartContractCallOutcome, TransactionOutcome, findEventsByIdentifier } from "./resources";

enum Events {
    SCDeploy = "SCDeploy",
    SignalError = "signalError",
    WriteLog = "writeLog",
}

interface IAbi {
    getEndpoint(name: string): EndpointDefinition;
}

interface IParameterDefinition {
    type: Type;
}

interface ILegacyResultsParser {
    parseOutcomeFromUntypedBundle(
        bundle: UntypedOutcomeBundle,
        endpoint: { output: IParameterDefinition[] },
    ): {
        values: any[];
        returnCode: { valueOf(): string };
        returnMessage: string;
    };
}

export class SmartContractTransactionsOutcomeParser {
    private readonly abi?: IAbi;
    private readonly legacyResultsParser: ILegacyResultsParser;

    constructor(options?: { abi?: IAbi; legacyResultsParser?: ILegacyResultsParser }) {
        this.abi = options?.abi;
        this.legacyResultsParser = options?.legacyResultsParser || new ResultsParser();
    }

    parseDeploy(
        options: { transactionOutcome: TransactionOutcome } | { transactionOnNetwork: ITransactionOnNetwork },
    ): {
        returnCode: string;
        returnMessage: string;
        contracts: {
            address: string;
            ownerAddress: string;
            codeHash: Uint8Array;
        }[];
    } {
        if ("transactionOutcome" in options) {
            return this.parseDeployGivenTransactionOutcome(options.transactionOutcome);
        }

        return this.parseDeployGivenTransactionOnNetwork(options.transactionOnNetwork);
    }

    /**
     * Legacy approach.
     */
    protected parseDeployGivenTransactionOutcome(transactionOutcome: TransactionOutcome): {
        returnCode: string;
        returnMessage: string;
        contracts: {
            address: string;
            ownerAddress: string;
            codeHash: Uint8Array;
        }[];
    } {
        const directCallOutcome = transactionOutcome.directSmartContractCallOutcome;
        const events = findEventsByIdentifier(transactionOutcome, Events.SCDeploy);
        const contracts = events.map((event) => this.parseScDeployEvent(event));

        return {
            returnCode: directCallOutcome.returnCode,
            returnMessage: directCallOutcome.returnMessage,
            contracts: contracts,
        };
    }

    protected parseDeployGivenTransactionOnNetwork(transactionOnNetwork: ITransactionOnNetwork): {
        returnCode: string;
        returnMessage: string;
        contracts: {
            address: string;
            ownerAddress: string;
            codeHash: Uint8Array;
        }[];
    } {
        const directCallOutcome = this.findDirectSmartContractCallOutcome(transactionOnNetwork);

        const events = transactionOnNetwork.logs.events
            .concat(transactionOnNetwork.contractResults.items.flatMap((result) => result.logs.events))
            .filter((event) => event.identifier === Events.SCDeploy);

        const contracts = events.map((event) =>
            this.parseScDeployEvent({
                topics: event.topics.map((topic) => Buffer.from(topic.hex(), "hex")),
            }),
        );

        return {
            returnCode: directCallOutcome.returnCode,
            returnMessage: directCallOutcome.returnMessage,
            contracts: contracts,
        };
    }

    private parseScDeployEvent(event: { topics: Uint8Array[] }): {
        address: string;
        ownerAddress: string;
        codeHash: Uint8Array;
    } {
        const topicForAddress = event.topics[0];
        const topicForOwnerAddress = event.topics[1];
        const topicForCodeHash = event.topics[2];

        const address = topicForAddress?.length ? new Address(topicForAddress).toBech32() : "";
        const ownerAddress = topicForOwnerAddress?.length ? new Address(topicForOwnerAddress).toBech32() : "";
        const codeHash = topicForCodeHash;

        return {
            address,
            ownerAddress,
            codeHash,
        };
    }

    parseExecute(
        options:
            | { transactionOutcome: TransactionOutcome; function?: string }
            | { transactionOnNetwork: ITransactionOnNetwork; function?: string },
    ): {
        values: any[];
        returnCode: string;
        returnMessage: string;
    } {
        if ("transactionOutcome" in options) {
            return this.parseExecuteGivenTransactionOutcome(options.transactionOutcome, options.function);
        }

        return this.parseExecuteGivenTransactionOnNetwork(options.transactionOnNetwork, options.function);
    }

    /**
     * Legacy approach.
     */
    protected parseExecuteGivenTransactionOutcome(
        transactionOutcome: TransactionOutcome,
        functionName?: string,
    ): {
        values: any[];
        returnCode: string;
        returnMessage: string;
    } {
        const directCallOutcome = transactionOutcome.directSmartContractCallOutcome;

        if (!this.abi) {
            return {
                values: directCallOutcome.returnDataParts,
                returnCode: directCallOutcome.returnCode,
                returnMessage: directCallOutcome.returnMessage,
            };
        }

        functionName = functionName || directCallOutcome.function;

        if (!functionName) {
            throw new Err(
                `Function name is not available in the transaction outcome, thus endpoint definition (ABI) cannot be picked (for parsing). Maybe provide the "function" parameter explicitly?`,
            );
        }

        const endpoint = this.abi.getEndpoint(functionName);

        const legacyUntypedBundle = {
            returnCode: new ReturnCode(directCallOutcome.returnCode),
            returnMessage: directCallOutcome.returnMessage,
            values: directCallOutcome.returnDataParts.map((part) => Buffer.from(part)),
        };

        const legacyTypedBundle = this.legacyResultsParser.parseOutcomeFromUntypedBundle(legacyUntypedBundle, endpoint);

        return {
            values: legacyTypedBundle.values.map((value) => value.valueOf()),
            returnCode: legacyTypedBundle.returnCode.toString(),
            returnMessage: legacyTypedBundle.returnMessage,
        };
    }

    protected parseExecuteGivenTransactionOnNetwork(
        transactionOnNetwork: ITransactionOnNetwork,
        functionName?: string,
    ): {
        values: any[];
        returnCode: string;
        returnMessage: string;
    } {
        const directCallOutcome = this.findDirectSmartContractCallOutcome(transactionOnNetwork);

        if (!this.abi) {
            return {
                values: directCallOutcome.returnDataParts,
                returnCode: directCallOutcome.returnCode,
                returnMessage: directCallOutcome.returnMessage,
            };
        }

        functionName = functionName || directCallOutcome.function;

        if (!functionName) {
            throw new Err(
                `Function name is not available in the transaction, thus endpoint definition (ABI) cannot be picked (for parsing). Maybe provide the "function" parameter explicitly?`,
            );
        }

        const argsSerializer = new ArgSerializer();
        const endpoint = this.abi.getEndpoint(functionName);
        const buffers = directCallOutcome.returnDataParts.map((part) => Buffer.from(part));
        const values = argsSerializer.buffersToValues(buffers, endpoint.output);

        return {
            returnCode: directCallOutcome.returnCode,
            returnMessage: directCallOutcome.returnMessage,
            values: values,
        };
    }

    protected findDirectSmartContractCallOutcome(
        transactionOnNetwork: ITransactionOnNetwork,
    ): SmartContractCallOutcome {
        let outcome = this.findDirectSmartContractCallOutcomeWithinSmartContractResults(transactionOnNetwork);
        if (outcome) {
            return outcome;
        }

        outcome = this.findDirectSmartContractCallOutcomeIfError(transactionOnNetwork);
        if (outcome) {
            return outcome;
        }

        outcome = this.findDirectSmartContractCallOutcomeWithinWriteLogEvents(transactionOnNetwork);
        if (outcome) {
            return outcome;
        }

        return new SmartContractCallOutcome({
            function: transactionOnNetwork.function,
            returnCode: "",
            returnMessage: "",
            returnDataParts: [],
        });
    }

    protected findDirectSmartContractCallOutcomeWithinSmartContractResults(
        transactionOnNetwork: ITransactionOnNetwork,
    ): SmartContractCallOutcome | null {
        const argSerializer = new ArgSerializer();
        const eligibleResults: IContractResultItem[] = [];

        for (const result of transactionOnNetwork.contractResults.items) {
            const matchesCriteriaOnData = result.data.startsWith(ARGUMENTS_SEPARATOR);
            const matchesCriteriaOnReceiver = result.receiver.bech32() === transactionOnNetwork.sender.bech32();
            const matchesCriteriaOnPreviousHash = result.previousHash === transactionOnNetwork.hash;

            const matchesCriteria = matchesCriteriaOnData && matchesCriteriaOnReceiver && matchesCriteriaOnPreviousHash;
            if (matchesCriteria) {
                eligibleResults.push(result);
            }
        }

        if (eligibleResults.length === 0) {
            return null;
        }

        if (eligibleResults.length > 1) {
            throw new Error(
                `More than one smart contract result (holding the return data) found for transaction: ${transactionOnNetwork.hash}`,
            );
        }

        const [result] = eligibleResults;
        const [_ignored, returnCode, ...returnDataParts] = argSerializer.stringToBuffers(result.data);

        return new SmartContractCallOutcome({
            function: transactionOnNetwork.function,
            returnCode: returnCode?.toString(),
            returnMessage: result.returnMessage || returnCode?.toString(),
            returnDataParts: returnDataParts,
        });
    }

    protected findDirectSmartContractCallOutcomeIfError(
        transactionOnNetwork: ITransactionOnNetwork,
    ): SmartContractCallOutcome | null {
        const argSerializer = new ArgSerializer();
        const eventIdentifier = Events.SignalError;
        const eligibleEvents: ITransactionEvent[] = [];

        // First, look in "logs":
        eligibleEvents.push(
            ...transactionOnNetwork.logs.events.filter((event) => event.identifier === eventIdentifier),
        );

        // Then, look in "logs" of "contractResults":
        for (const result of transactionOnNetwork.contractResults.items) {
            if (result.previousHash != transactionOnNetwork.hash) {
                continue;
            }

            eligibleEvents.push(...result.logs.events.filter((event) => event.identifier === eventIdentifier));
        }

        if (eligibleEvents.length === 0) {
            return null;
        }

        if (eligibleEvents.length > 1) {
            throw new Error(
                `More than one "${eventIdentifier}" event found for transaction: ${transactionOnNetwork.hash}`,
            );
        }

        const [event] = eligibleEvents;
        const data = event.dataPayload?.valueOf().toString() || "";
        const lastTopic = event.getLastTopic()?.toString();
        const parts = argSerializer.stringToBuffers(data);
        // Assumption: the last part is the return code.
        const returnCode = parts[parts.length - 1];

        return new SmartContractCallOutcome({
            function: transactionOnNetwork.function,
            returnCode: returnCode?.toString() || eventIdentifier,
            returnMessage: lastTopic || returnCode?.toString() || eventIdentifier,
            returnDataParts: [],
        });
    }

    protected findDirectSmartContractCallOutcomeWithinWriteLogEvents(
        transactionOnNetwork: ITransactionOnNetwork,
    ): SmartContractCallOutcome | null {
        const argSerializer = new ArgSerializer();
        const eventIdentifier = Events.WriteLog;
        const eligibleEvents: ITransactionEvent[] = [];

        // First, look in "logs":
        eligibleEvents.push(
            ...transactionOnNetwork.logs.events.filter((event) => event.identifier === eventIdentifier),
        );

        // Then, look in "logs" of "contractResults":
        for (const result of transactionOnNetwork.contractResults.items) {
            if (result.previousHash != transactionOnNetwork.hash) {
                continue;
            }

            eligibleEvents.push(...result.logs.events.filter((event) => event.identifier === eventIdentifier));
        }

        if (eligibleEvents.length === 0) {
            return null;
        }

        if (eligibleEvents.length > 1) {
            throw new Error(
                `More than one "${eventIdentifier}" event found for transaction: ${transactionOnNetwork.hash}`,
            );
        }

        const [event] = eligibleEvents;
        const data = event.dataPayload?.valueOf().toString() || "";
        const [_ignored, returnCode, ...returnDataParts] = argSerializer.stringToBuffers(data);

        return new SmartContractCallOutcome({
            function: transactionOnNetwork.function,
            returnCode: returnCode?.toString(),
            returnMessage: returnCode?.toString(),
            returnDataParts: returnDataParts,
        });
    }
}
