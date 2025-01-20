/**
 * An object holding Network configuration parameters.
 */
export class NetworkConfig {
    raw: Record<string, any> = {};
    /**
     * The chain ID. E.g. "1" for the Mainnet.
     */
    public ChainID: string;

    /**
     * The gas required by the Network to process a byte of the transaction data.
     */
    public GasPerDataByte: bigint;

    public GasPriceModifier: number;

    /**
     * The minimum gas limit required to be set when broadcasting a transaction.
     */
    public MinGasLimit: bigint;

    /**
     * The minimum gas price required to be set when broadcasting a transaction.
     */
    public MinGasPrice: bigint;

    /**
     * The extra gas needed for guarded transactions.
     */
    public ExtraGasLimitForGuardedTransactions: bigint;

    /**
     * The number of rounds per epoch.
     */
    public NumberOfShards: number;

    /**
     * The round duration.
     */
    public RoundDuration: number;
    /**
     * The number of rounds per epoch.
     */
    public RoundsPerEpoch: number;

    /**
     * The genesis timestamp
     */
    public GenesisTimestamp: number;

    constructor() {
        this.ChainID = "T";
        this.GasPerDataByte = 1500n;
        this.GenesisTimestamp = 0;
        this.RoundDuration = 0;
        this.RoundsPerEpoch = 0;
        this.MinGasLimit = 50000n;
        this.MinGasPrice = 1000000000n;
        this.ExtraGasLimitForGuardedTransactions = 0n;
        this.GasPriceModifier = 1;
        this.NumberOfShards = 0;
    }

    /**
     * Constructs a configuration object from a HTTP response (as returned by the provider).
     */
    static fromHttpResponse(payload: any): NetworkConfig {
        let networkConfig = new NetworkConfig();

        networkConfig.raw = payload;
        networkConfig.ChainID = String(payload["erd_chain_id"]);
        networkConfig.GasPerDataByte = BigInt(payload["erd_gas_per_data_byte"]);
        networkConfig.GasPriceModifier = Number(payload["erd_top_up_factor"]);
        networkConfig.MinGasLimit = BigInt(payload["erd_min_gas_limit"]);
        networkConfig.MinGasPrice = BigInt(payload["erd_min_gas_price"]);
        networkConfig.ExtraGasLimitForGuardedTransactions = BigInt(payload["erd_extra_gas_limit_guarded_tx"]);
        networkConfig.NumberOfShards = Number(payload["erd_num_shards_without_meta"]);
        networkConfig.RoundDuration = Number(payload["erd_round_duration"]);
        networkConfig.RoundsPerEpoch = Number(payload["erd_rounds_per_epoch"]);
        networkConfig.GenesisTimestamp = Number(payload["erd_start_time"]);

        return networkConfig;
    }
}
