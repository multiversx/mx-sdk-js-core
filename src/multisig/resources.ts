import { Abi } from "../abi";
import { TokenTransfer } from "../core";
import { Address } from "../core/address";
import { CodeMetadata } from "../core/codeMetadata";

export type DeployMultisigContractInput = {
    quorum: number;
    board: Address[];
    amount?: bigint;
    bytecode: Uint8Array;
    isUpgradeable?: boolean;
    isReadable?: boolean;
    isPayable?: boolean;
    isPayableBySmartContract?: boolean;
    gasLimit: bigint;
};

export type MultisigContractInput = {
    multisigContract: Address;
    gasLimit: bigint;
};

export type ProposeAddBoardMemberInput = MultisigContractInput & {
    boardMember: Address;
};

export type ProposeAddProposerInput = MultisigContractInput & {
    proposer: Address;
};

export type ProposeRemoveUserInput = MultisigContractInput & {
    userAddress: Address;
};

export type ProposeChangeQuorumInput = MultisigContractInput & {
    newQuorum: number;
};

export type ProposeTransferExecuteInput = MultisigContractInput & {
    to: Address;
    nativeTokenAmount: bigint;
    optGasLimit?: bigint;
    functionName: string;
    functionArguments: any[];
    abi?: Abi;
};

export type DepositExecuteInput = MultisigContractInput & {
    nativeTokenAmount: bigint;
    gasLimit?: bigint;
    tokenTransfers: TokenTransfer[];
};

export type ProposeTransferExecuteEsdtInput = MultisigContractInput & {
    to: Address;
    tokens: any[];
    optGasLimit?: bigint;
    functionName: string;
    functionArguments: any[];
    abi?: Abi;
};

export type ProposeAsyncCallInput = MultisigContractInput & {
    multisigContract: Address;
    to: Address;
    nativeTransferAmount: bigint;
    tokenTransfers: TokenTransfer[];
    functionName: string;
    functionArguments: any[];
    gasLimit: bigint;
    abi?: Abi;
};

export type ProposeSCDeployFromSourceInput = MultisigContractInput & {
    amount: bigint;
    source: Address;
    codeMetadata: CodeMetadata;
    arguments: string[];
};

export type ProposeSCUpgradeFromSourceInput = MultisigContractInput & {
    scAddress: Address;
    amount: bigint;
    source: Address;
    codeMetadata: CodeMetadata;
    arguments: string[];
};

export type ActionInput = MultisigContractInput & {
    actionId: number;
};

export type GroupInput = MultisigContractInput & {
    groupId: number;
};

export type UnsignForOutdatedBoardMembersInput = ActionInput & {
    outdatedBoardMembers: number[];
};

export type DiscardBatchInput = MultisigContractInput & {
    actionIds: number[];
};

export type CallActionData = {
    receiver: Address;
    amount: bigint;
    optionalGasLimit?: number | null;
    functionName: Uint8Array;
    arguments: Uint8Array[];
};

export type EsdtTokenPayment = {
    token_identifier: any;
    token_nonce: any;
    amount: any;
};
