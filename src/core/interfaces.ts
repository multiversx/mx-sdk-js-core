import { Address, Message, Transaction, TransactionOnNetwork } from ".";

export interface IAccount {
    readonly address: Address;

    sign(data: Uint8Array): Promise<Uint8Array>;
    signTransaction(transaction: Transaction): Promise<Uint8Array>;
    verifyTransactionSignature(transaction: Transaction, signature: Uint8Array): Promise<boolean>;
    signMessage(message: Message): Promise<Uint8Array>;
    verifyMessageSignature(message: Message, signature: Uint8Array): Promise<boolean>;
}

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

export interface INetworkConfig {
    minGasLimit: bigint;
    gasPerDataByte: bigint;
    gasPriceModifier: number;
    chainID: string;
}
