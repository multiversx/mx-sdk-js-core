import { Transaction } from "../transaction";
import {SignableMessage} from "../signableMessage";

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

export interface IDappMessageEvent extends MessageEvent {
    data: {
        type: string;
        data: any;
        error: string;
    };
}
