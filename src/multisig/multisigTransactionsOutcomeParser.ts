import { TransactionOnNetwork } from "../core";
import { Address } from "../core/address";
import { Err } from "../core/errors";
import { TransactionEvent } from "../core/transactionEvents";
import { SmartContractCallOutcome, SmartContractResult } from "../transactionsOutcomeParsers/resources";

enum Events {
    MultisigDeploy = "MultisigDeploy",
    MultisigActionProp = "MultisigActionProposal",
    SignalError = "signalError",
    WriteLog = "writeLog",
}

/**
 * Parses the outcome of multisig contract operations
 */
export class MultisigTransactionsOutcomeParser {
    /**
     * Parses the outcome of creating a new multisig contract
     * @param transactionOnNetwork The completed transaction
     * @returns An array of objects containing the new contract addresses
     */
    parseDeployMultisigContract(transactionOnNetwork: TransactionOnNetwork): { contractAddress: Address }[] {
        const directCallOutcome = this.findDirectMultisigDeployOutcome(transactionOnNetwork);

        if (!directCallOutcome || directCallOutcome.returnCode !== "ok") {
            return [];
        }

        // Look for the deployment events
        const events = transactionOnNetwork.logs.events
            .concat(transactionOnNetwork.smartContractResults.flatMap((result) => result.logs.events))
            .filter((event) => event.identifier === Events.MultisigDeploy);

        return events.map((event) => {
            // Assuming the contract address is in the first topic
            const addressBytes = Buffer.from(event.topics[0]);
            const address = Address.newFromHex(addressBytes.toString("hex"));
            return { contractAddress: address };
        });
    }

    /**
     * Parses the outcome of a multisig action proposal
     * @param transactionOnNetwork The completed transaction
     * @returns The action ID that was created
     */
    parseActionProposal(transactionOnNetwork: TransactionOnNetwork): number {
        const directCallOutcome = this.findDirectMultisigCallOutcome(transactionOnNetwork);

        if (!directCallOutcome || directCallOutcome.returnCode !== "ok") {
            throw new Err("Failed to propose action: " + directCallOutcome.returnMessage);
        }

        if (directCallOutcome.returnDataParts.length === 0) {
            throw new Err("No action ID returned in the transaction outcome");
        }

        // Assuming the first return data part contains the action ID as bytes
        const actionIdBytes = directCallOutcome.returnDataParts[0];
        return parseInt(Buffer.from(actionIdBytes).toString("hex"), 16);
    }

