import { Address } from "../address";
import { ARGUMENTS_SEPARATOR } from "../constants";
import { IPlainTransactionObject, ITransaction } from "../interface";
import { IContractResultItem, ITransactionEvent, ITransactionOnNetwork } from "../interfaceOfNetwork";
import { TransactionLogsOnNetwork, TransactionReceipt, TransactionStatus } from "../networkProviders";
import { ArgSerializer } from "../smartcontracts";
import { Transaction } from "../transaction";
import {
    SmartContractCallOutcome,
    SmartContractResult,
    TransactionEvent,
    TransactionLogs,
    TransactionOutcome,
} from "../transactionsOutcomeParsers/resources";

export class TransactionsConverter {
    public transactionToPlainObject(transaction: ITransaction): IPlainTransactionObject {
        const plainObject = {
            nonce: Number(transaction.nonce),
            value: transaction.value.toString(),
            receiver: transaction.receiver,
            sender: transaction.sender,
            senderUsername: this.toBase64OrUndefined(transaction.senderUsername),
            receiverUsername: this.toBase64OrUndefined(transaction.receiverUsername),
            gasPrice: Number(transaction.gasPrice),
            gasLimit: Number(transaction.gasLimit),
            data: this.toBase64OrUndefined(transaction.data),
            chainID: transaction.chainID.valueOf(),
            version: transaction.version,
            options: transaction.options == 0 ? undefined : transaction.options,
            guardian: transaction.guardian ? transaction.guardian : undefined,
            signature: this.toHexOrUndefined(transaction.signature),
            guardianSignature: this.toHexOrUndefined(transaction.guardianSignature),
            relayer: transaction.relayer ? transaction.relayer : undefined,
            innerTransactions: transaction.innerTransactions.length
                ? transaction.innerTransactions.map((tx) => this.transactionToPlainObject(tx))
                : undefined,
        };

        return plainObject;
    }

    private toBase64OrUndefined(value?: string | Uint8Array) {
        return value && value.length ? Buffer.from(value).toString("base64") : undefined;
    }

    private toHexOrUndefined(value?: Uint8Array) {
        return value && value.length ? Buffer.from(value).toString("hex") : undefined;
    }

    public plainObjectToTransaction(object: IPlainTransactionObject): Transaction {
        const transaction = new Transaction({
            nonce: BigInt(object.nonce),
            value: BigInt(object.value || ""),
            receiver: object.receiver,
            receiverUsername: this.bufferFromBase64(object.receiverUsername).toString(),
            sender: object.sender,
            senderUsername: this.bufferFromBase64(object.senderUsername).toString(),
            guardian: object.guardian,
            gasPrice: BigInt(object.gasPrice),
            gasLimit: BigInt(object.gasLimit),
            data: this.bufferFromBase64(object.data),
            chainID: String(object.chainID),
            version: Number(object.version),
            options: Number(object.options),
            signature: this.bufferFromHex(object.signature),
            guardianSignature: this.bufferFromHex(object.guardianSignature),
            relayer: object.relayer,
            innerTransactions: object.innerTransactions
                ? object.innerTransactions.map((tx) => this.plainObjectToTransaction(tx))
                : undefined,
        });

        return transaction;
    }

    private bufferFromBase64(value?: string) {
        return Buffer.from(value || "", "base64");
    }

    private bufferFromHex(value?: string) {
        return Buffer.from(value || "", "hex");
    }

