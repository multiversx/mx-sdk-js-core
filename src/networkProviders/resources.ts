import { TransactionStatus } from "../core/transactionStatus";
import {
    DEFAULT_ACCOUNT_AWAITING_PATIENCE_IN_MILLISECONDS,
    DEFAULT_ACCOUNT_AWAITING_POLLING_TIMEOUT_IN_MILLISECONDS,
    DEFAULT_ACCOUNT_AWAITING_TIMEOUT_IN_MILLISECONDS,
} from "./constants";

export class AwaitingOptions {
    pollingIntervalInMilliseconds: number = DEFAULT_ACCOUNT_AWAITING_POLLING_TIMEOUT_IN_MILLISECONDS;
    timeoutInMilliseconds: number = DEFAULT_ACCOUNT_AWAITING_TIMEOUT_IN_MILLISECONDS;
    patienceInMilliseconds: number = DEFAULT_ACCOUNT_AWAITING_PATIENCE_IN_MILLISECONDS;
}

export class TransactionCostResponse {
    raw: Record<string, any> = {};
    gasLimit: number = 0;
    status: TransactionStatus = TransactionStatus.createUnknown();

    static fromHttpResponse(payload: any): TransactionCostResponse {
        const result = new TransactionCostResponse();
        result.raw = payload;
        result.gasLimit = payload["txGasUnits"] ?? 0;
        result.status = new TransactionStatus("");

        return result;
    }
}
