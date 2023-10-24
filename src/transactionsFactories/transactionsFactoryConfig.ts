import { BigNumber } from "bignumber.js";
import { DEFAULT_HRP } from "../constants";

export class TransactionsFactoryConfig {
    chainID: string;
    addressHrp: string;
    minGasLimit: BigNumber.Value;
    gasLimitPerByte: BigNumber.Value;
    gasLimitIssue: BigNumber.Value;
    gasLimitToggleBurnRoleGlobally: BigNumber.Value;
    gasLimitEsdtLocalMint: BigNumber.Value;
    gasLimitEsdtLocalBurn: BigNumber.Value;
    gasLimitSetSpecialRole: BigNumber.Value;
    gasLimitPausing: BigNumber.Value;
    gasLimitFreezing: BigNumber.Value;
    gasLimitWiping: BigNumber.Value;
    gasLimitEsdtNftCreate: BigNumber.Value;
    gasLimitEsdtNftUpdateAttributes: BigNumber.Value;
    gasLimitEsdtNftAddQuantity: BigNumber.Value;
    gasLimitEsdtNftBurn: BigNumber.Value;
    gasLimitStorePerByte: BigNumber.Value;
    issueCost: BigNumber.Value;
    gasLimitStake: BigNumber.Value;
    gasLimitUnstake: BigNumber.Value;
    gasLimitUnbond: BigNumber.Value;
    gasLimitCreateDelegationContract: BigNumber.Value;
    gasLimitDelegationOperations: BigNumber.Value;
    additionalGasLimitPerValidatorNode: BigNumber.Value;
    additionalGasLimitForDelegationOperations: BigNumber.Value;
    gasLimitESDTTransfer: BigNumber.Value;
    gasLimitESDTNFTTransfer: BigNumber.Value;
    gasLimitMultiESDTNFTTransfer: BigNumber.Value;

    constructor(chainId: string) {
        // General-purpose configuration
        this.chainID = chainId;
        this.addressHrp = DEFAULT_HRP;
        this.minGasLimit = new BigNumber(50000);
        this.gasLimitPerByte = new BigNumber(1500);

        // Configuration for token operations
        this.gasLimitIssue = new BigNumber(60000000);
        this.gasLimitToggleBurnRoleGlobally = new BigNumber(60000000);
        this.gasLimitEsdtLocalMint = new BigNumber(300000);
        this.gasLimitEsdtLocalBurn = new BigNumber(300000);
        this.gasLimitSetSpecialRole = new BigNumber(60000000);
        this.gasLimitPausing = new BigNumber(60000000);
        this.gasLimitFreezing = new BigNumber(60000000);
        this.gasLimitWiping = new BigNumber(60000000);
        this.gasLimitEsdtNftCreate = new BigNumber(3000000);
        this.gasLimitEsdtNftUpdateAttributes = new BigNumber(1000000);
        this.gasLimitEsdtNftAddQuantity = new BigNumber(1000000);
        this.gasLimitEsdtNftBurn = new BigNumber(1000000);
        this.gasLimitStorePerByte = new BigNumber(50000);
        this.issueCost = new BigNumber("50000000000000000");

        // Configuration for delegation operations
        this.gasLimitStake = new BigNumber(5000000);
        this.gasLimitUnstake = new BigNumber(5000000);
        this.gasLimitUnbond = new BigNumber(5000000);
        this.gasLimitCreateDelegationContract = new BigNumber(50000000);
        this.gasLimitDelegationOperations = new BigNumber(1000000);
        this.additionalGasLimitPerValidatorNode = new BigNumber(6000000);
        this.additionalGasLimitForDelegationOperations = new BigNumber(10000000);

        // Configuration for token transfers
        this.gasLimitESDTTransfer = new BigNumber(200000);
        this.gasLimitESDTNFTTransfer = new BigNumber(200000);
        this.gasLimitMultiESDTNFTTransfer = new BigNumber(200000);
    }
}
