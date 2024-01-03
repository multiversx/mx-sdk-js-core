import BigNumber from "bignumber.js";
import { ITransactionOnNetwork } from "./interfaceOfNetwork";

export interface ITransactionFetcher {
    /**
     * Fetches the state of a {@link Transaction}.
     */
    getTransaction(txHash: string): Promise<ITransactionOnNetwork>;
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

export interface ISignature { hex(): string; }
export interface IAddress { bech32(): string; }
export interface ITransactionValue { toString(): string; }
export interface IAccountBalance { toString(): string; }
export interface INonce { valueOf(): number; }
export interface IChainID { valueOf(): string; }
export interface IGasLimit { valueOf(): number; }
export interface IGasPrice { valueOf(): number; }
export interface ITransactionVersion { valueOf(): number; }
export interface ITransactionOptions { valueOf(): number; }

export interface ITransactionPayload {
    length(): number;
    encoded(): string;
    toString(): string;
    valueOf(): Buffer;
}

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

export interface ITransactionNext {
    sender: string;
    receiver: string;
    gasLimit: BigNumber.Value;
    chainID: string;
    nonce: BigNumber.Value;
    value: BigNumber.Value;
    senderUsername: string;
    receiverUsername: string;
    gasPrice: BigNumber.Value;
    data: Uint8Array;
    version: number;
    options: number;
    guardian: string;
    signature: Uint8Array;
    guardianSignature: Uint8Array;
  }
