import {IDappProvider, IDappMessageEvent} from "./interface";
import {
    DAPP_MESSAGE_INIT,
    DAPP_DEFAULT_TIMEOUT,
    DAPP_MESSAGE_IS_CONNECTED,
    DAPP_MESSAGE_GET_ADDRESS,
    DAPP_MESSAGE_CONNECT_URL,
    DAPP_MESSAGE_SEND_TRANSACTION_URL,
    DAPP_MESSAGE_SIGN_TRANSACTION_URL,
    DAPP_MESSAGE_LOG_OUT
} from "./constants";
import {mainFrameStyle} from "./dom";
import {Transaction} from "../transaction";
import {SignableMessage} from "../signableMessage";
import {ErrNotImplemented} from "../errors";

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
        this.attachMainFrame();
        this.init().then();
    }

    /**
     * Waits for the wallet iframe to ping that it has been initialised
     */
    async init(): Promise<boolean> {
        if (this.isInitialized()) {
            return true;
        }
        return this.waitForRemote();
    }

    /**
     * Returns if the wallet iframe is up and running
     */
    isInitialized(): boolean {
        if (!this.mainFrame) {
            return false;
        }

        return this.mainFrame.dataset.initialized === "true";
    }

    /**
     * Unlike isInitialized, isConnected returns true if the user alredy went through the login process
     *  and has the wallet session active
     */
    async isConnected(): Promise<boolean> {
        if (!this.mainFrame) {
            return false;
        }

        const {contentWindow} = this.mainFrame;
        if (!contentWindow) {
            return false;
        }

        return new Promise((resolve, reject) => {
            console.log("postMessage", DAPP_MESSAGE_IS_CONNECTED);

            contentWindow.postMessage({
                type: DAPP_MESSAGE_IS_CONNECTED,
            }, this.walletUrl);

            const timeout = setTimeout(_ => reject('window not responding'), 5000);

            const isConnected = (ev: IDappMessageEvent) => {
                console.log("event", "isConnected", ev);

                if (!this.isValidWalletSource(ev.origin)) {
                    return;
                }

                const {data} = ev;
                if (data.type !== DAPP_MESSAGE_IS_CONNECTED) {
                    return;
                }

                clearTimeout(timeout);
                window.removeEventListener('message', isConnected.bind(this));
                return resolve(data.data);
            };

            window.addEventListener('message', isConnected);
        });
    }

    /**
     * Fetches the login hook url and redirects the client to the wallet login.
     */
    async login(options?:{callbackUrl?:string; token?:string}): Promise<string> {
        if (!this.mainFrame) {
            return '';
        }

        const {contentWindow} = this.mainFrame;
        if (!contentWindow) {
            console.warn("something went wrong, main wallet iframe does not contain a contentWindow");
            return '';
        }

        return new Promise<string>((resolve, reject) => {
            console.log("postMessage", DAPP_MESSAGE_CONNECT_URL);

            contentWindow.postMessage({
                type: DAPP_MESSAGE_CONNECT_URL,
            }, this.walletUrl);

            const timeout = setTimeout(_ => reject('connect url not responding'), 5000);
            const connectUrl = (ev: IDappMessageEvent) => {
                console.log("event", "connectUrl", ev);

                if (!this.isValidWalletSource(ev.origin)) {
                    return;
                }

                const {data} = ev;
                if (data.type !== DAPP_MESSAGE_CONNECT_URL) {
                    return;
                }

                clearTimeout(timeout);
                window.removeEventListener('message', connectUrl.bind(this));
                return resolve(data.data.toString());
            };

            window.addEventListener('message', connectUrl);
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
    async logout(): Promise<boolean> {
        if (!this.mainFrame) {
            return false;
        }

        const {contentWindow} = this.mainFrame;
        if (!contentWindow) {
            console.warn("something went wrong, main wallet iframe does not contain a contentWindow");
            return false;
        }

        return new Promise<boolean>((resolve, reject) => {
            console.log("postMessage", DAPP_MESSAGE_LOG_OUT);

            contentWindow.postMessage({
                type: DAPP_MESSAGE_LOG_OUT,
            }, this.walletUrl);

            const timeout = setTimeout(_ => reject('logout url not responding'), 5000);
            const logout = (ev: IDappMessageEvent) => {
                console.log("event", "logouturl", ev);

                if (!this.isValidWalletSource(ev.origin)) {
                    return;
                }

                const {data} = ev;
                if (data.type !== DAPP_MESSAGE_LOG_OUT) {
                    return;
                }

                clearTimeout(timeout);
                window.removeEventListener('message', logout.bind(this));
                return resolve(data.data);
            };

            window.addEventListener('message', logout);
        })
    }

    /**
     * Returns currently connected address. Empty string if not connected
     */
    async getAddress(): Promise<string> {
        if (!this.mainFrame) {
            return '';
        }

        const {contentWindow} = this.mainFrame;
        if (!contentWindow) {
            return '';
        }

        return new Promise((resolve, reject) => {
            console.log("postMessage", DAPP_MESSAGE_GET_ADDRESS);

            contentWindow.postMessage({
                type: DAPP_MESSAGE_GET_ADDRESS,
            }, this.walletUrl);

            const timeout = setTimeout(_ => reject('window not responding'), 5000);

            const getAddress = (ev: IDappMessageEvent) => {

                if (!this.isValidWalletSource(ev.origin)) {
                    return;
                }

                const {data} = ev;
                if (data.type !== DAPP_MESSAGE_GET_ADDRESS) {
                    return;
                }

                clearTimeout(timeout);
                window.removeEventListener('message', getAddress.bind(this));
                return resolve(data.data);
            };

            window.addEventListener('message', getAddress);
        });
    }

    /**
     * Packs a {@link Transaction} and fetches correct redirect URL from the wallet API. Then redirects
     *   the client to the send transaction hook
     * @param transaction
     * @param options
     */
    async sendTransaction(transaction: Transaction, options?: {callbackUrl?: string}): Promise<Transaction> {
        if (!this.mainFrame) {
            throw new Error("Wallet provider is not initialised, call init() first");
        }

        const {contentWindow} = this.mainFrame;
        if (!contentWindow) {
            throw new Error("Wallet provider is not initialised, call init() first");
        }

        return new Promise<Transaction>((resolve, reject) => {
            let plainTransaction = WalletProvider.prepareWalletTransaction(transaction);
            console.log("postMessage", DAPP_MESSAGE_SEND_TRANSACTION_URL, plainTransaction);

            contentWindow.postMessage({
                type: DAPP_MESSAGE_SEND_TRANSACTION_URL,
                data: {
                    transaction: plainTransaction
                }
            }, this.walletUrl);

            const timeout = setTimeout(_ => reject('send transaction url not responding'), 5000);
            const sendTransactionUrl = (ev: IDappMessageEvent) => {
                console.log("event", "sendTransactionUrl", ev);

                if (!this.isValidWalletSource(ev.origin)) {
                    return;
                }

                const {data} = ev;
                if (data.type !== DAPP_MESSAGE_SEND_TRANSACTION_URL) {
                    return;
                }

                clearTimeout(timeout);
                window.removeEventListener('message', sendTransactionUrl.bind(this));

                if (data.error) {
                    return reject(data.error);
                }

                return resolve(data.data.toString());
            };

            window.addEventListener('message', sendTransactionUrl);
        }).then((url: any) => {
            window.location.href = `${this.baseWalletUrl()}${url}&callbackUrl=${options !== undefined && options.callbackUrl !== undefined ? options.callbackUrl : window.location.href}`;
            return transaction;
        });
    }

    /**
     * Packs a {@link Transaction} and fetches correct redirect URL from the wallet API. Then redirects
     *   the client to the sign transaction hook
     * @param transaction
     * @param options
     */
    async signTransaction(transaction: Transaction, options?: {callbackUrl?: string}): Promise<Transaction> {
        if (!this.mainFrame) {
            throw new Error("Wallet provider is not initialised, call init() first");
        }

        const {contentWindow} = this.mainFrame;
        if (!contentWindow) {
            throw new Error("Wallet provider is not initialised, call init() first");
        }

        return new Promise<Transaction>((resolve, reject) => {
            let plainTransaction = WalletProvider.prepareWalletTransaction(transaction);
            console.log("postMessage", DAPP_MESSAGE_SIGN_TRANSACTION_URL, plainTransaction);

            contentWindow.postMessage({
                type: DAPP_MESSAGE_SIGN_TRANSACTION_URL,
                data: {
                    transaction: plainTransaction
                }
            }, this.walletUrl);

            const timeout = setTimeout(_ => reject('sign transaction url not responding'), 5000);
            const signTransactionUrl = (ev: IDappMessageEvent) => {
                console.log("event", "signTransactionUrl", ev);

                if (!this.isValidWalletSource(ev.origin)) {
                    return;
                }

                const {data} = ev;
                if (data.type !== DAPP_MESSAGE_SIGN_TRANSACTION_URL) {
                    return;
                }

                clearTimeout(timeout);
                window.removeEventListener('message', signTransactionUrl.bind(this));

                if (data.error) {
                    return reject(data.error);
                }

                return resolve(data.data.toString());
            };

            window.addEventListener('message', signTransactionUrl);
        }).then((url: any) => {
            window.location.href = `${this.baseWalletUrl()}${url}&callbackUrl=${options !== undefined && options.callbackUrl !== undefined ? options.callbackUrl : window.location.href}`;
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

    private async waitForRemote(): Promise<boolean>{
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(_ => reject(false), DAPP_DEFAULT_TIMEOUT);
            const setConnected = (ev: IDappMessageEvent) => {

                if (!this.mainFrame) {
                    return;
                }
                if (!this.isValidWalletSource(ev.origin)) {
                    return;
                }
                const {data} = ev;
                if (data.type !== DAPP_MESSAGE_INIT) {
                    return;
                }

                clearTimeout(timeout);
                window.removeEventListener('message', setConnected);
                this.mainFrame.dataset.initialized = data.data.toString();

                resolve(data.data);
            };
            window.addEventListener('message', setConnected.bind(this));
        });
    }

    private attachMainFrame() {
        let currentMainframe: HTMLIFrameElement|null;
        if (this.customId) {
            currentMainframe = document.querySelector(`iframe[id="${this.customId}"]`);
        } else {
            currentMainframe = document.querySelector(`iframe[src="${this.walletUrl}"]`);
        }
        if (currentMainframe) {
            this.mainFrame = currentMainframe;
            return;
        }

        let mainFrame = document.createElement('iframe');
        mainFrame.src = this.walletUrl;
        mainFrame.id = this.customId;
        Object.assign(mainFrame.style, mainFrameStyle());
        mainFrame.dataset.initialized = "false";
        document.body.appendChild(mainFrame);

        this.mainFrame = mainFrame;
    }

    private isValidWalletSource(origin: string): boolean {
        return origin === this.walletUrl || origin === this.baseWalletUrl();
    }

    private baseWalletUrl(): string {
        const pathArray = this.walletUrl.split( '/' );
        const protocol = pathArray[0];
        const host = pathArray[2];
        return protocol + '//' + host;
    }
}
