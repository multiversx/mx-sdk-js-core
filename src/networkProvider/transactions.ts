import { TransactionStatus } from "./transactionStatus";
import { ContractResults } from "./contractResults";
import { Address, Hash, Nonce, TransactionValue, TransactionPayload } from "./primitives";
import { IAddress, IGasLimit, IGasPrice, IHash, INonce, ITransactionPayload } from "./interface";
import { TransactionCompletionStrategy } from "./transactionCompletionStrategy";
import { TransactionEvent } from "./transactionEvents";
import { TransactionLogs } from "./transactionLogs";
import { TransactionReceipt } from "./transactionReceipt";

 export class TransactionOnNetwork {
    hash: IHash = new Hash("");
    type: string = "";
    nonce: INonce = new Nonce(0);
    round: number = 0;
    epoch: number = 0;
    value: TransactionValue = new TransactionValue("");
    receiver: IAddress = new Address("");
    sender: IAddress = new Address("");
    gasLimit: IGasLimit = 0;
    gasPrice: IGasPrice = 0;
    data: ITransactionPayload = new TransactionPayload("");
    signature: string = "";
    status: TransactionStatus = TransactionStatus.createUnknown();
    timestamp: number = 0;

    blockNonce: number = 0;
    hyperblockNonce: number = 0;
    hyperblockHash: string = "";
    pendingResults: boolean = false;

    receipt: TransactionReceipt = new TransactionReceipt();
    contractResults: ContractResults = ContractResults.empty();
    logs: TransactionLogs = TransactionLogs.empty();

    constructor(init?: Partial<TransactionOnNetwork>) {
        Object.assign(this, init);
    }

    static fromProxyHttpResponse(txHash: IHash, response: any): TransactionOnNetwork {
        let result = TransactionOnNetwork.fromHttpResponse(txHash, response);
        result.contractResults = ContractResults.fromProxyHttpResponse(response.smartContractResults || []);
        // TODO: uniformize transaction status.
        // TODO: Use specific completion detection strategy.
        return result;
    }

    static fromApiHttpResponse(txHash: IHash, response: any): TransactionOnNetwork {
        let result = TransactionOnNetwork.fromHttpResponse(txHash, response);
        result.contractResults = ContractResults.fromApiHttpResponse(response.results || []);
        // TODO: uniformize transaction status.
        // TODO: Use specific completion detection strategy.
        return result;
    }

    private static fromHttpResponse(txHash: IHash, response: any): TransactionOnNetwork {
        let result = new TransactionOnNetwork();

        result.hash = txHash;
        result.type = response.type || "";
        result.nonce = new Nonce(response.nonce || 0);
        result.round = response.round;
        result.epoch = response.epoch || 0;
        result.value = new TransactionValue(response.value);
        result.sender = new Address(response.sender);
        result.receiver = new Address(response.receiver);
        result.gasPrice = response.gasPrice || 0;
        result.gasLimit = response.gasLimit || 0;
        result.data = new TransactionPayload(response.data);
        result.status = new TransactionStatus(response.status);
        result.timestamp = response.timestamp || 0;

        result.blockNonce = response.blockNonce || 0;
        result.hyperblockNonce = response.hyperblockNonce || 0;
        result.hyperblockHash = response.hyperblockHash;
        result.pendingResults = response.pendingResults || false;

        result.receipt = TransactionReceipt.fromHttpResponse(response.receipt || {});
        result.logs = TransactionLogs.fromHttpResponse(response.logs || {});

        return result;
    }

    getDateTime(): Date {
        return new Date(this.timestamp * 1000);
    }

    isCompleted(): boolean {
        // TODO: use different transaction completion strategies - API / Proxy.
        return new TransactionCompletionStrategy().isCompleted(this);
    }

    getAllEvents(): TransactionEvent[] {
        let result = [...this.logs.events];

        for (const resultItem of this.contractResults.items) {
            result.push(...resultItem.logs.events);
        }

        return result;
    }
}

