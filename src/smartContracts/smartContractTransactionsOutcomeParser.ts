import { AbiRegistry, ArgSerializer } from "../abi";
import { Address } from "../address";
import { ARGUMENTS_SEPARATOR } from "../constants";
import { Err } from "../errors";
import { TransactionEvent } from "../transactionEvents";
import { TransactionOnNetwork } from "../transactionOnNetwork";
import { SmartContractCallOutcome, SmartContractResult } from "../transactionsOutcomeParsers/resources";

enum Events {
    SCDeploy = "SCDeploy",
    SignalError = "signalError",
    WriteLog = "writeLog",
}

export class SmartContractTransactionsOutcomeParser {
    private readonly abi?: AbiRegistry;

    constructor(options?: { abi?: AbiRegistry }) {
        this.abi = options?.abi;
    }

    parseDeploy(options: { transactionOnNetwork: TransactionOnNetwork }): {
        returnCode: string;
        returnMessage: string;
        contracts: {
            address: string;
            ownerAddress: string;
            codeHash: Uint8Array;
        }[];
    } {
        return this.parseDeployGivenTransactionOnNetwork(options.transactionOnNetwork);
    }

    protected parseDeployGivenTransactionOnNetwork(transactionOnNetwork: TransactionOnNetwork): {
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
            .concat(transactionOnNetwork.smartContractResults.flatMap((result) => result.logs.events))
            .filter((event) => event.identifier === Events.SCDeploy);

        const contracts = events.map((event) =>
            this.parseScDeployEvent({
                topics: event.topics.map((topic) => Buffer.from(topic)),
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
        const topicForAddress = Buffer.from(event.topics[0].toString(), "base64").toString("hex");
        const topicForOwnerAddress = Buffer.from(event.topics[1].toString(), "base64").toString("hex");
        const topicForCodeHash = Buffer.from(event.topics[2].toString(), "base64");
        const address = topicForAddress?.length ? new Address(topicForAddress).toBech32() : "";
        const ownerAddress = topicForOwnerAddress?.length ? new Address(topicForOwnerAddress).toBech32() : "";
        const codeHash = topicForCodeHash;

        return {
            address,
            ownerAddress,
            codeHash,
        };
    }

    parseExecute(options: { transactionOnNetwork: TransactionOnNetwork; function?: string }): {
        values: any[];
        returnCode: string;
        returnMessage: string;
    } {
        return this.parseExecuteGivenTransactionOnNetwork(options.transactionOnNetwork, options.function);
    }

    protected parseExecuteGivenTransactionOnNetwork(
        transactionOnNetwork: TransactionOnNetwork,
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
            values: values.map((value) => value.valueOf()),
        };
    }

    protected findDirectSmartContractCallOutcome(transactionOnNetwork: TransactionOnNetwork): SmartContractCallOutcome {
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
        transactionOnNetwork: TransactionOnNetwork,
    ): SmartContractCallOutcome | null {
        const argSerializer = new ArgSerializer();
        const eligibleResults: SmartContractResult[] = [];

        for (const result of transactionOnNetwork.smartContractResults) {
            const matchesCriteriaOnData = result.data.toString().startsWith(ARGUMENTS_SEPARATOR);
            const matchesCriteriaOnReceiver = result.receiver.bech32() === transactionOnNetwork.sender.bech32();
            const matchesCriteriaOnPreviousHash = result;

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
        const [_ignored, returnCode, ...returnDataParts] = argSerializer.stringToBuffers(result.data.toString());
        return new SmartContractCallOutcome({
            function: transactionOnNetwork.function,
            returnCode: returnCode?.toString(),
            returnMessage: result.raw["returnMessage"] || returnCode?.toString(),
            returnDataParts: returnDataParts,
        });
    }

    protected findDirectSmartContractCallOutcomeIfError(
        transactionOnNetwork: TransactionOnNetwork,
    ): SmartContractCallOutcome | null {
        const argSerializer = new ArgSerializer();
        const eventIdentifier = Events.SignalError;
        const eligibleEvents: TransactionEvent[] = [];

        // First, look in "logs":
        eligibleEvents.push(
            ...transactionOnNetwork.logs.events.filter((event) => event.identifier === eventIdentifier),
        );

        // Then, look in "logs" of "contractResults":
        for (const result of transactionOnNetwork.smartContractResults) {
            if (result.raw["prevTxHash"] != transactionOnNetwork.hash) {
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
        const data = Buffer.from(event.data).toString();
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
        transactionOnNetwork: TransactionOnNetwork,
    ): SmartContractCallOutcome | null {
        const argSerializer = new ArgSerializer();
        const eventIdentifier = Events.WriteLog;
        const eligibleEvents: TransactionEvent[] = [];

        // First, look in "logs":
        eligibleEvents.push(
            ...transactionOnNetwork.logs.events.filter((event) => event.identifier === eventIdentifier),
        );

        // Then, look in "logs" of "contractResults":
        for (const result of transactionOnNetwork.smartContractResults) {
            if (result.raw["prevTxHash"] != transactionOnNetwork.hash) {
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
        const data = Buffer.from(event.data).toString();
        const [_ignored, returnCode, ...returnDataParts] = argSerializer.stringToBuffers(data);

        return new SmartContractCallOutcome({
            function: transactionOnNetwork.function,
            returnCode: returnCode?.toString(),
            returnMessage: returnCode?.toString(),
            returnDataParts: returnDataParts,
        });
    }
}
