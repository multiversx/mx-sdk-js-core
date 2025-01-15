import { Address } from "../address";
import { SmartContractQuery, SmartContractQueryResponse } from "../smartContractQuery";
import { Token } from "../tokens";
import { Transaction } from "../transaction";
import { TransactionOnNetwork } from "../transactionOnNetwork";
import { AccountOnNetwork } from "./accounts";
import { BlockOnNetwork } from "./blockOnNetwork";
import { NetworkConfig } from "./networkConfig";
import { NetworkStatus } from "./networkStatus";
import {
    AccountStorage,
    AccountStorageEntry,
    AwaitingOptions,
    GetBlockArguments,
    TransactionCostEstimationResponse,
} from "./resources";
import { DefinitionOfFungibleTokenOnNetwork, DefinitionOfTokenCollectionOnNetwork } from "./tokenDefinitions";
import { FungibleTokenOfAccountOnNetwork, NonFungibleTokenOfAccountOnNetwork } from "./tokens";

/**
 * An interface that defines the endpoints of an HTTP API Provider.
 */
export interface INetworkProvider {
    /**
     * Fetches the Network configuration.
     */
    getNetworkConfig(): Promise<NetworkConfig>;

    /**
     * Fetches the Network status.
     */
    getNetworkStatus(): Promise<NetworkStatus>;

    /**
     * Fetches a block by nonce or by hash.
     */
    getBlock(blockArgs: GetBlockArguments): Promise<BlockOnNetwork>;

    /**
     * Fetches the latest block of a shard.
     */
    getLatestBlock(shard: number): Promise<BlockOnNetwork>;

    /**
     * Fetches the state of an account.
     */
    getAccount(address: Address): Promise<AccountOnNetwork>;

    /**
     * Fetches the storage (key-value pairs) of an account.
     */
    getAccountStorage(address: Address): Promise<AccountStorage>;

    /**
     * Fetches a specific storage entry of an account.
     */
    getAccountStorageEntry(address: Address, entryKey: string): Promise<AccountStorageEntry>;

    /**
     * Waits until an account satisfies a given condition.
     * Can throw:
     * - ErrAwaitConditionNotReached
     */
    awaitAccountOnCondition(
        address: Address,
        condition: (account: AccountOnNetwork) => boolean,
        options?: AwaitingOptions,
    ): AccountOnNetwork;

    /**
     * Broadcasts an already-signed transaction.
     */
    sendTransaction(tx: Transaction): Promise<string>;

    /**
     * Simulates the processing of an already-signed transaction.
     *
     */
    simulateTransaction(tx: Transaction): Promise<TransactionOnNetwork>;

    /**
     * Estimates the cost of a transaction.
     *
     */
    estimateTransactionCost(tx: Transaction): Promise<TransactionCostEstimationResponse>;

    /**
     * Broadcasts a list of already-signed transactions.
     */
    sendTransactions(txs: Transaction[]): Promise<string[]>;

    /**
     * Fetches the state of a transaction.
     */
    getTransaction(txHash: string, withProcessStatus?: boolean): Promise<TransactionOnNetwork>;

    /**
     * Waits until the transaction satisfies a given condition.
     * Can throw:
     * - ErrAwaitConditionNotReached
     */
    awaitTransactionOnCondition(
        transactionHash: string,
        condition: (account: TransactionOnNetwork) => boolean,
        options?: AwaitingOptions,
    ): Promise<TransactionOnNetwork>;

    /**
     * Waits until the transaction is completely processed.
     * Can throw:
     * - ErrAwaitConditionNotReached
     */
    awaitTransactionCompleted(transactionHash: string, options?: AwaitingOptions): Promise<TransactionOnNetwork>;

    /**
     * Fetches the balance of an account, for a given token.
     */
    getTokenOfAccount(address: Address, token: Token): Promise<FungibleTokenOfAccountOnNetwork>;

    /**
     * Fetches data about the fungible tokens held by an account.
     */
    getFungibleTokensOfAccount(address: Address, pagination?: IPagination): Promise<FungibleTokenOfAccountOnNetwork[]>;

    /**
     * Fetches data about the non-fungible tokens held by account.
     */
    getNonFungibleTokensOfAccount(
        address: Address,
        pagination?: IPagination,
    ): Promise<NonFungibleTokenOfAccountOnNetwork[]>;

    /**
     * Fetches data about a specific fungible token held by an account.
     */
    getFungibleTokenOfAccount(address: Address, tokenIdentifier: string): Promise<FungibleTokenOfAccountOnNetwork>;

    /**
     * Fetches data about a specific non-fungible token (instance) held by an account.
     */
    getNonFungibleTokenOfAccount(
        address: Address,
        collection: string,
        nonce: number,
    ): Promise<NonFungibleTokenOfAccountOnNetwork>;

    /**
     * Fetches the definition of a fungible token.
     */
    getDefinitionOfFungibleToken(tokenIdentifier: string): Promise<DefinitionOfFungibleTokenOnNetwork>;

    /**
     * Fetches the definition of a SFT (including Meta ESDT) or NFT.
     */
    getDefinitionOfTokenCollection(collection: string): Promise<DefinitionOfTokenCollectionOnNetwork>;

    /**
     * Queries a Smart Contract - runs a pure function defined by the contract and returns its results.
     */
    queryContract(query: SmartContractQuery): Promise<SmartContractQueryResponse>;

    /**
     * Fetches data about a specific non-fungible token (instance).
     */
    getNonFungibleToken(collection: string, nonce: number): Promise<NonFungibleTokenOfAccountOnNetwork>;

    /**
     * Performs a generic GET action against the provider (useful for new HTTP endpoints).
     */
    doGetGeneric(resourceUrl: string): Promise<any>;

    /**
     * Performs a generic POST action against the provider (useful for new HTTP endpoints).
     */
    doPostGeneric(resourceUrl: string, payload: any): Promise<any>;
}

export interface IPagination {
    from: number;
    size: number;
}
