import { BigNumber } from "bignumber.js";
import { AccountOnNetwork } from "../account";
import { Address } from "../address";
import { Balance } from "../balance";
import { Hash } from "../hash";
import { NetworkConfig } from "../networkConfig";
import { GasLimit, GasPrice } from "../networkParams";
import { NetworkStake } from "../networkStake";
import { NetworkStatus } from "../networkStatus";
import { Nonce } from "../nonce";
import { Signature } from "../signature";
import { Query, ReturnCode } from "../smartcontracts";
import { Stats } from "../stats";
import { Transaction, TransactionHash, TransactionStatus } from "../transaction";
import { TransactionPayload } from "../transactionPayload";

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
     * Fetches stake statistics.
     */
    getNetworkStakeStatistics(): Promise<NetworkStake>;

    /**
     * Fetches general statistics.
     */
    getNetworkGeneralStatistics(): Promise<Stats>;

    /**
     * Fetches the state of an {@link Account}.
     */
    getAccount(address: Address): Promise<AccountOnNetwork>;

    /**
     * Fetches data about the fungible tokens held by an account.
     */
    getFungibleTokensOfAccount(address: Address, pagination?: Pagination): Promise<IFungibleTokenOfAccountOnNetwork[]>;

    /**
     * Fetches data about the non-fungible tokens held by account.
     */
    getNonFungibleTokensOfAccount(address: Address, pagination?: Pagination): Promise<INonFungibleTokenOfAccountOnNetwork[]>;

    /**
     * Fetches data about a specific fungible token held by an account.
     */
    getFungibleTokenOfAccount(address: Address, tokenIdentifier: string): Promise<IFungibleTokenOfAccountOnNetwork>;

    /**
     * Fetches data about a specific non-fungible token (instance) held by an account.
     */
    getNonFungibleTokenOfAccount(address: Address, collection: string, nonce: Nonce): Promise<INonFungibleTokenOfAccountOnNetwork>;

    /**
     * Fetches the state of a {@link Transaction}.
     */
    getTransaction(txHash: TransactionHash): Promise<ITransactionOnNetwork>;

    /**
     * Queries the status of a {@link Transaction}.
     */
    getTransactionStatus(txHash: TransactionHash): Promise<TransactionStatus>;

    /**
     * Broadcasts an already-signed {@link Transaction}.
     */
    sendTransaction(tx: Transaction): Promise<TransactionHash>;

    /**
     * Simulates the processing of an already-signed {@link Transaction}.
     * 
     */
    simulateTransaction(tx: Transaction): Promise<IContractSimulation>;

    /**
     * Queries a Smart Contract - runs a pure function defined by the contract and returns its results.
     */
    queryContract(query: Query): Promise<IContractQueryResponse>;

    /**
     * Fetches the definition of a fungible token.
     *
     */
    getDefinitionOfFungibleToken(tokenIdentifier: string): Promise<IDefinitionOfFungibleTokenOnNetwork>;

    /**
     * Fetches the definition of a SFT (including Meta ESDT) or NFT.
     * 
     */
    getDefinitionOfTokenCollection(collection: string): Promise<IDefinitionOfTokenCollectionOnNetwork>;

    /**
     * Fetches data about a specific non-fungible token (instance).
     */
    getNonFungibleToken(collection: string, nonce: Nonce): Promise<INonFungibleTokenOfAccountOnNetwork>;

    /**
     * Performs a generic GET action against the provider (useful for new HTTP endpoints, not yet supported by erdjs).
     */
    doGetGeneric(resourceUrl: string): Promise<any>;

    /**
     * Performs a generic POST action against the provider (useful for new HTTP endpoints, not yet supported by erdjs).
     */
    doPostGeneric(resourceUrl: string, payload: any): Promise<any>;
}

export interface IFungibleTokenOfAccountOnNetwork {
    identifier: string;
    balance: BigNumber;
}

export interface INonFungibleTokenOfAccountOnNetwork {
    identifier: string;
    collection: string;
    attributes: Buffer;
    balance: BigNumber;
    nonce: Nonce;
    creator: Address;
    royalties: BigNumber;
}


export interface IDefinitionOfFungibleTokenOnNetwork {
    identifier: string;
    name: string;
    ticker: string;
    owner: Address;
    decimals: number;
    supply: BigNumber;
    isPaused: boolean;
    canUpgrade: boolean;
    canMint: boolean;
    canBurn: boolean;
    canChangeOwner: boolean;
    canPause: boolean;
    canFreeze: boolean;
    canWipe: boolean;
    canAddSpecialRoles: boolean;
}

export interface IDefinitionOfTokenCollectionOnNetwork {
    collection: string;
    type: string;
    name: string;
    ticker: string;
    owner: Address;
    decimals: number;
    canPause: boolean;
    canFreeze: boolean;
    canWipe: boolean;
    canTransferRole: boolean;
    // TODO: add "assets", "roles"
}

export interface ITransactionOnNetwork {
    hash: TransactionHash;
    type: string;
    nonce: Nonce;
    round: number;
    epoch: number;
    value: Balance;
    receiver: Address;
    sender: Address;
    gasPrice: GasPrice;
    gasLimit: GasLimit;
    data: TransactionPayload;
    signature: Signature;
    status: TransactionStatus;
    timestamp: number;
    blockNonce: Nonce;
    // Not available on API.
    hyperblockNonce: Nonce;
    // Not available on API.
    hyperblockHash: Hash;
    // Not available on Gateway.
    pendingResults: boolean;
    receipt: ITransactionReceipt;
    contractResults: IContractResults;
    logs: ITransactionLogs;

    isCompleted(): boolean;
    getAllEvents(): ITransactionEvent[];
}

export interface ITransactionReceipt {
    value: Balance;
    sender: Address;
    data: string;
    hash: TransactionHash;
}

export interface IContractResults {
    items: IContractResultItem[];
}

export interface IContractResultItem {
    hash: Hash;
    nonce: Nonce;
    value: Balance;
    receiver: Address;
    sender: Address;
    data: string;
    returnMessage: string;
    previousHash: Hash;
    originalHash: Hash;
    gasLimit: GasLimit;
    gasPrice: GasPrice;
    callType: number;
    logs: ITransactionLogs;
}

export interface ITransactionLogs {
    address: Address;
    events: ITransactionEvent[];

    findSingleOrNoneEvent(identifier: string, predicate?: (event: ITransactionEvent) => boolean): ITransactionEvent | undefined;
    findFirstOrNoneEvent(identifier: string, predicate?: (event: ITransactionEvent) => boolean): ITransactionEvent | undefined;
    findEvents(identifier: string, predicate?: (event: ITransactionEvent) => boolean): ITransactionEvent[];
}

export interface ITransactionEvent {
    readonly address: Address;
    readonly identifier: string;
    readonly topics: ITransactionEventTopic[];
    readonly data: string;

    findFirstOrNoneTopic(predicate: (topic: ITransactionEventTopic) => boolean): ITransactionEventTopic | undefined;
    getLastTopic(): ITransactionEventTopic;
}

export interface ITransactionEventTopic {
    toString(): string;
    hex(): string;
    valueOf(): Buffer;
}

export interface IContractQueryResponse {
    returnData: string[];
    returnCode: ReturnCode;
    returnMessage: string;
    gasUsed: GasLimit;
    
    getReturnDataParts(): Buffer[];
}

export interface IContractSimulation {
}

export class Pagination {
    from: number = 0;
    size: number = 100;

    static default(): Pagination {
        return { from: 0, size: 100 };
    }
}
