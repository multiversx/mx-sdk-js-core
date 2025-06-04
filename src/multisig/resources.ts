import { Abi } from "../abi";
import { Token, TokenTransfer } from "../core";
import { Address } from "../core/address";
import { CodeMetadata } from "../core/codeMetadata";

export type DeployMultisigContractInput = {
    quorum: number;
    board: Address[];
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
    optGasLimit?: bigint;
    abi?: Abi;
};

export type ProposeContractDeployFromSourceInput = MultisigContractInput & {
    amount: bigint;
    source: Address;
    codeMetadata: CodeMetadata;
    arguments: any[];
    abi?: Abi;
};

export type ProposeContractUpgradeFromSourceInput = MultisigContractInput & {
    scAddress: Address;
    amount: bigint;
    source: Address;
    codeMetadata: CodeMetadata;
    arguments: any[];
    abi?: Abi;
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

export enum UserRoleEnum {
    None = "None",
    Proposer = "Proposer",
    BoardMember = "BoardMember",
}

export enum MultisigActionEnum {
    Nothing = "Nothing",
    AddBoardMember = "AddBoardMember",
    AddProposer = "AddProposer",
    RemoveUser = "RemoveUser",
    ChangeQuorum = "ChangeQuorum",
    SendTransferExecuteEgld = "SendTransferExecuteEgld",
    SendTransferExecuteEsdt = "SendTransferExecuteEsdt",
    SendAsyncCall = "SendAsyncCall",
    SCDeployFromSource = "SCDeployFromSource",
    SCUpgradeFromSource = "SCUpgradeFromSource",
}

export class MultisigAction {
    public type: MultisigActionEnum = MultisigActionEnum.Nothing;
}

export type FullMultisigAction = {
    actionId: number;
    groupId: number;
    signers: Address[];
    actionData: MultisigAction;
};

export class AddBoardMember extends MultisigAction {
    public address: Address;
    constructor(address: Address) {
        super();
        this.type = MultisigActionEnum.AddBoardMember;
        this.address = address;
    }
}
export class AddProposer extends MultisigAction {
    public address: Address;

    constructor(address: Address) {
        super();
        this.type = MultisigActionEnum.AddProposer;
        this.address = address;
    }
}
export class RemoveUser extends MultisigAction {
    public type: MultisigActionEnum = MultisigActionEnum.RemoveUser;
    public address: Address;

    constructor(address: Address) {
        super();
        this.type = MultisigActionEnum.RemoveUser;
        this.address = address;
    }
}

export class ChangeQuorum extends MultisigAction {
    public quorum: number;

    constructor(quorum: number) {
        super();
        this.type = MultisigActionEnum.ChangeQuorum;
        this.quorum = quorum;
    }
}

export class SendTransferExecuteEgld extends MultisigAction {
    receiver: Address;
    amount: bigint;
    optionalGasLimit?: bigint;
    functionName: string;
    arguments: Uint8Array[];

    constructor(data: any) {
        super();
        this.type = MultisigActionEnum.SendTransferExecuteEgld;
        this.receiver = data.to;
        this.amount = BigInt(data.egld_amount?.toFixed() ?? 0);
        this.optionalGasLimit = BigInt(data.opt_gas_limit?.toFixed() ?? 0);
        this.functionName = data.endpoint_name.toString();
        this.arguments = data.arguments;
    }
}
export class SendTransferExecuteEsdt extends MultisigAction {
    receiver: Address;
    tokens: TokenTransfer[];
    optionalGasLimit?: bigint;
    funcionName: string;
    arguments: Uint8Array[];

    constructor(data: any) {
        super();
        this.type = MultisigActionEnum.SendTransferExecuteEsdt;
        this.receiver = data.to;
        this.tokens = data.tokens.map(
            (token: { token_identifier: string; nonce: bigint; amount: bigint }) =>
                new TokenTransfer({
                    token: new Token({ identifier: token.token_identifier, nonce: token.nonce }),
                    amount: token.amount,
                }),
        );
        this.optionalGasLimit = BigInt(data.opt_gas_limit.toFixed());

        this.funcionName = Buffer.from(data.endpoint_name.toString(), "hex").toString();
        this.arguments = data.arguments;
    }
}

export class SendAsyncCall extends MultisigAction {
    receiver: Address;
    amount: bigint;
    optionalGasLimit?: bigint;
    funcionName: string;
    arguments: Uint8Array[];

    constructor(data: any) {
        super();
        this.type = MultisigActionEnum.SendAsyncCall;
        this.receiver = data.to;
        this.amount = BigInt(data.egld_amount?.toFixed() ?? 0);
        this.optionalGasLimit = BigInt(data.opt_gas_limit?.toFixed() ?? 0);
        this.funcionName = data.endpoint_name.toString();
        this.arguments = data.arguments;
    }
}

export class SCDeployFromSource extends MultisigAction {
    sourceContract: Address;
    amount: bigint;
    codeMetadata: CodeMetadata;
    arguments: Uint8Array[];

    constructor(data: any) {
        super();
        this.type = MultisigActionEnum.SCDeployFromSource;
        this.sourceContract = data[1];
        this.amount = data[0];
        this.codeMetadata = data[2];
        this.arguments = data[3];
    }
}

export class SCUpgradeFromSource extends MultisigAction {
    sourceContract: Address;
    destinationContract: Address;
    amount: bigint;
    codeMetadata: CodeMetadata;
    arguments: Uint8Array[];

    constructor(data: any) {
        super();
        this.type = MultisigActionEnum.SCUpgradeFromSource;
        this.destinationContract = data[0];
        this.amount = data[1];
        this.sourceContract = data[2];
        this.codeMetadata = data[3];
        this.arguments = data[4];
    }
}

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
