import { SignableMessage } from "../signableMessage";
import { Transaction } from "../transaction";
import { IDappProvider } from "./interface";

declare global {
  interface Window {
    elrondWallet: { extensionId: string };
  }
}

export class ExtensionProvider implements IDappProvider {
  private popupName = "connectPopup";
  private popupOptions =
    "directories=no,titlebar=no,toolbar=no,location=no,status=no,menubar=no,scrollbars=no,resizable=no,width=375,height=569";

  private extensionId: string = "";
  private extensionURL: string = "";
  private extensionPopupWindow: Window | null;
  public account: any;
  private initialized: boolean = false;

  constructor() {
    this.extensionPopupWindow = null;
    this.init().then();
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
      throw new Error("Wallet provider is not initialised, call init() first");
    }
    this.openExtensionPopup();
    const { token } = options;
    const data = token ? token : "";
    await this.startExtMsgChannel("connect", data);
    return this.account.address;
  }

  async logout(): Promise<boolean> {
    if (!this.initialized) {
      throw new Error("Wallet provider is not initialised, call init() first");
    }
    return await this.startBgrMsgChannel("logout", this.account.address);
  }

  async getAddress(): Promise<string> {
    if (!this.initialized) {
      throw new Error("Wallet provider is not initialised, call init() first");
    }
    return this.account.address;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async isConnected(): Promise<boolean> {
<<<<<<< HEAD
    return !!this.account;
=======
    return this.account ? true : false;
>>>>>>> 37672e5... add init and logout functionality for extension provider
  }

  async sendTransaction(transaction: Transaction): Promise<Transaction> {
    return await this.startExtMsgChannel("sendTransactions", {
      from: this.account.index,
      transactions: [transaction],
    })[0];
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    return await this.startExtMsgChannel("signTransactions", {
      from: this.account.index,
      transactions: [transaction],
    })[0];
  }

  async signTransactions(
    transactions: Array<Transaction>
  ): Promise<Array<Transaction>> {
    return await this.startExtMsgChannel("sendTransactions", {
      from: this.account.index,
      transactions: transactions,
    });
  }

  async signMessage(message: SignableMessage): Promise<SignableMessage> {
    this.openExtensionPopup();
    const data = {
      account: this.account.index,
      message: message.message,
    };
    return await this.startExtMsgChannel("signMessage", data);
  }

  private openExtensionPopup() {
    if (!this.initialized) {
      throw new Error("Wallet provider is not initialised, call init() first");
    }
    this.extensionPopupWindow = window.open(
      this.extensionURL,
      this.popupName,
      this.popupOptions
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

  private startExtMsgChannel(operation: string, connectData: any): any {
    return new Promise((resolve, reject) => {
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
              this.extensionPopupWindow?.close();
              this.account = event.data.data;
              window.removeEventListener("message", eventHandler);
              isResolved = true;
              resolve(event.data.data);
              break;

            default:
              this.handleExtResponseErr(event);
              this.extensionPopupWindow?.close();
              window.removeEventListener("message", eventHandler);
              isResolved = true;
              resolve(event.data.data);
              break;
          }
        }
      };
      const windowCloseInterval = setInterval(() => {
        if (this.extensionPopupWindow?.closed) {
          window.removeEventListener("message", eventHandler);
          clearInterval(windowCloseInterval);
          if (!isResolved)
            reject("Extension window was closed without response.");
        }
      }, 500);

      window.addEventListener("message", eventHandler, false);
    });
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
