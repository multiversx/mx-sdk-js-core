import { TokenType } from "../core";
import { Address } from "../core/address";

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
    user: Address;
    tokenIdentifier: string;
    localMintRole: boolean;
    localBurnRole: boolean;
    ESDTTransferRole: boolean;
};
export type SemiFungibleSpecialRoleInput = {
    user: Address;
    tokenIdentifier: string;
    NFTCreateRole: boolean;
    NFTBurnRole: boolean;
    NFTAddQuantityRole: boolean;
    ESDTTransferRole: boolean;
};

export type SpecialRoleInput = {
    user: Address;
    tokenIdentifier: string;
    NFTCreateRole: boolean;
    NFTBurnRole: boolean;
    NFTUpdateAttributesRole: boolean;
    NFTAddURIRole: boolean;
    ESDTTransferRole: boolean;
    ESDTModifyCreatorRole?: boolean;
    NFTRecreateRole?: boolean;
    ESDTSetNewURIRole?: boolean;
    ESDTModifyRoyaltiesRole?: boolean;
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
export type ManagementInput = { user: Address; tokenIdentifier: string };
export type PausingInput = { tokenIdentifier: string };
export type LocalBurnInput = { tokenIdentifier: string; supplyToBurn: bigint };
export type LocalMintInput = { tokenIdentifier: string; supplyToMint: bigint };

export type UpdateAttributesInput = UpdateInput & { attributes: Uint8Array };

export type UpdateQuantityInput = UpdateInput & { quantity: bigint };

export type UpdateInput = { tokenIdentifier: string; tokenNonce: bigint };
export type BurnRoleGloballyInput = { tokenIdentifier: string };
export type UpdateTokenIDInput = { tokenIdentifier: string };
export type ChangeTokenToDynamicInput = { tokenIdentifier: string };

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
export type ModifyCreatorInput = BaseInput;

export type BaseInput = { tokenIdentifier: string; tokenNonce: bigint };

export type SetNewUriInput = BaseInput & { newUris: string[] };

export type ManageMetadataInput = {
    tokenIdentifier: string;
    tokenNonce: bigint;
    newTokenName?: string;
    newRoyalties?: bigint;
    newHash?: string;
    newAttributes?: Uint8Array;
    newUris?: string[];
};

export type RegisteringDynamicTokenInput = { tokenName: string; tokenTicker: string; tokenType: TokenType };

export type SpecialRoleOutput = {
    userAddress: Address;
    tokenIdentifier: string;
    roles: string[];
};

export type MintNftOutput = {
    tokenIdentifier: string;
    nonce: bigint;
    initialQuantity: bigint;
};

export type EsdtOutput = { tokenIdentifier: string };
export type ModifyRoyaltiesOutput = { tokenIdentifier: string; nonce: bigint; royalties: bigint };
export type SetNewUrisOutput = { tokenIdentifier: string; nonce: bigint; uri: string };
export type ModifyingCreatorOutput = { tokenIdentifier: string; nonce: bigint };
export type UpdateAttibutesOutput = { tokenIdentifier: string; nonce: bigint; metadata: Uint8Array };
export type ChangeToDynamicOutput = {
    tokenIdentifier: string;
    tokenName: string;
    tickerName: string;
    tokenType: string;
};
export type UpdateTokenIDOutput = { caller: Address; tokenIdentifier: string; token: string };
export type RegisterDynamicOutput = {
    tokenIdentifier: string;
    tokenName: string;
    tokenTicker: string;
    tokenType: string;
    numOfDecimals: number;
};
