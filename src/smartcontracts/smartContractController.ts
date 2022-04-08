import { Interaction } from "./interaction";
import { Transaction } from "../transaction";
import { TypedOutcomeBundle, IResultsParser, ISmartContractController, UntypedOutcomeBundle } from "./interface";
import { ResultsParser } from "./resultsParser";
import { Logger } from "../logger";
import { TransactionWatcher } from "../transactionWatcher";
import { IContractQueryResponse, ITransactionOnNetwork } from "../interfaceOfNetwork";
import { IHash } from "../interface";
import { Query } from "./query";

/**
 * @deprecated (controller will be extracted, as well, or removed)
 */
interface IDeprecatedProvider {
    sendTransaction(transaction: Transaction): Promise<IHash>;
    getTransaction(hash: IHash): Promise<ITransactionOnNetwork>;
    queryContract(query: Query): Promise<IContractQueryResponse>;
}

/**
 * Internal interface: a transaction completion awaiter, as seen from the perspective of a {@link SmartContractController}.
 */
interface ITransactionCompletionAwaiter {
    awaitCompleted(transaction: Transaction): Promise<ITransactionOnNetwork>;
}

/**
 * A (frontend) controller, suitable for frontends and dApp, 
 * where signing is performed by means of an external wallet provider.
 */
export class SmartContractController implements ISmartContractController {
    private readonly parser: IResultsParser;
    private readonly provider: IDeprecatedProvider;
    private readonly transactionCompletionAwaiter: ITransactionCompletionAwaiter;

    constructor(
        parser: IResultsParser,
        provider: IDeprecatedProvider,
        transactionWatcher: ITransactionCompletionAwaiter
    ) {
        this.parser = parser;
        this.provider = provider;
        this.transactionCompletionAwaiter = transactionWatcher;
    }

    async deploy(transaction: Transaction): Promise<{ transactionOnNetwork: ITransactionOnNetwork, bundle: UntypedOutcomeBundle }> {
        Logger.info(`SmartContractController.deploy [begin]: transaction = ${transaction.getHash()}`);

        await this.provider.sendTransaction(transaction);
        let transactionOnNetwork = await this.transactionCompletionAwaiter.awaitCompleted(transaction);
        let bundle = this.parser.parseUntypedOutcome(transactionOnNetwork);

        Logger.info(`SmartContractController.deploy [end]: transaction = ${transaction.getHash()}, return code = ${bundle.returnCode}`);
        return { transactionOnNetwork, bundle };
    }

    /**
     * Broadcasts an alredy-signed interaction transaction, and also waits for its execution on the Network.
     * 
     * @param interaction The interaction used to build the {@link transaction}
     * @param transaction The interaction transaction, which must be signed beforehand
     */
    async execute(interaction: Interaction, transaction: Transaction): Promise<{ transactionOnNetwork: ITransactionOnNetwork, bundle: TypedOutcomeBundle }> {
        Logger.info(`SmartContractController.execute [begin]: function = ${interaction.getFunction()}, transaction = ${transaction.getHash()}`);

        let endpoint = interaction.getEndpoint();

        interaction.check();

        await this.provider.sendTransaction(transaction);
        let transactionOnNetwork = await this.transactionCompletionAwaiter.awaitCompleted(transaction);
        let bundle = this.parser.parseOutcome(transactionOnNetwork, endpoint);

        Logger.info(`SmartContractController.execute [end]: function = ${interaction.getFunction()}, transaction = ${transaction.getHash()}, return code = ${bundle.returnCode}`);
        return { transactionOnNetwork, bundle };
    }

    async query(interaction: Interaction): Promise<TypedOutcomeBundle> {
        Logger.debug(`SmartContractController.query [begin]: function = ${interaction.getFunction()}`);

        let endpoint = interaction.getEndpoint();

        interaction.check();

        let query = interaction.buildQuery();
        let queryResponse = await this.provider.queryContract(query);
        let bundle = this.parser.parseQueryResponse(queryResponse, endpoint);

        Logger.debug(`SmartContractController.query [end]: function = ${interaction.getFunction()}, return code = ${bundle.returnCode}`);
        return bundle;
    }
}

export class DefaultSmartContractController extends SmartContractController {
    constructor(provider: IDeprecatedProvider) {
        super(new ResultsParser(), provider, new TransactionWatcher(provider));
    }
}
