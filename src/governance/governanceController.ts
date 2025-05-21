import {
    Address,
    BaseController,
    BaseControllerInput,
    IAccount,
    Transaction,
    TransactionsFactoryConfig,
    TransactionWatcher,
} from "../core";
import { INetworkProvider } from "../networkProviders";
import { SmartContractController } from "../smartContracts";
import { GovernanceTransactionsFactory } from "./governanceTransactionsFactory";
import { NewProposalInput } from "./resources";

export class GovernanceController extends BaseController {
    private transactionAwaiter: TransactionWatcher;
    private governanceFactory: GovernanceTransactionsFactory;
    // private multisigParser: MultisigTransactionsOutcomeParser;
    private smartContractController: SmartContractController;

    constructor(options: { chainID: string; networkProvider: INetworkProvider }) {
        super();
        this.transactionAwaiter = new TransactionWatcher(options.networkProvider);
        this.governanceFactory = new GovernanceTransactionsFactory({
            config: new TransactionsFactoryConfig({ chainID: options.chainID }),
        });

        // this.parser = new MultisigTransactionsOutcomeParser({ abi: options.abi });
        this.smartContractController = new SmartContractController({
            chainID: options.chainID,
            networkProvider: options.networkProvider,
        });
    }

    async createTransactionForNewProposal(
        sender: IAccount,
        nonce: bigint,
        options: NewProposalInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.governanceFactory.createTransactionForNewProposal(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        this.setVersionAndOptionsForGuardian(transaction);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }
}
