import { Abi, BytesValue } from "../abi";
import { TokenTransfer, TransactionsFactoryConfig } from "../core";
import { Address } from "../core/address";
import { CodeMetadata } from "../core/codeMetadata";
import { ARGUMENTS_SEPARATOR } from "../core/constants";
import { utf8ToHex } from "../core/utils.codec";
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
    gasLimit: bigint;
};

export type MultisigContractInput = {
    multisigContract: Address;
    gasLimit: bigint;
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
    functionArguments: any[];
    abi?: Abi;
};

export type DepositExecuteInput = MultisigContractInput & {
    egldAmount: bigint;
    gasLimit?: bigint;
    tokenTransfers: TokenTransfer[];
};

export class ProposeTransferExecuteEsdtInput {
    multisigContract: Address;
    to: Address;
    tokens: any[];
    gasLimit: bigint;
    functionName: string;
    functionArguments: any[];
    abi?: Abi;

    constructor(options: ProposeTransferExecuteEsdtInput) {
        this.multisigContract = options.multisigContract;
        this.to = options.to;
        this.tokens = options.tokens;
        this.gasLimit = options.gasLimit;
        this.functionName = options.functionName;
        this.functionArguments = options.functionArguments;
        this.abi = options.abi;
    }
}

export class ProposeTransferExecuteEsdtInputForContract {
    multisigContract: Address;
    to: Address;
    gasLimit?: bigint;
    functionCall: any[];
    tokens: EsdtTokenPayment[];

    constructor(options: {
        multisigContract: Address;
        to: Address;
        gasLimit?: bigint;
        functionCall: any[];
        tokens: EsdtTokenPayment[];
    }) {
        this.multisigContract = options.multisigContract;
        this.to = options.to;
        this.gasLimit = options.gasLimit;
        this.functionCall = options.functionCall;
        this.tokens = options.tokens;
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
    }): ProposeTransferExecuteEsdtInputForContract {
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

        const tokens: EsdtTokenPayment[] = options.tokenTransfers.map((token) => {
            return { token_identifier: token.token.identifier, token_nonce: token.token.nonce, amount: token.amount };
        });

        const functionCallParts = Buffer.from(transaction.data).toString().split(ARGUMENTS_SEPARATOR);
        const functionName = functionCallParts[0];
        const functionArguments = [];
        for (let index = 1; index < functionCallParts.length; index++) {
            const element = functionCallParts[index];
            functionArguments.push(element.valueOf());
        }
        const functionCall = [new BytesValue(Buffer.from(utf8ToHex(functionName))), ...functionArguments];
        return new ProposeTransferExecuteEsdtInputForContract({
            multisigContract: options.multisig,
            to: options.to,
            functionCall: functionCall,
            gasLimit: options.optGasLimit,
            tokens: tokens,
        });
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
    gasLimit: bigint;
    abi?: Abi;
    constructor(options: {
        multisigContract: Address;
        to: Address;
        nativeTransferAmount: bigint;
        tokenTransfers: TokenTransfer[];
        functionName: string;
        functionArguments: any[];
        gasLimit: bigint;
        abi?: Abi;
    }) {
        this.multisigContract = options.multisigContract;
        this.to = options.to;
        this.nativeTransferAmount = options.nativeTransferAmount;
        this.tokenTransfers = options.tokenTransfers;
        this.functionName = options.functionName;
        this.functionArguments = options.functionArguments;
        this.gasLimit = options.gasLimit;
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
