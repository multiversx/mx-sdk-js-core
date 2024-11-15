import { IAddress } from "../interface";

export type IssueFungibleInput = IssueInput & { initialSupply: bigint; numDecimals: bigint };

export type IssueSemiFungibleInput = IssueNonFungibleInput;

export type IssueNonFungibleInput = IssueInput & { canTransferNFTCreateRole: boolean };

export type IssueInput = {
    tokenName: string;
    tokenTicker: string;
    canFreeze: boolean;
    canWipe: boolean;
    canPause: boolean;
    canChangeOwner: boolean;
    canUpgrade: boolean;
    canAddSpecialRoles: boolean;
};

export type FungibleSpecialRoleInput = {
    user: IAddress;
    tokenIdentifier: string;
    addRoleLocalMint: boolean;
    addRoleLocalBurn: boolean;
    addRoleESDTTransferRole: boolean;
};
export type SemiFungibleSpecialRoleInput = SpecialRoleInput & { addRoleNFTAddQuantity: boolean };

export type SpecialRoleInput = {
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
    tokenIdentifier: string;
    initialQuantity: bigint;
    name: string;
    royalties: number;
    hash: string;
    attributes: Uint8Array;
    uris: string[];
};
export type ManagementInput = { user: IAddress; tokenIdentifier: string };
export type LocalBurnInput = { tokenIdentifier: string; supplyToBurn: bigint };
export type LocalMintInput = { tokenIdentifier: string; supplyToMint: bigint };

export type UpdateAttributesInput = UpdateInput & { attributes: Uint8Array };

export type UpdateQuantityInput = UpdateInput & { quantity: bigint };

export type UpdateInput = { tokenIdentifier: string; tokenNonce: bigint };
export type BurnRoleGloballyInput = { tokenIdentifier: string };

export type RegisterRolesInput = {
    tokenName: string;
    tokenTicker: string;
    tokenType: TokenType;
    numDecimals: bigint;
};

export type RegisterMetaESDTInput = {
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

export type ModifyRoyaltiesInput = BaseInput & { newRoyalties: bigint };

export type BaseInput = { tokenIdentifier: string; tokenNonce: bigint };

export type SetNewUriInput = BaseInput & { newUris: string[] };

export type UpdateMetadataInput = {
    tokenIdentifier: string;
    tokenNonce: bigint;
    newTokenName?: string;
    newRoyalties?: bigint;
    newHash?: string;
    newAttributes?: Uint8Array;
    newUris?: string[];
};

export type RegisteringDynamicTokenInput = { tokenName: string; tokenTicker: string; tokenType: TokenType };

type TokenType = "NFT" | "SFT" | "META" | "FNG";

export type SpecialRoleOutput = {
    userAddress: string;
    tokenIdentifier: string;
    roles: string[];
};

export type MintNftOutput = {
    tokenIdentifier: string;
    nonce: bigint;
    initialQuantity: bigint;
};
