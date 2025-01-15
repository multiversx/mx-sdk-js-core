import { BytesValue } from "../abi";
import { Address } from "../address";
import { TransactionStatus } from "../transactionStatus";
import {
    DEFAULT_ACCOUNT_AWAITING_PATIENCE_IN_MILLISECONDS,
    DEFAULT_ACCOUNT_AWAITING_POLLING_TIMEOUT_IN_MILLISECONDS,
    DEFAULT_ACCOUNT_AWAITING_TIMEOUT_IN_MILLISECONDS,
} from "./constants";

/**
 * A plain view of an account storage.
 */
export class AccountStorage {
    raw: Record<string, any> = {};
    blockCoordinates!: BlockCoordinates;
    entries: AccountStorageEntry[] = [];
    constructor(init?: Partial<AccountStorage>) {
        Object.assign(this, init);
    }

    static fromHttpResponse(payload: any): AccountStorage {
        let result = new AccountStorage();

        const pairs = payload["pairs"] || {};
        const entries: AccountStorageEntry[] = [];

        for (const element of pairs.items) {
            const decodedKey = BytesValue.fromHex(element.key).toString();
            const decodedValue = BytesValue.fromHex(element.value);
            entries.push(
                new AccountStorageEntry({
                    raw: { key: element.value },
                    key: decodedKey,
                    value: decodedValue.toString(),
                }),
            );
        }

        result.raw = payload;
        result.entries = entries;
        result.blockCoordinates = BlockCoordinates.fromHttpResponse(payload);

        return result;
    }
}

export class BlockCoordinates {
    nonce: bigint = 0n;
    hash: string = "";
    rootHash?: string;
    constructor(init?: Partial<BlockCoordinates>) {
        Object.assign(this, init);
    }
    static fromHttpResponse(payload: any): BlockCoordinates {
        const result = new BlockCoordinates();
        const value = payload["blockInfo"] || {};

        result.nonce = value["nonce"] || 0n;
        result.hash = value["hash"] || "";
        result.rootHash = value["rootHash"] || "";

        return result;
    }
}

export class AccountStorageEntry {
    raw: Record<string, any> = {};
    address: Address = Address.empty();
    key: string = "";
    value: string = "";
    constructor(init?: Partial<AccountStorageEntry>) {
        Object.assign(this, init);
    }

    static fromHttpResponse(payload: any, key: string): AccountStorageEntry {
        const result = new AccountStorageEntry();
        const value = payload["value"] || "";

        result.raw = payload;
        result.key = key;
        result.value = BytesValue.fromHex(value).toString();

        return result;
    }
}

export class AwaitingOptions {
    pollingIntervalInMilliseconds: number = DEFAULT_ACCOUNT_AWAITING_POLLING_TIMEOUT_IN_MILLISECONDS;
    timeoutInMilliseconds: number = DEFAULT_ACCOUNT_AWAITING_TIMEOUT_IN_MILLISECONDS;
    patienceInMilliseconds: number = DEFAULT_ACCOUNT_AWAITING_PATIENCE_IN_MILLISECONDS;
}

export class TransactionCostEstimationResponse {
    raw: Record<string, any> = {};
    gasLimit: number = 0;
    status: TransactionStatus = TransactionStatus.createUnknown();

    static fromHttpResponse(payload: any): TransactionCostEstimationResponse {
        const result = new TransactionCostEstimationResponse();

        result.raw = payload;
        result.gasLimit = payload["txGasUnits"] ?? 0;
        result.status = new TransactionStatus("");

        return result;
    }
}

export class GetBlockArguments {
    shard?: number;
    blockNonce?: bigint;
    blockHash?: string;
    constructor(init?: Partial<GetBlockArguments>) {
        Object.assign(this, init);
    }
}
