import { DefaultTransactionsFactoryConfig } from "./defaultTransactionsFactoryConfig";

interface IGasConfiguration {
    readonly minGasLimit: number;
    readonly extraGasLimitGuardedTransaction: number;
    readonly gasPerDataByte: number;
    readonly gasCostESDTTransfer: number;
    readonly gasCostESDTNFTTransfer: number;
    readonly gasCostESDTNFTMultiTransfer: number;
}

const defaultConfig = new DefaultTransactionsFactoryConfig("");

export const DefaultGasConfiguration: IGasConfiguration = {
    minGasLimit: defaultConfig.minGasLimit,
    extraGasLimitGuardedTransaction: defaultConfig.extraGasLimitGuardedTransaction.valueOf(),
    gasPerDataByte: defaultConfig.gasLimitPerByte.valueOf(),
    gasCostESDTTransfer: defaultConfig.gasLimitESDTTransfer.valueOf(),
    gasCostESDTNFTTransfer: defaultConfig.gasLimitESDTNFTTransfer.valueOf(),
    gasCostESDTNFTMultiTransfer: defaultConfig.gasLimitESDTNFTMultiTransfer.valueOf()
};

// Additional gas to account for eventual increases in gas requirements (thus avoid fast-breaking changes in clients of the library).
const ADDITIONAL_GAS_FOR_ESDT_TRANSFER = 100000;

// Additional gas to account for extra blockchain operations (e.g. data movement (between accounts) for NFTs), 
// and for eventual increases in gas requirements (thus avoid fast-breaking changes in clients of the library).
const ADDITIONAL_GAS_FOR_ESDT_NFT_TRANSFER = 800000;

export class GasEstimator {
    private readonly gasConfiguration: IGasConfiguration;

    constructor(gasConfiguration?: IGasConfiguration) {
        this.gasConfiguration = gasConfiguration || DefaultGasConfiguration;
    }

    forEGLDTransfer(dataLength: number) {
        const gasLimit =
            this.gasConfiguration.minGasLimit +
            this.gasConfiguration.gasPerDataByte * dataLength;

        return gasLimit;
    }

    forGuardedEGLDTransfer(dataLength: number) {
        return this.forEGLDTransfer(dataLength) + this.gasConfiguration.extraGasLimitGuardedTransaction;
    }

    forESDTTransfer(dataLength: number) {
        const gasLimit =
            this.gasConfiguration.minGasLimit +
            this.gasConfiguration.gasCostESDTTransfer +
            this.gasConfiguration.gasPerDataByte * dataLength +
            ADDITIONAL_GAS_FOR_ESDT_TRANSFER;

        return gasLimit;
    }

    forGuardedESDTTransfer(dataLength: number) {
        return this.forESDTTransfer(dataLength) + this.gasConfiguration.extraGasLimitGuardedTransaction;
    }

    forESDTNFTTransfer(dataLength: number) {
        const gasLimit =
            this.gasConfiguration.minGasLimit +
            this.gasConfiguration.gasCostESDTNFTTransfer +
            this.gasConfiguration.gasPerDataByte * dataLength +
            ADDITIONAL_GAS_FOR_ESDT_NFT_TRANSFER;

        return gasLimit;
    }

    forGuardedESDTNFTTransfer(dataLength: number) {
        return this.forESDTNFTTransfer(dataLength) + this.gasConfiguration.extraGasLimitGuardedTransaction;
    }

    forMultiESDTNFTTransfer(dataLength: number, numTransfers: number) {
        const gasLimit =
            this.gasConfiguration.minGasLimit +
            (this.gasConfiguration.gasCostESDTNFTMultiTransfer + ADDITIONAL_GAS_FOR_ESDT_NFT_TRANSFER) * numTransfers +
            this.gasConfiguration.gasPerDataByte * dataLength;

        return gasLimit;
    }

    forGuardedMultiESDTNFTTransfer(dataLength: number, numTransfers: number) {
        return this.forMultiESDTNFTTransfer(dataLength, numTransfers) + this.gasConfiguration.extraGasLimitGuardedTransaction;
    }
}
