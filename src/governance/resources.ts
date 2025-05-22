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
