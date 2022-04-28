interface IGasConfiguration {
    readonly minGasLimit: number;
    readonly gasPerDataByte: number;
    readonly gasPriceModifier: number;
    readonly gasCostESDTTransfer: number;
    readonly gasCostESDTNFTTransfer: number;
}

/**
 * This is mirroring (on a best efforts basis) the network's gas configuration & gas schedule:
 *  - https://gateway.elrond.com/network/config
 *  - https://github.com/ElrondNetwork/elrond-config-mainnet/tree/master/gasSchedules
 *  - https://github.com/ElrondNetwork/elrond-config-mainnet/blob/master/enableEpochs.toml#L200
 */
const DefaultGasConfiguration: IGasConfiguration = {
    minGasLimit: 50000,
    gasPerDataByte: 1500,
    gasPriceModifier: 100,
    gasCostESDTTransfer: 200000,
    gasCostESDTNFTTransfer: 200000
};

// Additional gas to account for eventual increases in gas requirements (thus avoid fast-breaking changes in clients of erdjs).
const ADDITIONAL_GAS_FOR_ESDT_TRANSFER = 100000;

// Additional gas to account for extra blockchain operations (e.g. data movement (between accounts) for NFTs), 
// and for eventual increases in gas requirements (thus avoid fast-breaking changes in clients of erdjs).
const ADDITIONAL_GAS_FOR_ESDT_NFT_TRANSFER = 500000;

export class GasEstimator {
    private readonly gasConfiguration: IGasConfiguration;

    constructor(gasConfiguration?: IGasConfiguration) {
        this.gasConfiguration = gasConfiguration || DefaultGasConfiguration;
    }

    forEGLDTransfer(dataLength: number) {
        let gasLimit =
            this.gasConfiguration.minGasLimit +
            this.gasConfiguration.gasPerDataByte * dataLength;

        return gasLimit;
    }

    forESDTTransfer(dataLength: number) {
        let gasLimit =
            this.gasConfiguration.minGasLimit +
            this.gasConfiguration.gasCostESDTTransfer +
            this.gasConfiguration.gasPerDataByte * dataLength +
            ADDITIONAL_GAS_FOR_ESDT_TRANSFER;

        return gasLimit;
    }

    forESDTNFTTransfer(dataLength: number) {
        let gasLimit =
            this.gasConfiguration.minGasLimit +
            this.gasConfiguration.gasCostESDTNFTTransfer +
            this.gasConfiguration.gasPerDataByte * dataLength +
            ADDITIONAL_GAS_FOR_ESDT_NFT_TRANSFER;

        return gasLimit;
    }
}
