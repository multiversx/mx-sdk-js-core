import BigNumber from "bignumber.js";
import { IChainID, IGasLimit, IGasPrice, ITransactionVersion } from "./interface";

/**
 * An object holding Network configuration parameters.
 */
export class NetworkConfig {
    /**
     * The chain ID. E.g. "1" for the Mainnet.
     */
    public ChainID: IChainID;

    /**
     * The gas required by the Network to process a byte of the {@link TransactionPayload}.
     */
    public GasPerDataByte: number;
    /**
     * The round duration.
     */
    public RoundDuration: number;
    /**
     * The number of rounds per epoch.
     */
    public RoundsPerEpoch: number;

    /**
     * The Top Up Factor for APR calculation
     */
    public TopUpFactor: number;

    /**
     * The Top Up Factor for APR calculation
     */
    public TopUpRewardsGradientPoint: BigNumber;

    /**
     *
     */
    public GasPriceModifier: number;

    /**
     * The minimum gas limit required to be set when broadcasting a {@link Transaction}.
     */
    public MinGasLimit: IGasLimit;

    /**
     * The minimum gas price required to be set when broadcasting a {@link Transaction}.
     */
    public MinGasPrice: IGasPrice;

    /**
     * The oldest transaction version accepted by the Network.
     */
    public MinTransactionVersion: ITransactionVersion;

    constructor() {
        this.ChainID = "T";
        this.GasPerDataByte = 1500;
        this.TopUpFactor = 0;
        this.RoundDuration = 0;
        this.RoundsPerEpoch = 0;
        this.TopUpRewardsGradientPoint = new BigNumber(0);
        this.MinGasLimit = 50000;
        this.MinGasPrice = 1000000000;
        this.GasPriceModifier = 1;
        this.MinTransactionVersion = 1;
    }

    /**
     * Constructs a configuration object from a HTTP response (as returned by the provider).
     */
    static fromHttpResponse(payload: any): NetworkConfig {
        let networkConfig = new NetworkConfig();

        networkConfig.ChainID = String(payload["erd_chain_id"]);
        networkConfig.GasPerDataByte = Number(payload["erd_gas_per_data_byte"]);
        networkConfig.TopUpFactor = Number(payload["erd_top_up_factor"]);
        networkConfig.RoundDuration = Number(payload["erd_round_duration"]);
        networkConfig.RoundsPerEpoch = Number(payload["erd_rounds_per_epoch"]);
        networkConfig.TopUpRewardsGradientPoint = new BigNumber(payload["erd_rewards_top_up_gradient_point"]);
        networkConfig.MinGasLimit = Number(payload["erd_min_gas_limit"]);
        networkConfig.MinGasPrice = Number(payload["erd_min_gas_price"]);
        networkConfig.MinTransactionVersion = Number(payload["erd_min_transaction_version"]);
        networkConfig.GasPriceModifier = Number(payload["erd_gas_price_modifier"]);

        return networkConfig;
    }
}
