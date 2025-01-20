/**
 * An object holding network status configuration parameters.
 */
export class NetworkStatus {
    raw: Record<string, any> = {};

    /**
     * The block nonce.
     */
    public BlockTimestamp: number;

    /**
     * The block nonce.
     */
    public BlockNonce: bigint;

    /**
     * The Highest final nonce.
     */
    public HighestFinalNonce: bigint;

    /**
     * The current round.
     */
    public CurrentRound: bigint;

    /**
     * The epoch number.
     */
    public CurrentEpoch: number;

    constructor() {
        this.CurrentRound = 0n;
        this.CurrentEpoch = 0;
        this.HighestFinalNonce = 0n;
        this.BlockNonce = 0n;
        this.BlockTimestamp = 0;
    }

    /**
     * Constructs a configuration object from a HTTP response (as returned by the provider).
     */
    static fromHttpResponse(payload: any): NetworkStatus {
        let networkStatus = new NetworkStatus();

        networkStatus.raw = payload;
        networkStatus.CurrentRound = BigInt(payload["erd_current_round"]);
        networkStatus.CurrentEpoch = Number(payload["erd_epoch_number"]);
        networkStatus.HighestFinalNonce = BigInt(payload["erd_highest_final_nonce"]);
        networkStatus.BlockNonce = BigInt(payload["erd_nonce"]);
        networkStatus.BlockTimestamp = Number(payload["erd_block_timestamp"]);

        return networkStatus;
    }
}
