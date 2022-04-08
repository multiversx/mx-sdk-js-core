import { AccountOnNetwork } from "./accounts";
import { NetworkConfig } from "./networkConfig";
import { NetworkStake } from "./networkStake";
import { NetworkGeneralStatistics } from "./networkGeneralStatistics";
import { TransactionOnNetwork } from "./transactions";
import { TransactionStatus } from "./transactionStatus";
import { NetworkStatus } from "./networkStatus";
import { ContractQueryResponse } from "./contractQueryResponse";
import { FungibleTokenOfAccountOnNetwork, NonFungibleTokenOfAccountOnNetwork } from "./tokens";
import { DefinitionOfFungibleTokenOnNetwork, DefinitionOfTokenCollectionOnNetwork } from "./tokenDefinitions";

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
    getNetworkGeneralStatistics(): Promise<NetworkGeneralStatistics>;

    /**
     * Fetches the state of an account.
     */
    getAccount(address: IAddress): Promise<AccountOnNetwork>;

    /**
     * Fetches data about the fungible tokens held by an account.
     */
    getFungibleTokensOfAccount(address: IAddress, pagination?: IPagination): Promise<FungibleTokenOfAccountOnNetwork[]>;

    /**
     * Fetches data about the non-fungible tokens held by account.
     */
    getNonFungibleTokensOfAccount(address: IAddress, pagination?: IPagination): Promise<NonFungibleTokenOfAccountOnNetwork[]>;

    /**
     * Fetches data about a specific fungible token held by an account.
     */
    getFungibleTokenOfAccount(address: IAddress, tokenIdentifier: string): Promise<FungibleTokenOfAccountOnNetwork>;

    /**
     * Fetches data about a specific non-fungible token (instance) held by an account.
     */
    getNonFungibleTokenOfAccount(address: IAddress, collection: string, nonce: INonce): Promise<NonFungibleTokenOfAccountOnNetwork>;

    /**
     * Fetches the state of a transaction.
     */
    getTransaction(txHash: IHash): Promise<TransactionOnNetwork>;

    /**
     * Queries the status of a transaction.
     */
    getTransactionStatus(txHash: IHash): Promise<TransactionStatus>;

    /**
     * Broadcasts an already-signed transaction.
     */
    sendTransaction(tx: ITransaction): Promise<IHash>;

    /**
     * Simulates the processing of an already-signed transaction.
     * 
     */
    simulateTransaction(tx: ITransaction): Promise<ISimulationResults>;

    /**
     * Queries a Smart Contract - runs a pure function defined by the contract and returns its results.
     */
    queryContract(query: IContractQuery): Promise<ContractQueryResponse>;

    /**
     * Fetches the definition of a fungible token.
     *
     */
    getDefinitionOfFungibleToken(tokenIdentifier: string): Promise<DefinitionOfFungibleTokenOnNetwork>;

    /**
     * Fetches the definition of a SFT (including Meta ESDT) or NFT.
     * 
     */
    getDefinitionOfTokenCollection(collection: string): Promise<DefinitionOfTokenCollectionOnNetwork>;

    /**
     * Fetches data about a specific non-fungible token (instance).
     */
    getNonFungibleToken(collection: string, nonce: INonce): Promise<NonFungibleTokenOfAccountOnNetwork>;

    /**
     * Performs a generic GET action against the provider (useful for new HTTP endpoints, not yet supported by erdjs).
     */
    doGetGeneric(resourceUrl: string): Promise<any>;

    /**
     * Performs a generic POST action against the provider (useful for new HTTP endpoints, not yet supported by erdjs).
     */
    doPostGeneric(resourceUrl: string, payload: any): Promise<any>;
}

// TODO: network-providers package should be responsible with formatting the http request.
export interface IContractQuery {
    toHttpRequest(): any;
}

export interface IContractReturnCode {
    toString(): string;
    isSuccess(): boolean;
}

export interface ISimulationResults {
}

export interface IPagination {
    from: number;
    size: number;
}

export interface ITransaction {
    toSendable(): any;
}

export interface IHexable { hex(): string; }
export interface IHash extends IHexable { }
export interface IAddress { bech32(): string; }
export interface INonce extends IHexable { valueOf(): number; }
export interface ITransactionPayload { encoded(): string; }
export interface IGasLimit { valueOf(): number; }
export interface IGasPrice { valueOf(): number; }
export interface IChainID { valueOf(): string; }
export interface ITransactionVersion { valueOf(): number; }
export interface IAccountBalance { toString(): string; }
