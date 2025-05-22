import { ArgSerializer, BigUIntValue, StringValue } from "../abi";
import { Address, Transaction, TransactionsFactoryConfig } from "../core";
import { GOVERNANCE_CONTRACT_ADDRESS_HEX } from "../core/constants";
import { TransactionBuilder } from "../core/transactionBuilder";
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

export class GovernanceTransactionsFactory {
    private readonly config: IConfig;
    private readonly argSerializer: ArgSerializer;
    private readonly governanceContract: Address;

    constructor(options: { config: TransactionsFactoryConfig }) {
        this.config = options.config;
        this.argSerializer = new ArgSerializer();
        this.governanceContract = Address.newFromHex(GOVERNANCE_CONTRACT_ADDRESS_HEX, this.config.addressHrp);
    }

    createTransactionForNewProposal(sender: Address, options: NewProposalInput): Transaction {
        const args = [
            new StringValue(options.commitHash),
            new BigUIntValue(options.startVoteEpoch),
            new BigUIntValue(options.endVoteEpoch),
        ];
        const dataParts = ["proposal", ...this.argSerializer.valuesToStrings(args)];

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: this.governanceContract,
            dataParts: dataParts,
            gasLimit: this.config.gasLimitForProposal,
            addDataMovementGas: true,
            amount: options.nativeTokenAmount,
        }).build();
    }

    createTransactionForVoting(sender: Address, options: VoteProposalInput): Transaction {
        const args = [new BigUIntValue(options.proposalNonce), new StringValue(options.vote.valueOf())];
        const dataParts = ["vote", ...this.argSerializer.valuesToStrings(args)];

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: this.governanceContract,
            dataParts: dataParts,
            gasLimit: this.config.gasLimitForVote + EXTRA_GAS_LIMIT_FOR_VOTING,
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForClosingProposal(sender: Address, options: CloseProposalInput): Transaction {
        const args = [new BigUIntValue(options.proposalNonce)];
        const dataParts = ["closeProposal", ...this.argSerializer.valuesToStrings(args)];

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: this.governanceContract,
            dataParts: dataParts,
            gasLimit: this.config.gasLimitForClosingProposal,
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForClearingEndedProposals(sender: Address, options: ClearEndedProposalsInput): Transaction {
        const dataParts = ["clearEndedProposals", ...options.proposers.map((address) => address.toHex())];

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: this.governanceContract,
            dataParts: dataParts,
            gasLimit:
                this.config.gasLimitForClearProposals +
                BigInt(options.proposers.length) * this.config.gasLimitForClearProposals,
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForClaimingAccumulatedFees(sender: Address): Transaction {
        const dataParts = ["claimAccumulatedFees"];

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: this.governanceContract,
            dataParts: dataParts,
            gasLimit: this.config.gasLimitForClaimAccumulatedFees,
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForChangingConfig(sender: Address, options: ChangeConfigInput): Transaction {
        const args = [
            new StringValue(options.proposalFee.toString()),
            new StringValue(options.lastProposalFee.toString()),
            new StringValue(options.minQuorum.toString()),
            new StringValue(options.minVetoThreshold.toString()),
            new StringValue(options.minPassThreshold.toString()),
        ];
        const dataParts = ["changeConfig", ...this.argSerializer.valuesToStrings(args)];

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: this.governanceContract,
            dataParts: dataParts,
            gasLimit: this.config.gasLimitForChangeConfig,
            addDataMovementGas: true,
        }).build();
    }
}
