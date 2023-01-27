import BigNumber from "bignumber.js";
import { IAddress } from "../interface";
import { Transaction } from "../transaction";


export interface IPlainTransactionObject {
    nonce: number;
    value: string;
    receiver: string;
    sender: string;
    gasPrice: number;
    gasLimit: number;
    data?: string;
    chainID: string;
    version: number;
    options?: number;
    signature?: string;
}

export interface IConfiguration {
    GasPrice: IGasPrice;
    GasLimitESDTIssue: IGasLimit;
    GasLimitESDTLocalMint: IGasLimit;
    GasLimitESDTLocalBurn: IGasLimit;
    GasLimitSetSpecialRole: IGasLimit;
    GasLimitPausing: IGasLimit;
    GasLimitFreezing: IGasLimit;
    IssueCost: BigNumber.Value;
    TransactionVersion: ITransactionVersion;
    TransactionOptions: ITransactionOptions;
    ESDTContractAddress: IAddress;
}

export interface IBuiltBundle {
    transaction: Transaction;
    plainTransaction: IPlainTransactionObject;
    transactionPayloadString: string;
    dataParts: Buffer[];
}



export interface IESDTIssueBuilderConstructorOptions extends IBaseBuilderConstructorOptions {
    issuer: IAddress;
    tokenName: string;
    tokenTicker: string;
    initialSupply: BigNumber.Value;
    numDecimals: number;

    canFreeze?: boolean;
    canWipe?: boolean;
    canPause?: boolean;
    canMint?: boolean;
    canBurn?: boolean;
    canChangeOwner?: boolean;
    canUpgrade: boolean
    canAddSpecialRoles: boolean;
}

export interface IESDTLocalMintBuilderConstructorOptions extends IBaseBuilderConstructorOptions {
    managerAddress: IAddress;
    tokenIdentifier: ITokenIdentifier;
    supplyToMint: BigNumber.Value;
}

export interface IESDTLocalBurnBuilderConstructorOptions extends IBaseBuilderConstructorOptions {
    managerAddress: IAddress;
    tokenIdentifier: ITokenIdentifier;
    supplyToBurn: BigNumber.Value;
}

export interface IESDTSetSpecialRoleBuilderConstructorOptions extends IBaseBuilderConstructorOptions {
    managerAddress: IAddress;
    userAddress: IAddress;
    tokenIdentifier: ITokenIdentifier;
    addRoleLocalMint: boolean;
    addRoleLocalBurn: boolean;
}

export interface IESDTPausingBuilderConstructorOptions extends IBaseBuilderConstructorOptions {
    managerAddress: IAddress;
    tokenIdentifier: ITokenIdentifier;
    pause: boolean;
    unpause: boolean;
}

export interface IESDTFreezingBuilderConstructorOptions extends IBaseBuilderConstructorOptions {
    managerAddress: IAddress;
    userAddress: IAddress;
    tokenIdentifier: ITokenIdentifier;
    freeze: boolean;
    unfreeze: boolean;
}
