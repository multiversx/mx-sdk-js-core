import qs from "qs";
import { IDappProvider } from "./interface";
import {
    WALLET_PROVIDER_CALLBACK_PARAM,
    WALLET_PROVIDER_CALLBACK_PARAM_TX_SIGNED,
    WALLET_PROVIDER_CONNECT_URL,
    WALLET_PROVIDER_DISCONNECT_URL,
    WALLET_PROVIDER_SEND_TRANSACTION_URL,
    WALLET_PROVIDER_SIGN_TRANSACTION_URL,
} from "./constants";
import { Transaction } from "../transaction";
import { SignableMessage } from "../signableMessage";
import {ErrInvalidTxSignReturnValue, ErrNotImplemented} from "../errors";
import {Nonce, Balance, Address, GasPrice, GasLimit, TransactionPayload, ChainID, TransactionVersion} from "../";
import {Signature} from "../signature";

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

    /**
     * Creates a new WalletProvider
     * @param walletURL
     */
    constructor(walletURL: string = '') {
        this.walletUrl = walletURL;
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
        let callbackUrl = `callbackUrl=${window.location.href}`;
        if (options && options.callbackUrl) {
            callbackUrl = `callbackUrl=${options.callbackUrl}`;
        }

        let token = '';
        if (options && options.token) {
            token = `&token=${options.token}`;
        }

        window.location.href = `${this.baseWalletUrl()}${WALLET_PROVIDER_CONNECT_URL}?${callbackUrl}${token}`;
        return window.location.href;
    }

    /**
    * Fetches the logout hook url and redirects the client to the wallet logout.
    */
    async logout(options?: { callbackUrl?: string }): Promise<boolean> {
        let callbackUrl = `callbackUrl=${window.location.href}`;
        if (options && options.callbackUrl) {
            callbackUrl = `callbackUrl=${options.callbackUrl}`;
        }

        window.location.href = `${this.baseWalletUrl()}${WALLET_PROVIDER_DISCONNECT_URL}?${callbackUrl}`;
        return true;
    }

    /**
     * Returns currently connected address. Empty string if not connected
     */
    async getAddress(): Promise<string> {
        throw new ErrNotImplemented();
    }

    /**
     * Packs a {@link Transaction} and fetches correct redirect URL from the wallet API. Then redirects
     *   the client to the send transaction hook
     * @param transaction
     * @param options
     */
    async sendTransaction(transaction: Transaction, options?: { callbackUrl?: string }): Promise<Transaction> {
        let plainTransaction = WalletProvider.prepareWalletTransaction(transaction);
        let url = `${this.baseWalletUrl()}${WALLET_PROVIDER_SEND_TRANSACTION_URL}?${this.buildTransactionUrl(plainTransaction)}`;

        window.location.href = `${url}&callbackUrl=${options !== undefined && options.callbackUrl !== undefined ? options.callbackUrl : window.location.href}`;
        return transaction;
    }

    /**
     * Packs an array of {$link Transaction} and redirects to the correct transaction sigining hook
     *
     * @param transactions
     * @param options
     */
    async signTransactions(transactions: Transaction[], options?: { callbackUrl?: string }): Promise<Transaction[]> {
        const jsonToSend: any = {};
        transactions.map(tx => {
            let plainTx =  WalletProvider.prepareWalletTransaction(tx);
            for ( let txProp in plainTx ) {
                if (plainTx.hasOwnProperty(txProp) && !jsonToSend.hasOwnProperty(txProp)) {
                    jsonToSend[txProp] = [];
                }

                jsonToSend[txProp].push(plainTx[txProp]);
            }
        });

        let url = `${this.baseWalletUrl()}${WALLET_PROVIDER_SIGN_TRANSACTION_URL}?${qs.stringify(jsonToSend)}`;
        window.location.href = `${url}&callbackUrl=${options !== undefined && options.callbackUrl !== undefined ? options.callbackUrl : window.location.href}`;
        return transactions;
    }

    /**
     * Packs a {@link Transaction} and fetches correct redirect URL from the wallet API. Then redirects
     *   the client to the sign transaction hook
     * @param transaction
     * @param options
     */
    async signTransaction(transaction: Transaction, options?: { callbackUrl?: string }): Promise<Transaction> {
        let plainTransaction = WalletProvider.prepareWalletTransaction(transaction);
        let url = `${this.baseWalletUrl()}${WALLET_PROVIDER_SIGN_TRANSACTION_URL}?${this.buildTransactionUrl(plainTransaction)}`;

        window.location.href = `${url}&callbackUrl=${options !== undefined && options.callbackUrl !== undefined ? options.callbackUrl : window.location.href}`;
        return transaction;
    }

    getTransactionsFromWalletUrl(): Transaction[] {
        const transactions: Transaction[] = [];
        const urlParams = qs.parse("nonce[0]=66&nonce[1]=67&nonce[2]=68&nonce[3]=69&value[0]=1000000000000000000&value[1]=0&value[2]=0&value[3]=0&receiver[0]=erd1qqqqqqqqqqqqqpgqd7fm8xm5lpgcqh6zwk08474md4qly4sx0n4s63hp6c&receiver[1]=erd1qqqqqqqqqqqqqpgq3gmttefd840klya8smn7zeae402w2esw0n4sm8m04f&receiver[2]=erd1qqqqqqqqqqqqqpgq3gmttefd840klya8smn7zeae402w2esw0n4sm8m04f&receiver[3]=erd1qqqqqqqqqqqqqpgq3gmttefd840klya8smn7zeae402w2esw0n4sm8m04f&sender[0]=erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu&sender[1]=erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu&sender[2]=erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu&sender[3]=erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu&gasPrice[0]=1000000000&gasPrice[1]=1000000000&gasPrice[2]=1000000000&gasPrice[3]=1000000000&gasLimit[0]=8000000&gasLimit[1]=70000000&gasLimit[2]=70000000&gasLimit[3]=50000000&data[0]=ESDTTransfer%405745474c442d383836303061%400de0b6b3a7640000%40616363657074457364745061796d656e74&data[1]=ESDTTransfer%405745474c442d383836303061%400de0b6b3a7640000%40616363657074457364745061796d656e74&data[2]=ESDTTransfer%405745474c442d383836303061%400de0b6b3a7640000%40616363657074457364745061796d656e74&data[3]=ESDTTransfer%405745474c442d383836303061%400de0b6b3a7640000%40616363657074457364745061796d656e74&chainID[0]=D&chainID[1]=D&chainID[2]=D&chainID[3]=D&version[0]=1&version[1]=1&version[2]=1&version[3]=1&signature[0]=782557dfbfac28dcbb5c2ac96cb6f28a56c289ea1afb90aa4c1768e152fd985e6c1cbe330365416ab1fa750bc1a493b18b9845b4c97ee0b6fdce41a99e23e400&signature[1]=244d8f506654510afa404536b498277a8711cfad3e87c19b256401681a5f638d1730a0d0473e2fd7ee8189f9e9580dcf4a007b5ebf9e6f6bb34e2acb8bb30f06&signature[2]=5c55e21375c705c56556d2309dfd7ad995fde306a0f39e739b63bd088c42eaa0e466358fd4b5258f9fc4c01e11357d75da890745738daf98e92ea1ac353f050d&signature[3]=f7a39c54f858efc5b80758fcc27ea35800b13732b7e9b8c8af7918ef366b3aa81ddd5ea8b7eee5cee79c7bd2383189ceaea226ea2232e90efb0389ccf7b5eb0e&walletProviderStatus=transactionsSigned");
        // const urlParams = qs.parse(window.location.search);
        if (!WalletProvider.isTxSignReturnSuccess(urlParams)) {
            return transactions;
        }

        return WalletProvider.getTxSignReturnValue(urlParams);
    }

    /**
     * Method will be available once the ElrondWallet hook will be implemented
     * @param _
     */
    async signMessage(_: SignableMessage): Promise<SignableMessage> {
        throw new ErrNotImplemented();
    }

    static isTxSignReturnSuccess(urlParams: any): boolean {
        return urlParams.hasOwnProperty(WALLET_PROVIDER_CALLBACK_PARAM) && urlParams[WALLET_PROVIDER_CALLBACK_PARAM] === WALLET_PROVIDER_CALLBACK_PARAM_TX_SIGNED;
    }

    static getTxSignReturnValue(urlParams: any): Transaction[] {
        const expectedProps = ["nonce", "value", "receiver", "sender", "gasPrice",
            "gasLimit", "data", "chainID", "version", "signature"];

        for (let txProp of expectedProps) {
            if (!urlParams[txProp] || !Array.isArray(urlParams[txProp])) {
                throw new ErrInvalidTxSignReturnValue();
            }
        }

        const expectedLength = urlParams["nonce"].length;
        for (let txProp of expectedProps) {
            if (urlParams[txProp].length !== expectedLength) {
                throw new ErrInvalidTxSignReturnValue();
            }
        }

        const transactions: Transaction[] = [];
        for (let i = 0; i < expectedLength; i++) {
            let tx = new Transaction({
                nonce: new Nonce(urlParams["nonce"][i]),
                value: Balance.fromString(<string>urlParams["value"][i]),
                receiver: Address.fromString(<string>urlParams["receiver"][i]),
                gasPrice: new GasPrice(parseInt(<string>urlParams["gasPrice"][i])),
                gasLimit: new GasLimit(parseInt(<string>urlParams["gasLimit"][i])),
                data: new TransactionPayload(<string>urlParams["gasLimit"][i]),
                chainID: new ChainID(<string>urlParams["chainID"][i]),
                version: new TransactionVersion(parseInt(<string>urlParams["version"][i])),

            });
            tx.applySignature(new Signature(<string>urlParams["signature"][i]), Address.fromString(<string>urlParams["sender"][i]));
            transactions.push(tx);
        }

        return transactions;
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
