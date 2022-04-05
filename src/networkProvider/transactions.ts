import { Address } from "../address";
import { Balance } from "../balance";
import { Hash } from "../hash";
import { GasLimit, GasPrice } from "../networkParams";
import { Nonce } from "../nonce";
import { Signature } from "../signature";
import { TransactionHash, TransactionStatus } from "../transaction";
import { TransactionPayload } from "../transactionPayload";
import { ContractResults } from "./contractResults";
import { TransactionCompletionStrategy } from "./transactionCompletionStrategy";
import { TransactionEvent } from "./transactionEvents";
import { TransactionLogs } from "./transactionLogs";
import { TransactionReceipt } from "./transactionReceipt";

 export class TransactionOnNetwork {
    hash: TransactionHash = new TransactionHash("");
    type: string = "";
    nonce: Nonce = new Nonce(0);
    round: number = 0;
    epoch: number = 0;
    value: Balance = Balance.Zero();
    receiver: Address = new Address();
    sender: Address = new Address();
    gasPrice: GasPrice = new GasPrice(0);
    gasLimit: GasLimit = new GasLimit(0);
    data: TransactionPayload = new TransactionPayload();
    signature: Signature = Signature.empty();
    status: TransactionStatus = TransactionStatus.createUnknown();
    timestamp: number = 0;

    blockNonce: Nonce = new Nonce(0);
    hyperblockNonce: Nonce = new Nonce(0);
    hyperblockHash: Hash = Hash.empty();
    pendingResults: boolean = false;

    receipt: TransactionReceipt = new TransactionReceipt();
    contractResults: ContractResults = ContractResults.empty();
    logs: TransactionLogs = TransactionLogs.empty();

    constructor(init?: Partial<TransactionOnNetwork>) {
        Object.assign(this, init);
    }

    static fromProxyHttpResponse(txHash: TransactionHash, response: any): TransactionOnNetwork {
        let result = TransactionOnNetwork.fromHttpResponse(txHash, response);
        result.contractResults = ContractResults.fromProxyHttpResponse(response.smartContractResults || []);
        // TODO: uniformize transaction status.
        // TODO: Use specific completion detection strategy.
        return result;
    }

    static fromApiHttpResponse(txHash: TransactionHash, response: any): TransactionOnNetwork {
        let result = TransactionOnNetwork.fromHttpResponse(txHash, response);
        result.contractResults = ContractResults.fromApiHttpResponse(response.results || []);
        // TODO: uniformize transaction status.
        // TODO: Use specific completion detection strategy.
        return result;
    }

    private static fromHttpResponse(txHash: TransactionHash, response: any): TransactionOnNetwork {
        let result = new TransactionOnNetwork();

        result.hash = txHash;
        result.type = response.type || "";
        result.nonce = new Nonce(response.nonce || 0);
        result.round = response.round;
        result.epoch = response.epoch || 0;
        result.value = Balance.fromString(response.value);
        result.sender = Address.fromBech32(response.sender);
        result.receiver = Address.fromBech32(response.receiver);
        result.gasPrice = new GasPrice(response.gasPrice);
        result.gasLimit = new GasLimit(response.gasLimit);
        result.data = TransactionPayload.fromEncoded(response.data);
        result.status = new TransactionStatus(response.status);
        result.timestamp = response.timestamp || 0;

        result.blockNonce = new Nonce(response.blockNonce || 0);
        result.hyperblockNonce = new Nonce(response.hyperblockNonce || 0);
        result.hyperblockHash = new Hash(response.hyperblockHash);
        result.pendingResults = response.pendingResults || false;

        result.receipt = TransactionReceipt.fromHttpResponse(response.receipt || {});
        result.logs = TransactionLogs.fromHttpResponse(response.logs || {});

        return result;
    }

    getDateTime(): Date {
        return new Date(this.timestamp * 1000);
    }

    isCompleted(): boolean {
        // TODO: When using separate constructors of TransactionOnNetwork (for API response vs. for Gateway response, see package "networkProvider"),
        // we will be able to use different transaction completion strategies.
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

