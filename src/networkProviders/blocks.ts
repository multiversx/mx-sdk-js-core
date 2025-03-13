/**
 * An object holding network status configuration parameters.
 */

export class BlockOnNetwork {
    /**
     * The raw data return by provider.
     */
    public raw: Record<string, any> = {};

    /**
     * The shard number.
     */
    public shard: number = 0;

    /**
     * The shard nonce.
     */
    public nonce: bigint = 0n;

    /**
     * The block hash.
     */
    public hash: string = "";

    /**
     * The block previous hash.
     */
    public previousHash: string = "";

    /**
     * The block timestamp.
     */
    public timestamp: number = 0;

    /**
     * The block timestamp.
     */
    public round: number = 0;

    /**
     * The block timestamp.
     */
    public epoch: number = 0;

    /**
     * Constructs a configuration object from a HTTP response (as returned by the provider).
     */
    static fromHttpResponse(payload: any): BlockOnNetwork {
        let blockOnNetwork = new BlockOnNetwork();

        blockOnNetwork.raw = payload;
        blockOnNetwork.shard = Number(payload["shard"]) ?? 0;
        blockOnNetwork.nonce = BigInt(payload["nonce"] ?? 0);
        blockOnNetwork.hash = payload["hash"] ?? "";
        blockOnNetwork.previousHash = payload["prevBlockHash"] ?? payload["prevHash"] ?? "";
        blockOnNetwork.timestamp = Number(payload["timestamp"] ?? 0);
        blockOnNetwork.round = Number(payload["round"] ?? 0);
        blockOnNetwork.epoch = Number(payload["epoch"] ?? 0);

        return blockOnNetwork;
    }
}

export class BlockCoordinates {
    nonce: bigint = 0n;
    hash: string = "";
    rootHash: string = "";
    constructor(init?: Partial<BlockCoordinates>) {
        Object.assign(this, init);
    }
    static fromHttpResponse(payload: any): BlockCoordinates {
        const result = new BlockCoordinates();
        const value = payload["blockInfo"] || {};

        result.nonce = value["nonce"] || 0n;
        result.hash = value["hash"] || "";
        result.rootHash = value["rootHash"] || "";

        return result;
    }
}
