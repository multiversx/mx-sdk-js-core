import { IAddress } from "../interface";

export type IssueFungibleInput = IssueInput & { initialSupply: bigint; numDecimals: bigint };

export type IssueSemiFungibleInput = IssueNonFungibleInput;

export type IssueNonFungibleInput = IssueInput & { canTransferNFTCreateRole: boolean };

export type IssueInput = {
    nonce: bigint;
    tokenName: string;
    tokenTicker: string;
    canFreeze: boolean;
    canWipe: boolean;
    canPause: boolean;
    canTransferNFTCreateRole: boolean;
    canChangeOwner: boolean;
    canUpgrade: boolean;
    canAddSpecialRoles: boolean;
};

export type FungibleSpecialRoleInput = SpecialRoleInput & {
    addRoleLocalMint: boolean;
    addRoleLocalBurn: boolean;
    addRoleESDTTransferRole: boolean;
};
export type SemiFungibleSpecialRoleInput = SpecialRoleInput & { addRoleNFTAddQuantity: boolean };

export type SpecialRoleInput = {
    nonce: bigint;
    user: IAddress;
    tokenIdentifier: string;
    addRoleNFTCreate: boolean;
    addRoleNFTBurn: boolean;
    addRoleNFTUpdateAttributes: boolean;
    addRoleNFTAddURI: boolean;
    addRoleESDTTransferRole: boolean;
    addRoleESDTModifyCreator?: boolean;
    addRoleNFTRecreate?: boolean;
    addRoleESDTSetNewURI?: boolean;
    addRoleESDTModifyRoyalties?: boolean;
};

export type MintInput = {
    nonce: bigint;
    tokenIdentifier: string;
    initialQuantity: bigint;
    name: string;
    royalties: number;
    hash: string;
    attributes: Uint8Array;
    uris: string[];
};
export type ManagementInput = { nonce: bigint; user: IAddress; tokenIdentifier: string };
export type LocalBurnInput = { nonce: bigint; tokenIdentifier: string; supplyToBurn: bigint };
export type LocalMintInput = { nonce: bigint; tokenIdentifier: string; supplyToMint: bigint };

export type UpdateAttributesInput = UpdateInput & { attributes: Uint8Array };

export type UpdateQuantityInput = UpdateInput & { quantity: bigint };

export type UpdateInput = { nonce: bigint; tokenIdentifier: string; tokenNonce: bigint };

export type RegisterRolesInput = {
    nonce: bigint;
    tokenName: string;
    tokenTicker: string;
    tokenType: TokenType;
    numDecimals: bigint;
};

export type RegisterMetaESDTInput = {
    nonce: bigint;
    tokenName: string;
    tokenTicker: string;
    numDecimals: bigint;
    canFreeze: boolean;
    canWipe: boolean;
    canPause: boolean;
    canTransferNFTCreateRole: boolean;
    canChangeOwner: boolean;
    canUpgrade: boolean;
    canAddSpecialRoles: boolean;
};

type TokenType = "NFT" | "SFT" | "META" | "FNG";
