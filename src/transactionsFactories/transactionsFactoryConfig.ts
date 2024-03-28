import { DEFAULT_HRP } from "../constants";

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

    constructor(options: { chainID: string }) {
        // General-purpose configuration
        this.chainID = options.chainID;
        this.addressHrp = DEFAULT_HRP;
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
        this.gasLimitEsdtNftUpdateAttributes = 1000000n;
        this.gasLimitEsdtNftAddQuantity = 1000000n;
        this.gasLimitEsdtNftBurn = 1000000n;
        this.gasLimitStorePerByte = 50000n;
        this.issueCost = 50000000000000000n;

        // Configuration for delegation operations
        this.gasLimitStake = 5000000n;
        this.gasLimitUnstake = 5000000n;
        this.gasLimitUnbond = 5000000n;
        this.gasLimitCreateDelegationContract = 50000000n;
        this.gasLimitDelegationOperations = 1000000n;
        this.additionalGasLimitPerValidatorNode = 6000000n;
        this.additionalGasLimitForDelegationOperations = 10000000n;

        // Configuration for token transfers
        this.gasLimitESDTTransfer = 200000n;
        this.gasLimitESDTNFTTransfer = 200000n;
        this.gasLimitMultiESDTNFTTransfer = 200000n;
    }
}
