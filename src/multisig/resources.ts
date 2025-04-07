import { Abi, BytesValue } from "../abi";
import { Token, TokenTransfer, TransactionsFactoryConfig } from "../core";
import { Address } from "../core/address";
import { CodeMetadata } from "../core/codeMetadata";
import { ARGUMENTS_SEPARATOR } from "../core/constants";
import { SmartContractTransactionsFactory } from "../smartContracts";

export type DeployMultisigContractInput = {
    quorum: number;
    board: Address[];
    amount?: bigint;
    bytecode: Uint8Array;
    isUpgradeable?: boolean;
    isReadable?: boolean;
    isPayable?: boolean;
    isPayableBySmartContract?: boolean;
};

export type UpgradeMultisigContractInput = {
    bytecode: Uint8Array;
    isUpgradeable?: boolean;
    isReadable?: boolean;
    isPayable?: boolean;
    isPayableBySmartContract?: boolean;
    multisigContract: Address;
};
export type MultisigContractInput = {
    multisigContract: Address;
};

export type ProposeAddBoardMemberInput = MultisigContractInput & {
    boardMemberAddress: Address;
};

export type ProposeAddProposerInput = MultisigContractInput & {
    proposerAddress: Address;
};

export type ProposeRemoveUserInput = MultisigContractInput & {
    userAddress: Address;
};

export type ProposeChangeQuorumInput = MultisigContractInput & {
    newQuorum: number;
};

export type ProposeTransferExecuteInput = MultisigContractInput & {
    to: Address;
    egldAmount: bigint;
    gasLimit?: bigint;
    functionName: string;
    arguments: any[];
};

export class ProposeTransferExecuteEsdtInput {
    multisigContract: Address;
    to: Address;
    tokens: any[];
    gasLimit?: bigint;
    functionName: string;
    arguments: any[];

    constructor(options: ProposeTransferExecuteEsdtInput) {
        this.multisigContract = options.multisigContract;
        this.to = options.to;
        this.tokens = options.tokens;
        this.gasLimit = options.gasLimit;
        this.functionName = options.functionName;
        this.arguments = options.arguments;
    }
}

export class ProposeTransferExecutInput {
    multisigContract: Address;
    to: Address;
    gasLimit?: bigint;
    functionCall: any[];

    constructor(options: { multisigContract: Address; to: Address; gasLimit?: bigint; functionCall: any[] }) {
        this.multisigContract = options.multisigContract;
        this.to = options.to;
        this.gasLimit = options.gasLimit;
        this.functionCall = options.functionCall;
    }

    static newFromTransferExecuteInput(options: {
        multisig: Address;
        to: Address;
        nativeTransferAmount: bigint;
        tokenTransfers: TokenTransfer[];
        functionName: string;
        arguments: any[];
        optGasLimit?: bigint;
        abi?: Abi;
    }): ProposeTransferExecutInput {
        const transactionsFactory = new SmartContractTransactionsFactory({
            config: new TransactionsFactoryConfig({ chainID: "" }),
            abi: options.abi,
        });
        const transaction = transactionsFactory.createTransactionForExecute(Address.empty(), {
            contract: Address.empty(),
            function: options.functionName,
            gasLimit: 0n,
            arguments: options.arguments,
            nativeTransferAmount: 0n,
            tokenTransfers: options.tokenTransfers,
        });
        const functionCallParts = Buffer.from(transaction.data).toString().split(ARGUMENTS_SEPARATOR);
        const functionName = functionCallParts[0];
        const functionArguments = [];
        for (let index = 1; index < functionCallParts.length; index++) {
            const element = functionCallParts[index];
            functionArguments.push(element.valueOf());
        }
        const functionCall = [new BytesValue(Buffer.from(utf8ToHex(functionName))), ...functionArguments];
        return new ProposeTransferExecutInput({
            multisigContract: options.multisig,
            to: options.to,
            functionCall: functionCall,
            gasLimit: options.optGasLimit,
        });
    }
}

