import { Address } from "../core";

export type NewProposalInput = {
    commitHash: string;
    startVoteEpoch: number;
    endVoteEpoch: number;
    nativeTokenAmount: bigint;
};

export type VoteProposalInput = {
    proposalNonce: number;
    vote: Vote;
};

export enum Vote {
    YES = "yes",
    NO = "no",
    ABSTAIN = "abstain",
    VETO = "veto",
}

export type CloseProposalInput = {
    proposalNonce: number;
};

export type ClearEndedProposalsInput = {
    proposers: Address[];
};

export type ChangeConfigInput = {
    proposalFee: bigint;
    lastProposalFee: bigint;
    minQuorum: number;
    minVetoThreshold: number;
    minPassThreshold: number;
};

export type NewProposalOutcome = {
    proposalNonce: number;
    commitHash: string;
    startVoteEpoch: number;
    endVoteEpoch: number;
};

export type VoteOutcome = {
    proposalNonce: number;
    vote: string;
    totalStake: bigint;
    votingPower: bigint;
};

export type DelegateVoteOutcome = {
    proposalNonce: number;
    vote: string;
    voter: Address;
    userStake: bigint;
    votingPower: bigint;
};

export type CloseProposalOutcome = {
    commitHash: string;
    passed: boolean;
};

export type GovernanceConfig = {
    proposalFee: bigint;
    minQuorum: number;
    minPassThreshold: number;
    minVetoThreshold: number;
    lastProposalNonce: number;
};

export type ProposalInfo = {
    cost: bigint;
    commitHash: string;
    nonce: number;
    issuer: Address;
    startVoteEpoch: number;
    endVoteEpoch: number;
    quorumStake: bigint;
    numYesVotes: bigint;
    numNoVotes: bigint;
    numVetoVotes: bigint;
    numAbstainVotes: bigint;
    isClosed: boolean;
    isPassed: boolean;
};

export type DelegatedVoteInfo = {
    usedStake: bigint;
    usedPower: bigint;
    totalStake: bigint;
    totalPower: bigint;
};
