import { SignableMessage } from "../signableMessage";
import { Signature } from "../signature";
import { Transaction } from "../transaction";
import { IDappProvider } from "./interface";

declare global {
  interface Window {
    elrondWallet: { extensionId: string };
  }
}

interface IExtensionAccount {
  address: string;
  name?: string;
  signature?: string;
}

export class ExtensionProvider implements IDappProvider {
  private popupName = "connectPopup";

  private extensionId: string = "";
  private extensionURL: string = "";
  private extensionPopupWindow: Window | null;
  public account: IExtensionAccount;
  private initialized: boolean = false;
  private static _instance: ExtensionProvider = new ExtensionProvider();
  constructor() {
    if (ExtensionProvider._instance) {
      throw new Error(
        "Error: Instantiation failed: Use ExtensionProvider.getInstance() instead of new."
      );
    }
    this.account = { address: "" };
    ExtensionProvider._instance = this;
    this.extensionPopupWindow = null;
  }

  public static getInstance(): ExtensionProvider {
    return ExtensionProvider._instance;
  }

  public setAddress(address: string): ExtensionProvider {
    this.account.address = address;
    return ExtensionProvider._instance;
  }

  async init(): Promise<boolean> {
    if (window && window.elrondWallet) {
      this.extensionId = window.elrondWallet.extensionId;
      this.extensionURL = `chrome-extension://${this.extensionId}/index.html`;
      this.initialized = true;
    }
    return this.initialized;
  }

  async login(
    options: {
      callbackUrl?: string;
      token?: string;
    } = {}
  ): Promise<string> {
    if (!this.initialized) {
      throw new Error(
        "Extension provider is not initialised, call init() first"
      );
    }
    this.openExtensionPopup();
    const { token } = options;
    const data = token ? token : "";
    await this.startExtMsgChannel("connect", data);
    return this.account.address;
  }

  async logout(): Promise<boolean> {
    if (!this.initialized) {
      throw new Error(
        "Extension provider is not initialised, call init() first"
      );
    }
    try {
      await this.startBgrMsgChannel("logout", this.account.address);
    } catch (error) {
      console.warn("Extension origin url is already cleared!", error);
    }

    return true;
  }

  async getAddress(): Promise<string> {
    if (!this.initialized) {
      throw new Error(
        "Extension provider is not initialised, call init() first"
      );
    }
    return this.account ? this.account.address : "";
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async isConnected(): Promise<boolean> {
    return !!this.account;
  }

  async sendTransaction(transaction: Transaction): Promise<Transaction> {
    this.openExtensionPopup();
    const txResponse = await this.startExtMsgChannel("sendTransactions", {
      from: this.account.address,
      transactions: [transaction.toPlainObject()],
    });

    return Transaction.fromPlainObject(txResponse[0]);
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    this.openExtensionPopup();
    const txResponse = await this.startExtMsgChannel("signTransactions", {
      from: this.account.address,
      transactions: [transaction.toPlainObject()],
    });
    return Transaction.fromPlainObject(txResponse[0]);
  }

  async signTransactions(
    transactions: Array<Transaction>
  ): Promise<Array<Transaction>> {
    this.openExtensionPopup();
    transactions = transactions.map((transaction) =>
      transaction.toPlainObject()
    );
    let txResponse = await this.startExtMsgChannel("signTransactions", {
      from: this.account.address,
      transactions: transactions,
    });
    txResponse = txResponse.map((transaction: any) =>
      Transaction.fromPlainObject(transaction)
    );
    return txResponse;
  }

  async signMessage(message: SignableMessage): Promise<SignableMessage> {
    this.openExtensionPopup();
    const data = {
      account: this.account.address,
      message: message.message.toString(),
    };
    const signResponse = await this.startExtMsgChannel("signMessage", data);
    const signedMsg = new SignableMessage({
      address: message.address,
      message: Buffer.from(signResponse.message),
      signature: new Signature(signResponse.signature),
    });

    return signedMsg;
  }

  private openExtensionPopup() {
    if (!this.initialized) {
      throw new Error(
        "Extension provider is not initialised, call init() first"
      );
    }
    const popupOptions = `directories=no,titlebar=no,toolbar=no,location=no,status=no,menubar=no,scrollbars=no,left=${window.screenX +
      window.outerWidth -
      375},screenY=${window.screenY}resizable=no,width=375,height=569`;
    this.extensionPopupWindow = window.open(
      this.extensionURL,
      this.popupName,
      popupOptions
    );
  }

  private startBgrMsgChannel(
    operation: string,
    connectData: any
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      window.postMessage(
        {
          target: "erdw-inpage",
          type: operation,
          data: connectData,
        },
        window.origin
      );

      const eventHandler = (event: any) => {
        if (
          event.isTrusted &&
          event.data.type &&
          event.data.target === "erdw-contentScript"
        ) {
          switch (event.data.type) {
            case "logoutResponse":
              window.removeEventListener("message", eventHandler);
              resolve(true);
              break;
          }
        }
      };
      setTimeout(() => {
        reject(
          "Extension logout response timeout. No response from extension."
        );
      }, 3000);
      window.addEventListener("message", eventHandler, false);
    });
  }

  private async startExtMsgChannel(
    operation: string,
    connectData: any
  ): Promise<any> {
    const response = await new Promise((resolve, reject) => {
      let isResolved = false;
      const eventHandler = (event: any) => {
        if (
          event.isTrusted &&
          event.data.type &&
          event.data.target === "erdw-extension"
        ) {
          switch (event.data.type) {
            case "popupReady":
              event.ports[0].postMessage({
                target: "erdw-inpage",
                type: operation,
                data: connectData,
              });
              break;
            case "connectResult":
              this.account = event.data.data;
              window.removeEventListener("message", eventHandler);
              isResolved = true;
              this.extensionPopupWindow?.close();
              resolve(event.data.data);
              break;

            default:
              this.handleExtResponseErr(event);
              window.removeEventListener("message", eventHandler);
              isResolved = true;
              this.extensionPopupWindow?.close();
              resolve(event.data.data);
              break;
          }
        }
      };
      const windowCloseInterval = setInterval(() => {
        if (this.extensionPopupWindow?.closed) {
          clearInterval(windowCloseInterval);
          if (!isResolved) {
            window.removeEventListener("message", eventHandler);
            reject("Extension window was closed without response.");
          }
        }
      }, 500);
      window.addEventListener("message", eventHandler, false);
    });

    return response;
  }

  private handleExtResponseErr(event: any) {
    if (!event.data && !event.data.data) {
      throw new Error("Extension response is empty.");
    }

    if (
      event.data.type === "transactionComplete" &&
      event.data.data.length === 0
    ) {
      throw new Error("Transactions list response is empty.");
    }
  }
}
