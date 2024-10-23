import BigNumber from "bignumber.js";
import { TransactionOnNetwork } from "./networkProviders";

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
    gasPrice: number;
    gasLimit: number;
    data?: string;
    chainID: string;
    version: number;
    options?: number;
    signature?: string;
    guardianSignature?: string;
}

export interface ISignature {
    hex(): string;
}

// TODO: Reconsider this, either remove or update functions name
export interface IAddress {
    bech32(): string;
    pubkey(): Buffer;
}

export interface ITransactionValue {
    toString(): string;
}

export interface IAccountBalance {
    toString(): string;
}

export interface INonce {
    valueOf(): number;
}

export interface IChainID {
    valueOf(): string;
}

export interface IGasLimit {
    valueOf(): number;
}

export interface IGasPrice {
    valueOf(): number;
}

export interface ITransactionVersion {
    valueOf(): number;
}

export interface ITransactionOptions {
    valueOf(): number;
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

/**
 * @deprecated Use {@link ITokenTransfer} instead.
 */
export type ITokenPayment = ITokenTransfer;

export interface ITransaction {
    sender: string;
    receiver: string;
    gasLimit: bigint;
    chainID: string;
    nonce: bigint;
    value: bigint;
    senderUsername: string;
    receiverUsername: string;
    gasPrice: bigint;
    data: Uint8Array;
    version: number;
    options: number;
    guardian: string;
    signature: Uint8Array;
    guardianSignature: Uint8Array;
}
