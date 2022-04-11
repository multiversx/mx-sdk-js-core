import { Interaction } from "../smartcontracts/interaction";
import { Transaction } from "../transaction";
import { TypedOutcomeBundle, UntypedOutcomeBundle } from "../smartcontracts/interface";
import { ResultsParser } from "../smartcontracts/resultsParser";
import { Logger } from "../logger";
import { TransactionWatcher } from "../transactionWatcher";
import { ITransactionOnNetwork } from "../interfaceOfNetwork";
import { INetworkProvider } from "./networkProviders";

export class ContractController {
    private readonly parser: ResultsParser;
    private readonly provider: INetworkProvider;
    private readonly transactionCompletionAwaiter: TransactionWatcher;

    constructor(provider: INetworkProvider) {
        this.parser = new ResultsParser();
        this.provider = provider;
        this.transactionCompletionAwaiter = new TransactionWatcher(provider);
    }

    async deploy(transaction: Transaction): Promise<{ transactionOnNetwork: ITransactionOnNetwork, bundle: UntypedOutcomeBundle }> {
        Logger.info(`ContractController.deploy [begin]: transaction = ${transaction.getHash()}`);

        await this.provider.sendTransaction(transaction);
        let transactionOnNetwork = await this.transactionCompletionAwaiter.awaitCompleted(transaction);
        let bundle = this.parser.parseUntypedOutcome(transactionOnNetwork);

        Logger.info(`ContractController.deploy [end]: transaction = ${transaction.getHash()}, return code = ${bundle.returnCode}`);
        return { transactionOnNetwork, bundle };
    }

    async execute(interaction: Interaction, transaction: Transaction): Promise<{ transactionOnNetwork: ITransactionOnNetwork, bundle: TypedOutcomeBundle }> {
        Logger.info(`ContractController.execute [begin]: function = ${interaction.getFunction()}, transaction = ${transaction.getHash()}`);

        interaction.check();

        await this.provider.sendTransaction(transaction);
        let transactionOnNetwork = await this.transactionCompletionAwaiter.awaitCompleted(transaction);
        let bundle = this.parser.parseOutcome(transactionOnNetwork, interaction.getEndpoint());

        Logger.info(`ContractController.execute [end]: function = ${interaction.getFunction()}, transaction = ${transaction.getHash()}, return code = ${bundle.returnCode}`);
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