    /**
     * Finds the direct smart contract call outcome from a transaction
     */
    protected findDirectMultisigCallOutcome(transactionOnNetwork: TransactionOnNetwork): SmartContractCallOutcome {
        let outcome = this.findDirectMultisigCallOutcomeWithinSmartContractResults(transactionOnNetwork);

        if (outcome) {
            return outcome;
        }

        outcome = this.findDirectMultisigCallOutcomeIfError(transactionOnNetwork);

        if (outcome) {
            return outcome;
        }

        outcome = this.findDirectMultisigCallOutcomeWithinWriteLogEvents(transactionOnNetwork);

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

    /**
     * Similar to findDirectSmartContractCallOutcome but specifically for multisig deploy operations
     */
    protected findDirectMultisigDeployOutcome(transactionOnNetwork: TransactionOnNetwork): SmartContractCallOutcome {
        return this.findDirectMultisigCallOutcome(transactionOnNetwork);
    }

    /**
     * Finds the call outcome within smart contract results
     */
    protected findDirectMultisigCallOutcomeWithinSmartContractResults(
        transactionOnNetwork: TransactionOnNetwork,
    ): SmartContractCallOutcome | null {
        // Similar implementation to SmartContractTransactionsOutcomeParser but adapted for multisig
        const eligibleResults: SmartContractResult[] = [];

        for (const result of transactionOnNetwork.smartContractResults) {
            const matchesCriteria =
                result.data.toString().startsWith("@") &&
                result.receiver.toBech32() === transactionOnNetwork.sender.toBech32();

            if (matchesCriteria) {
                eligibleResults.push(result);
            }
        }

        if (eligibleResults.length === 0) {
            return null;
        }

        if (eligibleResults.length > 1) {
            throw new Error(`More than one smart contract result found for transaction: ${transactionOnNetwork.hash}`);
        }

        const [result] = eligibleResults;
        const parts = result.data.toString().split("@").filter(Boolean);

        let returnCode = "ok";
        let returnMessage = "success";

        if (parts.length > 0) {
            returnCode = Buffer.from(parts[0], "hex").toString() || "ok";
        }

        if (result.raw["returnMessage"]) {
            returnMessage = result.raw["returnMessage"];
        }

        const returnDataParts = parts.slice(1).map((part) => Buffer.from(part, "hex"));

        return new SmartContractCallOutcome({
            function: transactionOnNetwork.function,
            returnCode: returnCode,
            returnMessage: returnMessage,
            returnDataParts: returnDataParts,
        });
    }

    /**
     * Finds the call outcome if there was an error
     */
    protected findDirectMultisigCallOutcomeIfError(
        transactionOnNetwork: TransactionOnNetwork,
    ): SmartContractCallOutcome | null {
        const eventIdentifier = Events.SignalError;
        const eligibleEvents: TransactionEvent[] = [];

        // First, look in "logs":
        eligibleEvents.push(
            ...transactionOnNetwork.logs.events.filter((event) => event.identifier === eventIdentifier),
        );

        // Then, look in "logs" of "contractResults":
        for (const result of transactionOnNetwork.smartContractResults) {
            eligibleEvents.push(...result.logs.events.filter((event) => event.identifier === eventIdentifier));
        }

        if (eligibleEvents.length === 0) {
            return null;
        }

        const [event] = eligibleEvents;
        const lastTopic = event.topics[event.topics.length - 1]?.toString();

        return new SmartContractCallOutcome({
            function: transactionOnNetwork.function,
            returnCode: "error",
            returnMessage: lastTopic || "Unknown error",
            returnDataParts: [],
        });
    }

    /**
     * Finds the call outcome within write log events
     */
    protected findDirectMultisigCallOutcomeWithinWriteLogEvents(
        transactionOnNetwork: TransactionOnNetwork,
    ): SmartContractCallOutcome | null {
        const eventIdentifier = Events.WriteLog;
        const eligibleEvents: TransactionEvent[] = [];

        // First, look in "logs":
        eligibleEvents.push(
            ...transactionOnNetwork.logs.events.filter((event) => event.identifier === eventIdentifier),
        );

        // Then, look in "logs" of "contractResults":
        for (const result of transactionOnNetwork.smartContractResults) {
            eligibleEvents.push(...result.logs.events.filter((event) => event.identifier === eventIdentifier));
        }

        if (eligibleEvents.length === 0) {
            return null;
        }

        const [event] = eligibleEvents;
        const data = Buffer.from(event.data).toString();
        const parts = data.split("@").filter(Boolean);

        let returnCode = "ok";
        if (parts.length > 0) {
            returnCode = Buffer.from(parts[0], "hex").toString() || "ok";
        }

        const returnDataParts = parts.slice(1).map((part) => Buffer.from(part, "hex"));

        return new SmartContractCallOutcome({
            function: transactionOnNetwork.function,
            returnCode: returnCode,
            returnMessage: returnCode,
            returnDataParts: returnDataParts,
        });
    }

    /**
     * Parses the outcome of a query to get the multisig contract's pending actions
     * @param queryResponse The query response
     * @returns The list of pending action IDs
     */
    parsePendingActionIds(queryResponse: string[]): number[] {
        try {
            if (!queryResponse || queryResponse.length === 0) {
                return [];
            }

            // Assuming each element in the response is a base64 encoded action ID
            return queryResponse.map((item) => {
                const buffer = Buffer.from(item, "base64");
                return parseInt(buffer.toString("hex"), 16);
            });
        } catch (error) {
            throw new Error(`Error parsing pending action IDs: ${error}`);
        }
    }

    /**
     * Parses the outcome of a query to get the multisig contract's board members
     * @param queryResponse The query response
     * @returns The list of board member addresses
     */
    parseBoardMembers(queryResponse: string[]): Address[] {
        if (!queryResponse || queryResponse.length === 0) {
            return [];
        }

        return queryResponse.map((item) => {
            const buffer = Buffer.from(item, "base64");
            return Address.newFromHex(buffer.toString("hex"));
        });
    }

    /**
     * Parses the outcome of a query to get the multisig contract's quorum
     * @param queryResponse The query response
     * @returns The quorum value
     */
    parseQuorum(queryResponse: string[]): number {
        if (!queryResponse || queryResponse.length === 0) {
            throw new Err("No return data available");
        }

        const buffer = Buffer.from(queryResponse[0], "base64");
        return parseInt(buffer.toString("hex"), 16);
    }
}
