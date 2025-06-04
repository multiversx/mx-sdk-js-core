import { AddressType, AddressValue, ArgSerializer, BigUIntType, BigUIntValue, StringType } from "../abi";
import {
    Address,
    BaseController,
    BaseControllerInput,
    IAccount,
    LibraryConfig,
    Transaction,
    TransactionOnNetwork,
    TransactionsFactoryConfig,
    TransactionWatcher,
} from "../core";
import { GOVERNANCE_CONTRACT_ADDRESS_HEX } from "../core/constants";
import { INetworkProvider } from "../networkProviders";
import { SmartContractController } from "../smartContracts";
import { GovernanceTransactionsFactory } from "./governanceTransactionsFactory";
import { GovernanceTransactionsOutcomeParser } from "./governanceTransactionsOutcomeParser";
import {
    ChangeConfigInput,
    ClearEndedProposalsInput,
    CloseProposalInput,
    CloseProposalOutcome,
    DelegatedVoteInfo,
    GovernanceConfig,
    NewProposalInput,
    NewProposalOutcome,
    ProposalInfo,
    VoteOutcome,
    VoteProposalInput,
} from "./resources";

export class GovernanceController extends BaseController {
    private readonly governanceFactory: GovernanceTransactionsFactory;
    private readonly parser: GovernanceTransactionsOutcomeParser;
    private readonly smartContractController: SmartContractController;
    private readonly governanceContract: Address;
    private readonly transactionAwaiter: TransactionWatcher;
    private readonly addressHrp: string;
    private readonly serializer: ArgSerializer;

