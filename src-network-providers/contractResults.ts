import { IAddress, IGasLimit, IGasPrice, IHash, INonce } from "./interface";
import { TransactionLogs } from "./transactionLogs";
import { Address, Hash, Nonce, TransactionValue } from "./primitives";

export class ContractResults {
    readonly items: ContractResultItem[];

    constructor(items: ContractResultItem[]) {
        this.items = items;

        this.items.sort(function (a: ContractResultItem, b: ContractResultItem) {
            return a.nonce.valueOf() - b.nonce.valueOf();
        });
    }

    static empty(): ContractResults {
        return new ContractResults([]);
    }

    static fromProxyHttpResponse(results: any[]): ContractResults {
        let items = results.map(item => ContractResultItem.fromProxyHttpResponse(item));
        return new ContractResults(items);
    }

    static fromApiHttpResponse(results: any[]): ContractResults {
        let items = results.map(item => ContractResultItem.fromApiHttpResponse(item));
        return new ContractResults(items);
    }
}

export class ContractResultItem {
    hash: IHash = new Hash("");
    nonce: INonce = new Nonce(0);
    value: TransactionValue = new TransactionValue("");
    receiver: IAddress = new Address("");
    sender: IAddress = new Address("");
    data: string = "";
    previousHash: Hash = new Hash("");
    originalHash: Hash = new Hash("");
    gasLimit: IGasLimit = 0;
    gasPrice: IGasPrice = 0;
    callType: number = 0;
    returnMessage: string = "";
    logs: TransactionLogs = TransactionLogs.empty();

    constructor(init?: Partial<ContractResultItem>) {
        Object.assign(this, init);
    }

    static fromProxyHttpResponse(response: any): ContractResultItem {
        let item = ContractResultItem.fromHttpResponse(response);
        return item;
    }

    static fromApiHttpResponse(response: any): ContractResultItem {
        let item = ContractResultItem.fromHttpResponse(response);

        item.data = Buffer.from(item.data, "base64").toString();
        item.callType = Number(item.callType);

        return item;
    }

    private static fromHttpResponse(response: any): ContractResultItem {
        let item = new ContractResultItem();

        item.hash = new Hash(response.hash);
        item.nonce = new Nonce(response.nonce || 0);
        item.value = new TransactionValue((response.value || 0).toString());
        item.receiver = new Address(response.receiver);
        item.sender = new Address(response.sender);
        item.previousHash = new Hash(response.prevTxHash);
        item.originalHash = new Hash(response.originalTxHash);
        item.gasLimit = Number(response.gasLimit || 0);
        item.gasPrice = Number(response.gasPrice || 0);
        item.data = response.data || "";
        item.callType = response.callType;
        item.returnMessage = response.returnMessage;

        item.logs = TransactionLogs.fromHttpResponse(response.logs || {});

        return item;
    }
}