export class ProposeAsyncCallInput {
    multisigContract: Address;
    to: Address;
    nativeTransferAmount: bigint;
    tokenTransfers: TokenTransfer[];
    functionName: string;
    functionArguments: any[];
    optGasLimit?: bigint;
    abi?: Abi;
    /**
     *
     */
    constructor(options: {
        multisigContract: Address;
        to: Address;
        nativeTransferAmount: bigint;
        tokenTransfers: TokenTransfer[];
        functionName: string;
        functionArguments: any[];
        optGasLimit?: bigint;
        abi?: Abi;
    }) {
        this.multisigContract = options.multisigContract;
        this.to = options.to;
        this.nativeTransferAmount = options.nativeTransferAmount;
        this.tokenTransfers = options.tokenTransfers;
        this.functionName = options.functionName;
        this.functionArguments = options.functionArguments;
        this.optGasLimit = options.optGasLimit;
        this.abi = options.abi;
    }
}

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
    optionalGasLimit?: number;
    funcionName: string;
    arguments: Uint8Array[];
    constructor(data: any) {
        super();
        this.type = MultisigActionEnum.SendTransferExecuteEgld;
        this.receiver = data.to;
        this.amount = data.egld_amount;
        this.optionalGasLimit = data.opt_gas_limit;
        this.funcionName = data.endpoint_name.toString();
        this.arguments = data.arguments;
        console.log(this.receiver, data.to);
    }
}
export class SendTransferExecuteEsdt extends MultisigAction {
    receiver: Address;
    tokens: TokenTransfer[];
    optionalGasLimit?: number;
    funcionName: string;
    arguments: Uint8Array[];
    constructor(data: any) {
        super();
        this.type = MultisigActionEnum.SendTransferExecuteEsdt;
        this.receiver = data.to;
        this.tokens = data.tokens.map(
            (token: { token_identifier: any; nonce: any; amount: any }) =>
                new TokenTransfer({
                    token: new Token({ identifier: token.token_identifier, nonce: token.nonce }),
                    amount: token.amount,
                }),
        );
        this.optionalGasLimit = data.opt_gas_limit;
        this.funcionName = data.endpoint_name.toString();
        this.arguments = data.arguments;
    }
}

export class SendAsyncCall extends MultisigAction {
    receiver: Address;
    amount: bigint;
    optionalGasLimit?: number;
    funcionName: string;
    arguments: Uint8Array[];
    constructor(data: any) {
        console.log({ data });
        super();
        this.type = MultisigActionEnum.SendAsyncCall;
        this.receiver = data.to;
        this.amount = data.egld_amount;
        this.optionalGasLimit = data.opt_gas_limit;
        this.funcionName = data.endpoint_name.toString();
        this.arguments = data.arguments;
    }
}

export class SCDeployFromSource extends MultisigAction {
    sourceContractAddress: Address;
    amount: bigint;
    codeMetadata: CodeMetadata;
    arguments: Uint8Array[];
    constructor(data: any) {
        super();
        this.type = MultisigActionEnum.SCDeployFromSource;
        this.sourceContractAddress = data.source;
        this.amount = data.amount;
        this.codeMetadata = data.code_metadata;
        this.arguments = data.arguments;
    }
}

export class SCUpgradeFromSource extends MultisigAction {
    sourceContractAddress: Address;
    scAddress: Address;
    amount: bigint;
    codeMetadata: CodeMetadata;
    arguments: Uint8Array[];
    constructor(data: any) {
        super();
        this.type = MultisigActionEnum.SCUpgradeFromSource;
        this.sourceContractAddress = data.source;
        this.scAddress = data.sc_address;
        this.amount = data.amount;
        this.codeMetadata = data.code_metadata;
        this.arguments = data.arguments;
    }
}

export type CallActionData = {
    receiver: Address;
    amount: BigInt;
    optionalGasLimit?: number | null;
    functionName: Uint8Array;
    arguments: Uint8Array[];
};

export type EsdtTokenPayment = {
    token_identifier: string;
    token_nonce: number;
    amount: BigInt;
};

export type EsdtTransferExecuteData = {
    to: Address;
    tokens: EsdtTokenPayment[];
    opt_gas_limit?: number | null;
    endpoint_name: Uint8Array;
    arguments: Uint8Array[];
};
