import { BigNumber } from "bignumber.js";
import { AccountOnNetwork } from "../account";
import { Address } from "../address";
import { NetworkConfig } from "../networkConfig";
import { GasLimit } from "../networkParams";
import { NetworkStake } from "../networkStake";
import { NetworkStatus } from "../networkStatus";
import { Nonce } from "../nonce";
import { Query, ReturnCode } from "../smartcontracts";
import { Stats } from "../stats";
import { Transaction } from "../transaction";
import { TransactionOnNetwork } from "./transactions";
import { TransactionStatus } from "./transactionStatus";

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
    getTransaction(txHash: IHash): Promise<TransactionOnNetwork>;

    /**
     * Queries the status of a {@link Transaction}.
     */
    getTransactionStatus(txHash: IHash): Promise<TransactionStatus>;

    /**
     * Broadcasts an already-signed {@link Transaction}.
     */
    sendTransaction(tx: Transaction): Promise<IHash>;

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

export interface IHash { hex(): string; }
export interface IAddress { bech32(): string; }
export interface INonce { valueOf(): number; }
export interface IHexable { hex(): string }
export interface ITransactionPayload { encoded(): string; }
