import BigNumber from "bignumber.js";
import { Address } from "../address";
import { IAddress, IChainID, IGasLimit, IGasPrice } from "../interface";

export class TokenOperationsFactoryConfig {
    chainID: IChainID;
    minGasPrice: IGasPrice = 1000000000;
    minGasLimit = 50000;
    gasLimitPerByte = 1500;
    gasLimitIssue: IGasLimit = 60000000;
    gasLimitESDTLocalMint: IGasLimit = 300000;
    gasLimitESDTLocalBurn: IGasLimit = 300000;
    gasLimitSetSpecialRole: IGasLimit = 60000000;
    gasLimitPausing: IGasLimit = 60000000;
    gasLimitFreezing: IGasLimit = 60000000;
    gasLimitWiping: IGasLimit = 60000000;
    gasLimitESDTNFTCreate: IGasLimit = 3000000;
    gasLimitESDTNFTUpdateAttributes: IGasLimit = 1000000;
    gasLimitESDTNFTAddQuantity: IGasLimit = 1000000;
    gasLimitESDTNFTBurn: IGasLimit = 1000000;
    gasLimitStorePerByte: IGasLimit = 50000;
    issueCost: BigNumber.Value = "50000000000000000";
    esdtContractAddress: IAddress = Address.fromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u");

    constructor(chainID: IChainID) {
        this.chainID = chainID;
    }
}
