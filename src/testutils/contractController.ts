import { ITransactionOnNetwork } from "../interfaceOfNetwork";
import { Logger } from "../logger";
import { Interaction } from "../smartcontracts/interaction";
import { TypedOutcomeBundle, UntypedOutcomeBundle } from "../smartcontracts/interface";
import { ResultsParser } from "../smartcontracts/resultsParser";
import { Transaction } from "../transaction";
import { TransactionWatcher } from "../transactionWatcher";
import { INetworkProvider } from "./networkProviders";

export class ContractController {
    private readonly parser: ResultsParser;
    private readonly provider: INetworkProvider;
    private readonly transactionCompletionAwaiter: TransactionWatcher;

    constructor(provider: INetworkProvider) {
        this.parser = new ResultsParser();
        this.provider = provider;
        this.transactionCompletionAwaiter = new TransactionWatcher({
            getTransaction: async (hash: string) => { return await provider.getTransaction(hash, true) }
        });
    }

    async deploy(transaction: Transaction): Promise<{ transactionOnNetwork: ITransactionOnNetwork, bundle: UntypedOutcomeBundle }> {
        const txHash = await this.provider.sendTransaction(transaction);
        Logger.info(`ContractController.deploy [begin]: transaction = ${txHash}`);
    
        let transactionOnNetwork = await this.transactionCompletionAwaiter.awaitCompleted(txHash);
        let bundle = this.parser.parseUntypedOutcome(transactionOnNetwork);

        Logger.info(`ContractController.deploy [end]: transaction = ${txHash}, return code = ${bundle.returnCode}`);
        return { transactionOnNetwork, bundle };
    }

    async execute(interaction: Interaction, transaction: Transaction): Promise<{ transactionOnNetwork: ITransactionOnNetwork, bundle: TypedOutcomeBundle }> {
        const txHash = await this.provider.sendTransaction(transaction);
        Logger.info(`ContractController.execute [begin]: function = ${interaction.getFunction()}, transaction = ${txHash}`);

        interaction.check();

        let transactionOnNetwork = await this.transactionCompletionAwaiter.awaitCompleted(txHash);
        let bundle = this.parser.parseOutcome(transactionOnNetwork, interaction.getEndpoint());

        Logger.info(`ContractController.execute [end]: function = ${interaction.getFunction()}, transaction = ${txHash}, return code = ${bundle.returnCode}`);
        return { transactionOnNetwork, bundle };
    }

    async query(interaction: Interaction): Promise<TypedOutcomeBundle> {
        Logger.debug(`ContractController.query [begin]: function = ${interaction.getFunction()}`);

        interaction.check();

        let queryResponse = await this.provider.queryContract(interaction.buildQuery());
        let bundle = this.parser.parseQueryResponse(queryResponse, interaction.getEndpoint());

        Logger.debug(`ContractController.query [end]: function = ${interaction.getFunction()}, return code = ${bundle.returnCode}`);
        return bundle;
    }
}
