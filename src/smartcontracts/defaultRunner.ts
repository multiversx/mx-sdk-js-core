import { IProvider } from "../interface";
import { QueryResponseBundle } from "./interface";
import { Interaction } from "./interaction";
import { Transaction } from "../transaction";
import { TransactionOnNetwork } from "../transactionOnNetwork";

/**
 * An interaction runner, suitable for frontends and dApp, 
 * where signing is performed by means of an external wallet provider.
 */
export class DefaultInteractionRunner {
    private readonly provider: IProvider;

    constructor(provider: IProvider) {
        this.provider = provider;
    }

    /**
     * Broadcasts an alredy-signed interaction transaction, and also waits for its execution on the Network.
     * 
     * @param signedInteractionTransaction The interaction transaction, which must be signed beforehand
     */
     async run(signedInteractionTransaction: Transaction): Promise<TransactionOnNetwork> {
        await signedInteractionTransaction.send(this.provider);
        await signedInteractionTransaction.awaitExecuted(this.provider);
        return await signedInteractionTransaction.getAsOnNetwork(this.provider);
    }

    async runQuery(interaction: Interaction): Promise<QueryResponseBundle> {
        let query = interaction.buildQuery();
        let response = await this.provider.queryContract(query);
        // TODO: do not rely on interpretQueryResponse, as it may throw unexpectedly.
        let bundle = interaction.interpretQueryResponse(response);
        return bundle;
    }
}
