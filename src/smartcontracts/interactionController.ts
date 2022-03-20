import { IProvider } from "../interface";
import { Interaction } from "./interaction";
import { Transaction } from "../transaction";
import { TransactionOnNetwork } from "../transactionOnNetwork";
import { ContractOutcomeBundle, IInteractionChecker, IResultsParser } from "./interface";
import { ContractFunction } from "./function";
import { ResultsParser } from "./resultsParser";
import { InteractionChecker, NullInteractionChecker } from "./interactionChecker";
import { EndpointDefinition } from "./typesystem";

/**
 * Internal interface: the smart contract ABI, as seen from the perspective of an {@link InteractionController}.
 */
interface ISmartContractAbi {
    getEndpoint(func: ContractFunction): EndpointDefinition;
}

/**
 * An interaction controller, suitable for frontends and dApp, 
 * where signing is performed by means of an external wallet provider.
 */
export class InteractionController {
    private readonly abi: ISmartContractAbi;
    private readonly checker: IInteractionChecker;
    private readonly parser: IResultsParser;
    private readonly provider: IProvider;

    constructor(
        abi: ISmartContractAbi,
        checker: IInteractionChecker,
        parser: IResultsParser,
        provider: IProvider,
    ) {
        this.abi = abi;
        this.checker = checker;
        this.parser = parser;
        this.provider = provider;
    }

    /**
     * Broadcasts an alredy-signed interaction transaction, and also waits for its execution on the Network.
     * 
     * @param interaction The interaction used to build the {@link signedInteractionTransaction}
     * @param signedInteractionTransaction The interaction transaction, which must be signed beforehand
     */
    async execute(interaction: Interaction, signedInteractionTransaction: Transaction): Promise<{ transaction: TransactionOnNetwork, bundle: ContractOutcomeBundle }> {
        let endpoint = this.getEndpoint(interaction);

        this.checker.checkInteraction(interaction, endpoint);

        await signedInteractionTransaction.send(this.provider);
        await signedInteractionTransaction.awaitExecuted(this.provider);
        let transactionOnNetwork = await signedInteractionTransaction.getAsOnNetwork(this.provider);
        let outcomeBundle = this.parser.parseOutcome(transactionOnNetwork, endpoint);
        return { transaction: transactionOnNetwork, bundle: outcomeBundle };
    }

    async query(interaction: Interaction): Promise<ContractOutcomeBundle> {
        let endpoint = this.getEndpoint(interaction);

        this.checker.checkInteraction(interaction, endpoint);

        let query = interaction.buildQuery();
        let queryResponse = await this.provider.queryContract(query);
        let outcomeBundle = this.parser.parseQueryResponse(queryResponse, endpoint);
        return outcomeBundle;
    }

    private getEndpoint(interaction: Interaction) {
        let func = interaction.getFunction();
        return this.abi.getEndpoint(func);
    }
}

export class DefaultInteractionController extends InteractionController {
    constructor(abi: ISmartContractAbi, provider: IProvider) {
        super(abi, new InteractionChecker(), new ResultsParser(), provider);
    }
}

export class NoCheckInteractionController extends InteractionController {
    constructor(abi: ISmartContractAbi, provider: IProvider) {
        super(abi, new NullInteractionChecker(), new ResultsParser(), provider);
    }
}
