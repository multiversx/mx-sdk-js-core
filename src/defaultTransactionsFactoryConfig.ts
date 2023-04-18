import BigNumber from "bignumber.js";
import { Address } from "./address";
import { TRANSACTION_MIN_GAS_PRICE } from "./constants";
import { IAddress, IChainID, IGasLimit, IGasPrice } from "./interface";

/**
 * The configuration contains, among others, the network's gas configuration & gas schedule (kept up-to-date on a best efforts basis):
 *  - https://gateway.multiversx.com/network/config
 *  - https://github.com/multiversx/mx-chain-mainnet-config/tree/master/gasSchedules
 *  - https://github.com/multiversx/mx-chain-mainnet-config/blob/master/enableEpochs.toml#L200
 */
export class DefaultTransactionsFactoryConfig {
    chainID: IChainID;
    minGasPrice: IGasPrice = TRANSACTION_MIN_GAS_PRICE;
    minGasLimit = 50000;
    gasLimitPerByte = 1500;
    extraGasLimitGuardedTransaction: IGasLimit = 50000;

    gasLimitESDTTransfer: IGasLimit = 200000;
    gasLimitESDTNFTTransfer: IGasLimit = 200000;
    gasLimitESDTNFTMultiTransfer: IGasLimit = 200000;

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
