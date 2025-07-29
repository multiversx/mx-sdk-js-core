import { ArgSerializer, BigUIntValue, StringValue } from "../abi";
import { Address, IGasLimitEstimator, Transaction, TransactionsFactoryConfig } from "../core";
import { BaseFactory } from "../core/baseFactory";
import { GOVERNANCE_CONTRACT_ADDRESS_HEX } from "../core/constants";
import {
    ChangeConfigInput,
    ClearEndedProposalsInput,
    CloseProposalInput,
    NewProposalInput,
    VoteProposalInput,
} from "./resources";

interface IConfig {
    chainID: string;
    addressHrp: string;
    minGasLimit: bigint;
    gasLimitPerByte: bigint;
    gasLimitForProposal: bigint;
    gasLimitForVote: bigint;
    gasLimitForClosingProposal: bigint;
    gasLimitForClearProposals: bigint;
    gasLimitForChangeConfig: bigint;
    gasLimitForClaimAccumulatedFees: bigint;
}

const EXTRA_GAS_LIMIT_FOR_VOTING = 100_000n;

export class GovernanceTransactionsFactory extends BaseFactory {
    private readonly config: IConfig;
    private readonly argSerializer: ArgSerializer;
    private readonly governanceContract: Address;

    constructor(options: { config: TransactionsFactoryConfig; gasLimitEstimator?: IGasLimitEstimator }) {
        super({ config: options.config, gasLimitEstimator: options.gasLimitEstimator });
        this.config = options.config;
        this.argSerializer = new ArgSerializer();
        this.governanceContract = Address.newFromHex(GOVERNANCE_CONTRACT_ADDRESS_HEX, this.config.addressHrp);
    }

    async createTransactionForNewProposal(sender: Address, options: NewProposalInput): Promise<Transaction> {
        const args = [
            new StringValue(options.commitHash),
            new BigUIntValue(options.startVoteEpoch),
            new BigUIntValue(options.endVoteEpoch),
        ];
        const dataParts = ["proposal", ...this.argSerializer.valuesToStrings(args)];

        const transaction = new Transaction({
            sender,
            receiver: this.governanceContract,
            value: options.nativeTokenAmount,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, undefined, this.config.gasLimitForProposal);

        return transaction;
    }

    async createTransactionForVoting(sender: Address, options: VoteProposalInput): Promise<Transaction> {
        const args = [new BigUIntValue(options.proposalNonce), new StringValue(options.vote.valueOf())];
        const dataParts = ["vote", ...this.argSerializer.valuesToStrings(args)];

        const transaction = new Transaction({
            sender,
            receiver: this.governanceContract,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, undefined, this.config.gasLimitForVote + EXTRA_GAS_LIMIT_FOR_VOTING);

        return transaction;
    }

    async createTransactionForClosingProposal(sender: Address, options: CloseProposalInput): Promise<Transaction> {
        const args = [new BigUIntValue(options.proposalNonce)];
        const dataParts = ["closeProposal", ...this.argSerializer.valuesToStrings(args)];

        const transaction = new Transaction({
            sender,
            receiver: this.governanceContract,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, undefined, this.config.gasLimitForClosingProposal);

        return transaction;
    }

    async createTransactionForClearingEndedProposals(
        sender: Address,
        options: ClearEndedProposalsInput,
    ): Promise<Transaction> {
        const dataParts = ["clearEndedProposals", ...options.proposers.map((address) => address.toHex())];

        const transaction = new Transaction({
            sender,
            receiver: this.governanceContract,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);

        const gasLimit =
            this.config.gasLimitForClearProposals +
            BigInt(options.proposers.length) * this.config.gasLimitForClearProposals;
        await this.setGasLimit(transaction, undefined, gasLimit);

        return transaction;
    }

    async createTransactionForClaimingAccumulatedFees(sender: Address): Promise<Transaction> {
        const dataParts = ["claimAccumulatedFees"];

        const transaction = new Transaction({
            sender,
            receiver: this.governanceContract,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, undefined, this.config.gasLimitForClaimAccumulatedFees);

        return transaction;
    }

    async createTransactionForChangingConfig(sender: Address, options: ChangeConfigInput): Promise<Transaction> {
        const args = [
            new StringValue(options.proposalFee.toString()),
            new StringValue(options.lastProposalFee.toString()),
            new StringValue(options.minQuorum.toString()),
            new StringValue(options.minVetoThreshold.toString()),
            new StringValue(options.minPassThreshold.toString()),
        ];
        const dataParts = ["changeConfig", ...this.argSerializer.valuesToStrings(args)];

        const transaction = new Transaction({
            sender,
            receiver: this.governanceContract,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, undefined, this.config.gasLimitForChangeConfig);

        return transaction;
    }
}
