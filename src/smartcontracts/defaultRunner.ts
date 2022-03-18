import { IProvider, ISigner } from "../interface";
import { ExecutionResultsBundle, QueryResponseBundle } from "./interface";
import { Interaction } from "./interaction";
import { Transaction } from "../transaction";

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
     * @param sourceInteraction The interaction used to build the {@link signedInteractionTransaction}
     */
     async run(signedInteractionTransaction: Transaction, sourceInteraction: Interaction): Promise<ExecutionResultsBundle> {
        await signedInteractionTransaction.send(this.provider);
        await signedInteractionTransaction.awaitExecuted(this.provider);
        
        let transactionOnNetwork = await signedInteractionTransaction.getAsOnNetwork(this.provider);
        // TODO: do not rely on interpretExecutionResults, as it may throw unexpectedly.
        let bundle = sourceInteraction.interpretExecutionResults(transactionOnNetwork);
        return bundle;
    }

    async runQuery(interaction: Interaction): Promise<QueryResponseBundle> {
        let query = interaction.buildQuery();
        let response = await this.provider.queryContract(query);
        // TODO: do not rely on interpretQueryResponse, as it may throw unexpectedly.
        let bundle = interaction.interpretQueryResponse(response);
        return bundle;
    }
}
