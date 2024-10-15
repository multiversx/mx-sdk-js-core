import { IPlainTransactionObject, ITransaction } from "../interface";
import { IContractResultItem, ITransactionEvent, ITransactionOnNetwork } from "../interfaceOfNetwork";
import { ResultsParser } from "../smartcontracts";
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
     * @deprecated Where {@link TransactionOutcome} was needed (throughout the SDK), pass the {@link ITransactionOnNetwork} object instead.
     *
     * Summarizes the outcome of a transaction on the network, and maps it to the "standard" resources (according to the sdk-specs).
     *
     * In the future, this converter function will become obsolete,
     * as the impedance mismatch between the network components and the "core" components will be reduced.
     */
    public transactionOnNetworkToOutcome(transactionOnNetwork: ITransactionOnNetwork): TransactionOutcome {
        // In the future, this will not be needed because the transaction, as returned from the API,
        // will hold the data corresponding to the direct smart contract call outcome (in case of smart contract calls).
        const legacyResultsParser = new ResultsParser();
        const callOutcomeBundle = legacyResultsParser.parseUntypedOutcome(transactionOnNetwork);
        const callOutcome = new SmartContractCallOutcome({
            function: transactionOnNetwork.function,
            returnCode: callOutcomeBundle.returnCode.toString(),
            returnMessage: callOutcomeBundle.returnMessage,
            returnDataParts: callOutcomeBundle.values,
        });

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
}
