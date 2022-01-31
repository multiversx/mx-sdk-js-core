import { Transaction } from "../transaction";
import {SignableMessage} from "../signableMessage";
import {Signature} from "../signature";

export interface IDappProvider {
    init(): Promise<boolean>;
    login(options?: {callbackUrl?: string; token?: string; addressIndex?: number}): Promise<string>;
    logout(options?: {callbackUrl?: string}): Promise<boolean>;
    getAddress(): Promise<string>;
    isInitialized(): boolean;
    isConnected(): Promise<boolean>;
    sendTransaction(transaction: Transaction, options?: {callbackUrl?: string}): Promise<Transaction>;
    signTransaction(transaction: Transaction, options?: {callbackUrl?: string}): Promise<Transaction>;
    signTransactions(transaction: Array<Transaction>, options?: {callbackUrl?: string}): Promise<Array<Transaction>>;
    signMessage(transaction: SignableMessage, options?: {callbackUrl?: string}): Promise<SignableMessage>;
}

export interface IHWProvider extends IDappProvider {
    getAccounts(startIndex: number, length: number): Promise<string[]>;
    tokenLogin(options: { token: Buffer, addressIndex?: number }): Promise<{signature: Signature; address: string}>;
}

export interface IDappMessageEvent extends MessageEvent {
    data: {
        type: string;
        data: any;
        error: string;
    };
}

export interface IHWElrondApp {
    getAddress(
        account: number,
        index: number,
        display?: boolean
    ): Promise<{
        publicKey: string;
        address: string;
        chainCode?: string;
    }>;
    setAddress(
        account: number,
        index: number,
        display?: boolean,
    ): Promise<any>;
    signTransaction(rawTx: Buffer, usingHash: boolean): Promise<string>;
    signMessage(rawMessage: Buffer): Promise<string>;
    getAppConfiguration(): Promise<{
        version: string;
        contractData: number;
        accountIndex: number;
        addressIndex: number;
    }>;
    getAddressAndSignAuthToken(
      account: number,
      index: number,
      token: Buffer,
    ): Promise<{
        address: string,
        signature: string,
    }>;
}
