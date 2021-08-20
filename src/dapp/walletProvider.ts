import { IDappProvider } from "./interface";
import {
    WALLET_PROVIDER_CONNECT_URL,
    WALLET_PROVIDER_DISCONNECT_URL,
    WALLET_PROVIDER_SEND_TRANSACTION_URL,
    WALLET_PROVIDER_SIGN_TRANSACTION_URL,
} from "./constants";
import { Transaction } from "../transaction";
import { SignableMessage } from "../signableMessage";
import { ErrNotImplemented } from "../errors";

interface TransactionMessage {
    receiver: string;
    value: string;
    gasPrice?: number;
    gasLimit?: number;
    data?: string;
    nonce?: number;
}

export class WalletProvider implements IDappProvider {
    walletUrl: string;
    customId: string;
    mainFrame: HTMLIFrameElement | undefined;

    /**
     * Creates a new WalletProvider
     * @param walletURL
     * @param customId
     */
    constructor(walletURL: string = '', customId = '') {
        this.walletUrl = walletURL;
        this.customId = customId;
    }

    /**
     * Waits for the wallet iframe to ping that it has been initialised
     */
    async init(): Promise<boolean> {
        return true;
    }

    /**
     * Returns if the wallet iframe is up and running
     */
    isInitialized(): boolean {
        return true;
    }

    /**
     * Unlike isInitialized, isConnected returns true if the user alredy went through the login process
     *  and has the wallet session active
     */
    async isConnected(): Promise<boolean> {
        return false;
    }

    /**
     * Fetches the login hook url and redirects the client to the wallet login.
     */
    async login(options?: { callbackUrl?: string; token?: string }): Promise<string> {
        return new Promise<string>((resolve, _) => {
            resolve(WALLET_PROVIDER_CONNECT_URL);
        }).then((connectionUrl: string) => {
            let callbackUrl = `callbackUrl=${window.location.href}`;
            if (options && options.callbackUrl) {
                callbackUrl = `callbackUrl=${options.callbackUrl}`;
            }
            let token = '';
            if (options && options.token) {
                token = `&token=${options.token}`;
            }

            window.location.href = `${this.baseWalletUrl()}${connectionUrl}?${callbackUrl}${token}`;
            return window.location.href;
        }).catch(_ => {
            return '';
        });
    }

    /**
    * Fetches the logout hook url and redirects the client to the wallet logout.
    */
    async logout(options?: { callbackUrl?: string }): Promise<boolean> {
        return new Promise<string>((resolve, _) => {
            resolve(WALLET_PROVIDER_DISCONNECT_URL);
        }).then((connectionUrl: string) => {
            let callbackUrl = `callbackUrl=${window.location.href}`;
            if (options && options.callbackUrl) {
                callbackUrl = `callbackUrl=${options.callbackUrl}`;
            }
            
            window.location.href = `${this.baseWalletUrl()}${connectionUrl}?${callbackUrl}`;
            return true;
        }).catch(_ => {
            return false;
        });
    }

    /**
     * Returns currently connected address. Empty string if not connected
     */
    async getAddress(): Promise<string> {
        throw new Error('wallet provider is missing this functionality');
    }

    /**
     * Packs a {@link Transaction} and fetches correct redirect URL from the wallet API. Then redirects
     *   the client to the send transaction hook
     * @param transaction
     * @param options
     */
    async sendTransaction(transaction: Transaction, options?: { callbackUrl?: string }): Promise<Transaction> {
        return new Promise<string>((resolve, _) => {
            let plainTransaction = WalletProvider.prepareWalletTransaction(transaction);
            resolve(`${this.baseWalletUrl()}${WALLET_PROVIDER_SEND_TRANSACTION_URL}?${this.buildTransactionUrl(plainTransaction)}`);
        }).then((url: any) => {
            window.location.href = `${url}&callbackUrl=${options !== undefined && options.callbackUrl !== undefined ? options.callbackUrl : window.location.href}`;
            return transaction;
        });
    }

    /**
     * Packs a {@link Transaction} and fetches correct redirect URL from the wallet API. Then redirects
     *   the client to the sign transaction hook
     * @param transaction
     * @param options
     */
    async signTransaction(transaction: Transaction, options?: { callbackUrl?: string }): Promise<Transaction> {
        return new Promise<string>((resolve, _) => {
            let plainTransaction = WalletProvider.prepareWalletTransaction(transaction);
            resolve(`${this.baseWalletUrl()}${WALLET_PROVIDER_SIGN_TRANSACTION_URL}?${this.buildTransactionUrl(plainTransaction)}`);
        }).then((url: any) => {
            window.location.href = `${url}&callbackUrl=${options !== undefined && options.callbackUrl !== undefined ? options.callbackUrl : window.location.href}`;
            return transaction;
        });
    }

    /**
     * Method will be available once the ElrondWallet hook will be implemented
     * @param _
     */
    async signMessage(_: SignableMessage): Promise<SignableMessage> {
        throw new ErrNotImplemented();
    }

    static prepareWalletTransaction(transaction: Transaction): any {
        let plainTransaction = transaction.toPlainObject();

        // We adjust the fields, in order to make them compatible with what the wallet expected
        plainTransaction["nonce"] = transaction.getNonce().valueOf();
        plainTransaction["data"] = transaction.getData().valueOf().toString();
        plainTransaction["value"] = transaction.getValue().toString();
        plainTransaction["gasPrice"] = transaction.getGasPrice().valueOf();
        plainTransaction["gasLimit"] = transaction.getGasLimit().valueOf();

        return plainTransaction;
    }

    private buildTransactionUrl(transaction: TransactionMessage): string {
        let urlString = `receiver=${transaction.receiver}&value=${transaction.value}`;
        if (transaction.gasLimit) {
            urlString += `&gasLimit=${transaction.gasLimit}`;
        }
        if (transaction.gasPrice) {
            urlString += `&gasPrice=${transaction.gasPrice}`;
        }
        if (transaction.data) {
            urlString += `&data=${transaction.data}`;
        }
        if (transaction.nonce) {
            urlString += `&nonce=${transaction.nonce}`;
        }

        return urlString;
    }

    private baseWalletUrl(): string {
        const pathArray = this.walletUrl.split('/');
        const protocol = pathArray[0];
        const host = pathArray[2];
        return protocol + '//' + host;
    }
}
