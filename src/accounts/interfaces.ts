import { Message, Transaction } from "../core";
import { Address } from "../core/address";

export interface IAccount {
    readonly address: Address;

    sign(data: Uint8Array): Promise<Uint8Array>;
    signTransaction(transaction: Transaction): Promise<Uint8Array>;
    verifyTransaction(transaction: Transaction, signature: Uint8Array): Promise<boolean>;
    signMessage(message: Message): Promise<Uint8Array>;
    verifyMessage(message: Message, signature: Uint8Array): Promise<boolean>;
}
