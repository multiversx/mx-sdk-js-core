import { TransactionStatus } from "./transactionStatus";
import { ContractResults } from "./contractResults";
import { Bech32Address, Hash } from "./primitives";
import { IBech32Address, IHash } from "./interface";
import { TransactionCompletionStrategyOnAPI, TransactionCompletionStrategyOnProxy } from "./transactionCompletionStrategy";
import { TransactionLogs } from "./transactionLogs";
import { TransactionReceipt } from "./transactionReceipt";

export class TransactionOnNetwork {
    isCompleted: boolean = false;
    hash: IHash = new Hash("");
    type: string = "";
    nonce: number = 0;
    round: number = 0;
    epoch: number = 0;
    value: string = "";
    receiver: IBech32Address = new Bech32Address("");
    sender: IBech32Address = new Bech32Address("");
    gasLimit: number = 0;
    gasPrice: number = 0;
    data: Buffer = Buffer.from([]);
    signature: string = "";
    status: TransactionStatus = TransactionStatus.createUnknown();
    timestamp: number = 0;

    blockNonce: number = 0;
    hyperblockNonce: number = 0;
    hyperblockHash: string = "";

    receipt: TransactionReceipt = new TransactionReceipt();
    contractResults: ContractResults = ContractResults.empty();
    logs: TransactionLogs = TransactionLogs.empty();

    constructor(init?: Partial<TransactionOnNetwork>) {
        Object.assign(this, init);
    }

    static fromProxyHttpResponse(txHash: IHash, response: any): TransactionOnNetwork {
        let result = TransactionOnNetwork.fromHttpResponse(txHash, response);
        result.contractResults = ContractResults.fromProxyHttpResponse(response.smartContractResults || []);
        result.isCompleted = new TransactionCompletionStrategyOnProxy().isCompleted(result);
        // TODO: uniformize transaction status.
        return result;
    }

    static fromApiHttpResponse(txHash: IHash, response: any): TransactionOnNetwork {
        let result = TransactionOnNetwork.fromHttpResponse(txHash, response);
        result.contractResults = ContractResults.fromApiHttpResponse(response.results || []);
        result.isCompleted = new TransactionCompletionStrategyOnAPI().isCompleted(result);
        // TODO: uniformize transaction status.
        return result;
    }

    private static fromHttpResponse(txHash: IHash, response: any): TransactionOnNetwork {
        let result = new TransactionOnNetwork();

        result.hash = txHash;
        result.type = response.type || "";
        result.nonce = response.nonce || 0;
        result.round = response.round;
        result.epoch = response.epoch || 0;
        result.value = (response.value || 0).toString();
        result.sender = new Bech32Address(response.sender);
        result.receiver = new Bech32Address(response.receiver);
        result.gasPrice = response.gasPrice || 0;
        result.gasLimit = response.gasLimit || 0;
        result.data = Buffer.from(response.data || "", "base64");
        result.status = new TransactionStatus(response.status);
        result.timestamp = response.timestamp || 0;

        result.blockNonce = response.blockNonce || 0;
        result.hyperblockNonce = response.hyperblockNonce || 0;
        result.hyperblockHash = response.hyperblockHash || "";

        result.receipt = TransactionReceipt.fromHttpResponse(response.receipt || {});
        result.logs = TransactionLogs.fromHttpResponse(response.logs || {});

        return result;
    }

    getDateTime(): Date {
        return new Date(this.timestamp * 1000);
    }
}
