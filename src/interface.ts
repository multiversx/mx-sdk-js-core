import BigNumber from "bignumber.js";
import { TransactionOnNetwork } from "./transactionOnNetwork";

export interface ITransactionFetcher {
    /**
     * Fetches the state of a {@link Transaction}.
     */
    getTransaction(txHash: string): Promise<TransactionOnNetwork>;
}

export interface IPlainTransactionObject {
    nonce: number;
    value: string;
    receiver: string;
    sender: string;
    receiverUsername?: string;
    senderUsername?: string;
    guardian?: string;
    relayer?: string;
    gasPrice: number;
    gasLimit: number;
    data?: string;
    chainID: string;
    version: number;
    options?: number;
    signature?: string;
    guardianSignature?: string;
    relayerSignature?: string;
}

export interface ITransactionPayload {
    length(): number;
    encoded(): string;
    toString(): string;
    valueOf(): Buffer;
}

/**
 * Legacy interface. The class `TokenTransfer` can be used instead, where necessary.
 */
export interface ITokenTransfer {
    readonly tokenIdentifier: string;
    readonly nonce: number;
    readonly amountAsBigInteger: BigNumber.Value;
    valueOf(): BigNumber.Value;
}
