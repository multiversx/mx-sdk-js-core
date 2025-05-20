import { LibraryConfig } from "./config";

export class TransactionsFactoryConfig {
    chainID: string;
    addressHrp: string;
    minGasLimit: bigint;
    gasLimitPerByte: bigint;
    gasLimitIssue: bigint;
    gasLimitToggleBurnRoleGlobally: bigint;
    gasLimitEsdtLocalMint: bigint;
    gasLimitEsdtLocalBurn: bigint;
    gasLimitSetSpecialRole: bigint;
    gasLimitPausing: bigint;
    gasLimitFreezing: bigint;
    gasLimitWiping: bigint;
    gasLimitEsdtNftCreate: bigint;
    gasLimitEsdtNftUpdateAttributes: bigint;
    gasLimitEsdtNftAddQuantity: bigint;
    gasLimitEsdtNftBurn: bigint;
    gasLimitStorePerByte: bigint;
    issueCost: bigint;
    gasLimitStake: bigint;
    gasLimitUnstake: bigint;
    gasLimitUnbond: bigint;
    gasLimitCreateDelegationContract: bigint;
    gasLimitDelegationOperations: bigint;
    additionalGasLimitPerValidatorNode: bigint;
    additionalGasLimitForDelegationOperations: bigint;
    gasLimitESDTTransfer: bigint;
    gasLimitESDTNFTTransfer: bigint;
    gasLimitMultiESDTNFTTransfer: bigint;
    gasLimitSaveKeyValue: bigint;
    gasLimitPersistPerByte: bigint;
    gasLimitSetGuardian: bigint;
    gasLimitGuardAccount: bigint;
    gasLimitUnguardAccount: bigint;
    gasLimitClaimDeveloperRewards: bigint;
    gasLimitChangeOwnerAddress: bigint;
    gasLimitEsdtModifyRoyalties: bigint;
    gasLimitEsdtModifyCreator: bigint;
    gasLimitEsdtMetadataUpdate: bigint;
    gasLimitSetNewUris: bigint;
    gasLimitNftMetadataRecreate: bigint;
    gasLimitNftChangeToDynamic: bigint;
    gasLimitUpdateTokenId: bigint;
    gasLimitRegisterDynamic: bigint;
    gasLimitForProposal: bigint;
    gasLimitForVote: bigint;
    gasLimitForClosingProposal: bigint;
    gasLimitForClearProposals: bigint;
    gasLimitForChangeConfig: bigint;
    gasLimitForClaimAccumulatedFees: bigint;

    constructor(options: { chainID: string }) {
        // General-purpose configuration
        this.chainID = options.chainID;
        this.addressHrp = LibraryConfig.DefaultAddressHrp;
        this.minGasLimit = 50000n;
        this.gasLimitPerByte = 1500n;

        // Configuration for token operations
        this.gasLimitIssue = 60000000n;
        this.gasLimitToggleBurnRoleGlobally = 60000000n;
        this.gasLimitEsdtLocalMint = 300000n;
        this.gasLimitEsdtLocalBurn = 300000n;
        this.gasLimitSetSpecialRole = 60000000n;
        this.gasLimitPausing = 60000000n;
        this.gasLimitFreezing = 60000000n;
        this.gasLimitWiping = 60000000n;
        this.gasLimitEsdtNftCreate = 3000000n;
        this.gasLimitEsdtNftUpdateAttributes = 50000n;
        this.gasLimitEsdtNftAddQuantity = 50000n;
        this.gasLimitEsdtNftBurn = 50000n;
        this.gasLimitStorePerByte = 10000n;
        this.issueCost = 50000000000000000n;
        this.gasLimitEsdtModifyRoyalties = 60000000n;
        this.gasLimitEsdtModifyCreator = 60000000n;
        this.gasLimitEsdtMetadataUpdate = 60000000n;
        this.gasLimitSetNewUris = 60000000n;
        this.gasLimitNftMetadataRecreate = 60000000n;
        this.gasLimitNftChangeToDynamic = 60000000n;
        this.gasLimitUpdateTokenId = 60000000n;
        this.gasLimitRegisterDynamic = 60000000n;

        // Configuration for delegation operations
        this.gasLimitStake = 5000000n;
        this.gasLimitUnstake = 5000000n;
        this.gasLimitUnbond = 5000000n;
        this.gasLimitCreateDelegationContract = 50000000n;
        this.gasLimitDelegationOperations = 1000000n;
        this.additionalGasLimitPerValidatorNode = 6000000n;
        this.additionalGasLimitForDelegationOperations = 10000000n;

        // Configuration for account operations
        this.gasLimitSaveKeyValue = 100000n;
        this.gasLimitPersistPerByte = 1000n;
        this.gasLimitSetGuardian = 250000n;
        this.gasLimitGuardAccount = 250000n;
        this.gasLimitUnguardAccount = 250000n;

        // Configuration for token transfers
        this.gasLimitESDTTransfer = 200000n;
        this.gasLimitESDTNFTTransfer = 200000n;
        this.gasLimitMultiESDTNFTTransfer = 200000n;

        // Configuration for smart contract operations
        this.gasLimitClaimDeveloperRewards = 6000000n;
        this.gasLimitChangeOwnerAddress = 6000000n;

        // Configuration for governance operations
        this.gasLimitForProposal = 50_000_000n;
        this.gasLimitForVote = 5_000_000n;
        this.gasLimitForClosingProposal = 50_000_000n;
        this.gasLimitForClearProposals = 50_000_000n;
        this.gasLimitForChangeConfig = 50_000_000n;
        this.gasLimitForClaimAccumulatedFees = 1_000_000n;
    }
}