    constructor(options: { chainID: string; networkProvider: INetworkProvider; addressHrp?: string }) {
        super();
        this.governanceFactory = new GovernanceTransactionsFactory({
            config: new TransactionsFactoryConfig({ chainID: options.chainID }),
        });
        this.smartContractController = new SmartContractController({
            chainID: options.chainID,
            networkProvider: options.networkProvider,
        });
        this.addressHrp = options.addressHrp ?? LibraryConfig.DefaultAddressHrp;
        this.parser = new GovernanceTransactionsOutcomeParser({ addressHrp: this.addressHrp });
        this.governanceContract = Address.newFromHex(GOVERNANCE_CONTRACT_ADDRESS_HEX, this.addressHrp);
        this.transactionAwaiter = new TransactionWatcher(options.networkProvider);
        this.serializer = new ArgSerializer();
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

    parseNewProposal(transaction: TransactionOnNetwork): NewProposalOutcome[] {
        return this.parser.parseNewProposal(transaction);
    }

    async awaitCompletedProposeProposal(txHash: string): Promise<NewProposalOutcome[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parseNewProposal(transaction);
    }

    async createTransactionForVoting(
        sender: IAccount,
        nonce: bigint,
        options: VoteProposalInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.governanceFactory.createTransactionForVoting(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        this.setVersionAndOptionsForGuardian(transaction);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    parseVote(transaction: TransactionOnNetwork): VoteOutcome[] {
        return this.parser.parseVote(transaction);
    }

    async awaitCompletedVote(txHash: string): Promise<VoteOutcome[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parseVote(transaction);
    }

    async createTransactionForClosingProposal(
        sender: IAccount,
        nonce: bigint,
        options: CloseProposalInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.governanceFactory.createTransactionForClosingProposal(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        this.setVersionAndOptionsForGuardian(transaction);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    parseCloseProposal(transaction: TransactionOnNetwork): CloseProposalOutcome[] {
        return this.parser.parseCloseProposal(transaction);
    }

    async awaitCompletedCloseProposal(txHash: string): Promise<CloseProposalOutcome[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parseCloseProposal(transaction);
    }

    async createTransactionForClearingEndedProposals(
        sender: IAccount,
        nonce: bigint,
        options: ClearEndedProposalsInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.governanceFactory.createTransactionForClearingEndedProposals(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        this.setVersionAndOptionsForGuardian(transaction);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    async createTransactionForClaimingAccumulatedFees(
        sender: IAccount,
        nonce: bigint,
        options: BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.governanceFactory.createTransactionForClaimingAccumulatedFees(sender.address);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        this.setVersionAndOptionsForGuardian(transaction);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    async createTransactionForChangingConfig(
        sender: IAccount,
        nonce: bigint,
        options: ChangeConfigInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.governanceFactory.createTransactionForChangingConfig(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        this.setVersionAndOptionsForGuardian(transaction);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    async getVotingPower(address: Address): Promise<bigint> {
        const result = await this.smartContractController.query({
            contract: this.governanceContract,
            function: "viewVotingPower",
            arguments: [new AddressValue(address)],
        });

        const votingPower = { type: new BigUIntType() };
        const data = this.serializer.buffersToValues(result, [votingPower]);
        return BigInt(data[0].valueOf().toFixed());
    }

    async getConfig(): Promise<GovernanceConfig> {
        const result = await this.smartContractController.query({
            contract: this.governanceContract,
            function: "viewConfig",
            arguments: [],
        });

        const proposalFee = BigInt(Buffer.from(result[0]).toString());
        const minQuorum = Number(Buffer.from(result[1]).toString());
        const minPassThreshold = Number(Buffer.from(result[2]).toString());
        const minVetoThreshold = Number(Buffer.from(result[3]).toString());
        const lastProposalNonce = Number(Buffer.from(result[4]).toString());

        return {
            proposalFee,
            minQuorum,
            minPassThreshold,
            minVetoThreshold,
            lastProposalNonce,
        };
    }

    async getProposal(proposalNonce: number): Promise<ProposalInfo> {
        const result = await this.smartContractController.query({
            contract: this.governanceContract,
            function: "viewProposal",
            arguments: [new BigUIntValue(proposalNonce)],
        });

        const proposalCost = { type: new BigUIntType() };
        const commitHash = { type: new StringType() };
        const nonce = { type: new BigUIntType() };
        const issuer = { type: new AddressType() };
        const startVoteEpoch = { type: new BigUIntType() };
        const endVoteEpoch = { type: new BigUIntType() };
        const quorumStake = { type: new BigUIntType() };
        const numVotesYes = { type: new BigUIntType() };
        const numVotesNo = { type: new BigUIntType() };
        const numVotesVeto = { type: new BigUIntType() };
        const numVotesAbstain = { type: new BigUIntType() };

        const data = this.serializer.buffersToValues(result.slice(0, 11), [
            proposalCost,
            commitHash,
            nonce,
            issuer,
            startVoteEpoch,
            endVoteEpoch,
            quorumStake,
            numVotesYes,
            numVotesNo,
            numVotesVeto,
            numVotesAbstain,
        ]);

        const isClosed = Buffer.from(result[11]).toString() === "true";
        const isPassed = Buffer.from(result[12]).toString() === "true";

        return {
            cost: BigInt(data[0].valueOf().toFixed()),
            commitHash: data[1].valueOf(),
            nonce: Number(data[2].valueOf().toString()),
            issuer: data[3].valueOf(),
            startVoteEpoch: Number(data[4].valueOf().toString()),
            endVoteEpoch: Number(data[5].valueOf().toString()),
            quorumStake: BigInt(data[6].valueOf().toFixed()),
            numYesVotes: BigInt(data[7].valueOf().toFixed()),
            numNoVotes: BigInt(data[8].valueOf().toFixed()),
            numVetoVotes: BigInt(data[9].valueOf().toFixed()),
            numAbstainVotes: BigInt(data[10].valueOf().toFixed()),
            isClosed: isClosed,
            isPassed: isPassed,
        };
    }

    async getDelegatedVoteInfo(): Promise<DelegatedVoteInfo> {
        const result = await this.smartContractController.query({
            contract: this.governanceContract,
            function: "viewDelegatedVoteInfo",
            arguments: [],
        });

        const usedStake = BigInt(Buffer.from(result[0]).toString());
        const usedPower = BigInt(Buffer.from(result[1]).toString());
        const totalStake = BigInt(Buffer.from(result[2]).toString());
        const totalPower = BigInt(Buffer.from(result[3]).toString());

        return {
            usedStake,
            usedPower,
            totalStake,
            totalPower,
        };
    }
}
