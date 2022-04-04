import { IProvider } from "../interface";
import { Interaction } from "./interaction";
import { Transaction } from "../transaction";
import { TransactionOnNetwork } from "../transactionOnNetwork";
import { TypedOutcomeBundle, IInteractionChecker, IResultsParser, ISmartContractController, UntypedOutcomeBundle } from "./interface";
import { ContractFunction } from "./function";
import { ResultsParser } from "./resultsParser";
import { InteractionChecker, NullInteractionChecker } from "./interactionChecker";
import { EndpointDefinition } from "./typesystem";
import { Logger } from "../logger";
import { TransactionWatcher } from "../transactionWatcher";

/**
 * Internal interface: the smart contract ABI, as seen from the perspective of a {@link SmartContractController}.
 */
interface ISmartContractAbi {
    getEndpoint(func: ContractFunction): EndpointDefinition;
}

/**
 * Internal interface: a transaction completion awaiter, as seen from the perspective of a {@link SmartContractController}.
 */
interface ITransactionCompletionAwaiter {
    awaitCompleted(transaction: Transaction): Promise<void>;
}

/**
 * A (frontend) controller, suitable for frontends and dApp, 
 * where signing is performed by means of an external wallet provider.
 */
export class SmartContractController implements ISmartContractController {
    private readonly abi: ISmartContractAbi;
    private readonly checker: IInteractionChecker;
    private readonly parser: IResultsParser;
    private readonly provider: IProvider;
    private readonly transactionCompletionAwaiter: ITransactionCompletionAwaiter;

    constructor(
        abi: ISmartContractAbi,
        checker: IInteractionChecker,
        parser: IResultsParser,
        provider: IProvider,
        transactionWatcher: ITransactionCompletionAwaiter
    ) {
        this.abi = abi;
        this.checker = checker;
        this.parser = parser;
        this.provider = provider;
        this.transactionCompletionAwaiter = transactionWatcher;
    }

    async deploy(transaction: Transaction): Promise<{ transactionOnNetwork: TransactionOnNetwork, bundle: UntypedOutcomeBundle }> {
        Logger.info(`SmartContractController.deploy [begin]: transaction = ${transaction.getHash()}`);

        await transaction.send(this.provider);
        await this.transactionCompletionAwaiter.awaitCompleted(transaction);
        let transactionOnNetwork = await transaction.getAsOnNetwork(this.provider);
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
    async execute(interaction: Interaction, transaction: Transaction): Promise<{ transactionOnNetwork: TransactionOnNetwork, bundle: TypedOutcomeBundle }> {
        Logger.info(`SmartContractController.execute [begin]: function = ${interaction.getFunction()}, transaction = ${transaction.getHash()}`);

        let endpoint = this.getEndpoint(interaction);

        this.checker.checkInteraction(interaction, endpoint);

        await transaction.send(this.provider);
        await this.transactionCompletionAwaiter.awaitCompleted(transaction);
        let transactionOnNetwork = await transaction.getAsOnNetwork(this.provider);
        let bundle = this.parser.parseOutcome(transactionOnNetwork, endpoint);

        Logger.info(`SmartContractController.execute [end]: function = ${interaction.getFunction()}, transaction = ${transaction.getHash()}, return code = ${bundle.returnCode}`);
        return { transactionOnNetwork, bundle };
    }

    async query(interaction: Interaction): Promise<TypedOutcomeBundle> {
        Logger.debug(`SmartContractController.query [begin]: function = ${interaction.getFunction()}`);

        let endpoint = this.getEndpoint(interaction);

        this.checker.checkInteraction(interaction, endpoint);

        let query = interaction.buildQuery();
        let queryResponse = await this.provider.queryContract(query);
        let bundle = this.parser.parseQueryResponse(queryResponse, endpoint);

        Logger.debug(`SmartContractController.query [end]: function = ${interaction.getFunction()}, return code = ${bundle.returnCode}`);
        return bundle;
    }

    private getEndpoint(interaction: Interaction) {
        let func = interaction.getFunction();
        return this.abi.getEndpoint(func);
    }
}

export class DefaultSmartContractController extends SmartContractController {
    constructor(abi: ISmartContractAbi, provider: IProvider) {
        super(abi, new InteractionChecker(), new ResultsParser(), provider, new TransactionWatcher(provider));
    }
}

export class NoCheckSmartContractController extends SmartContractController {
    constructor(abi: ISmartContractAbi, provider: IProvider) {
        super(abi, new NullInteractionChecker(), new ResultsParser(), provider, new TransactionWatcher(provider));
    }
}