    /**
     * Summarizes the outcome of a transaction on the network, and maps it to the "standard" resources (according to the sdk-specs).
     *
     * In the future, this converter function will become obsolete,
     * as the impedance mismatch between the network components and the "core" components will be reduced.
     */
    public transactionOnNetworkToOutcome(transactionOnNetwork: ITransactionOnNetwork): TransactionOutcome {
        const callOutcome = this.findDirectSmartContractCallOutcome(transactionOnNetwork);
        const contractResults = transactionOnNetwork.contractResults.items.map((result) =>
            this.smartContractResultOnNetworkToSmartContractResult(result),
        );

        const logs = new TransactionLogs({
            address: transactionOnNetwork.logs.address.bech32(),
            events: transactionOnNetwork.logs.events.map((event) => this.eventOnNetworkToEvent(event)),
        });

        return new TransactionOutcome({
            logs: logs,
            smartContractResults: contractResults,
            directSmartContractCallOutcome: callOutcome,
        });
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
            const matchesCriteriaOnSender = result.sender.bech32() === transactionOnNetwork.sender.bech32();
            const matchesCriteriaOnPreviousHash = result.previousHash === transactionOnNetwork.hash;

            const matchesCriteria = matchesCriteriaOnData && matchesCriteriaOnSender && matchesCriteriaOnPreviousHash;
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
        const eventIdentifier = "signalError";
        const eligibleEvents: ITransactionEvent[] = [];

        // First, look in "logs":
        for (const event of transactionOnNetwork.logs.events) {
            if (event.identifier === eventIdentifier) {
                eligibleEvents.push(event);
            }
        }

        // Then, look in "logs" of "contractResults":
        for (const result of transactionOnNetwork.contractResults.items) {
            for (const event of result.logs.events) {
                if (result.previousHash === result.hash) {
                    if (event.identifier === eventIdentifier) {
                        eligibleEvents.push(event);
                    }
                }
            }
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
        const lastTopic = event.getLastTopic().toString();
        const [_ignored, returnCode, ...returnDataParts] = argSerializer.stringToBuffers(data);

        return new SmartContractCallOutcome({
            function: transactionOnNetwork.function,
            returnCode: returnCode?.toString(),
            returnMessage: lastTopic || returnCode?.toString(),
            returnDataParts: returnDataParts,
        });
    }

    protected findDirectSmartContractCallOutcomeWithinWriteLogEvents(
        transactionOnNetwork: ITransactionOnNetwork,
    ): SmartContractCallOutcome | null {
        const argSerializer = new ArgSerializer();
        const eventIdentifier = "writeLog";
        const eligibleEvents: ITransactionEvent[] = [];

        // First, look in "logs":
        for (const event of transactionOnNetwork.logs.events) {
            if (event.identifier === eventIdentifier) {
                eligibleEvents.push(event);
            }
        }

        // Then, look in "logs" of "contractResults":
        for (const result of transactionOnNetwork.contractResults.items) {
            for (const event of result.logs.events) {
                if (result.previousHash === result.hash) {
                    if (event.identifier === eventIdentifier) {
                        eligibleEvents.push(event);
                    }
                }
            }
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

    private smartContractResultOnNetworkToSmartContractResult(
        resultOnNetwork: IContractResultItem,
    ): SmartContractResult {
        return new SmartContractResult({
            sender: resultOnNetwork.sender.bech32(),
            receiver: resultOnNetwork.receiver.bech32(),
            data: Buffer.from(resultOnNetwork.data),
            logs: new TransactionLogs({
                address: resultOnNetwork.logs.address.bech32(),
                events: resultOnNetwork.logs.events.map((event) => this.eventOnNetworkToEvent(event)),
            }),
        });
    }

    private eventOnNetworkToEvent(eventOnNetwork: ITransactionEvent): TransactionEvent {
        // Before Sirius, there was no "additionalData" field on transaction logs.
        // After Sirius, the "additionalData" field includes the payload of the legacy "data" field, as well (as its first element):
        // https://github.com/multiversx/mx-chain-go/blob/v1.6.18/process/transactionLog/process.go#L159
        const legacyData = eventOnNetwork.dataPayload?.valueOf() || Buffer.from(eventOnNetwork.data || "");
        const dataItems = eventOnNetwork.additionalData?.map((data) => Buffer.from(data.valueOf())) || [];

        if (dataItems.length === 0) {
            if (legacyData.length) {
                dataItems.push(Buffer.from(legacyData));
            }
        }

        return new TransactionEvent({
            address: eventOnNetwork.address.bech32(),
            identifier: eventOnNetwork.identifier,
            topics: eventOnNetwork.topics.map((topic) => Buffer.from(topic.hex(), "hex")),
            dataItems: dataItems,
        });
    }

    /**
     * Generally speaking, useful for Relayed V3 transactions.
     */
    public transactionOnNetworkToOutcomesOfInnerTransactions(
        transactionOnNetwork: ITransactionOnNetwork,
    ): TransactionOutcome[] {
        const innerTransactions = transactionOnNetwork.innerTransactions || [];
        const outcomes: TransactionOutcome[] = [];

        for (let index = 0; index < innerTransactions.length; index++) {
            const innerTransactionAsTransactionOnNetwork = this.convertInnerTransactionToTransactionOnNetwork(
                transactionOnNetwork,
                index,
            );

            try {
                const outcome = this.transactionOnNetworkToOutcome(innerTransactionAsTransactionOnNetwork);
                outcomes.push(outcome);
            } catch (error) {
                console.warn(
                    `Failed to convert inner transaction #${index} of ${transactionOnNetwork.hash} to outcome: ${error}`,
                );

                outcomes.push(new TransactionOutcome({}));
            }
        }

        return outcomes;
    }

    /**
     * Artificially converts an inner transaction (of a relayed V3) to a transaction on the network,
     * by matching the inner transaction with its corresponding smart contract result.
     */
    private convertInnerTransactionToTransactionOnNetwork(
        parentTransactionOnNetwork: ITransactionOnNetwork,
        innerTransactionIndex: number,
    ): ITransactionOnNetwork {
        if (
            !parentTransactionOnNetwork.innerTransactions ||
            parentTransactionOnNetwork.innerTransactions.length <= innerTransactionIndex
        ) {
            throw new Error("Inner transaction index is out of bounds");
        }

        const innerTransaction = parentTransactionOnNetwork.innerTransactions[innerTransactionIndex];

        const rootSmartContractResultCandidates = parentTransactionOnNetwork.contractResults.items.filter(
            (result, _index) =>
                result.previousHash === parentTransactionOnNetwork.hash &&
                result.sender.bech32() == innerTransaction.sender &&
                result.nonce == Number(innerTransaction.nonce),
        );

        if (rootSmartContractResultCandidates.length !== 1) {
            console.warn(
                `Failed to find the root smart contract result for inner transaction #${innerTransactionIndex} of ${parentTransactionOnNetwork.hash}.`,
            );

            return {
                hash: `${parentTransactionOnNetwork.hash}-${innerTransactionIndex}`,
                type: "",
                status: TransactionStatus.createUnknown(),
                value: innerTransaction.value.toString(),
                receiver: Address.newFromBech32(innerTransaction.receiver),
                sender: Address.newFromBech32(innerTransaction.sender),
                data: Buffer.from(innerTransaction.data),
                contractResults: { items: [] },
                logs: new TransactionLogsOnNetwork({}),
                receipt: new TransactionReceipt(),
            };
        }

        const rootSmartContractResult = rootSmartContractResultCandidates[0];
        const remainingSmartContractResults = parentTransactionOnNetwork.contractResults.items.filter(
            (result, _index) => result.previousHash === rootSmartContractResult.hash,
        );

        return {
            // Artificially created hash.
            hash: `${parentTransactionOnNetwork.hash}-${innerTransactionIndex}`,
            type: "",
            status: TransactionStatus.createUnknown(),
            value: innerTransaction.value.toString(),
            receiver: Address.newFromBech32(innerTransaction.receiver),
            sender: Address.newFromBech32(innerTransaction.sender),
            data: Buffer.from(innerTransaction.data),
            contractResults: { items: remainingSmartContractResults },
            // As "logs", we attach the ones from the root smart contract result.
            logs: rootSmartContractResult.logs,
            receipt: new TransactionReceipt(),
        };
    }
}
