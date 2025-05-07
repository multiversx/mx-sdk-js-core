import {
    Abi,
    AddressValue,
    ArgSerializer,
    BigUIntValue,
    BytesValue,
    CodeMetadataValue,
    EndpointDefinition,
    isTyped,
    NativeSerializer,
    OptionType,
    OptionValue,
    TypedValue,
    U32Value,
    U64Type,
    U64Value,
    VariadicValue,
} from "../abi";
import { Err, TokenComputer, TransactionsFactoryConfig } from "../core";
import { Address } from "../core/address";
import { Transaction } from "../core/transaction";
import { TransactionBuilder } from "../core/transactionBuilder";
import { SmartContractTransactionsFactory } from "../smartContracts";
import { ProposeTransferExecuteContractInput } from "./proposeTransferExecuteContractInput";
import * as resources from "./resources";

interface IConfig {
    chainID: string;
    addressHrp: string;
    minGasLimit: bigint;
    gasLimitPerByte: bigint;
}

/**
 * Use this class to create multisig related transactions like creating a new multisig contract,
 * proposing actions, signing actions, and performing actions.
 */
export class MultisigTransactionsFactory {
    private readonly argSerializer: ArgSerializer;
    private readonly smartContractFactory: SmartContractTransactionsFactory;
    private readonly config: IConfig;
    private readonly abi: Abi;

    constructor(options: { config: TransactionsFactoryConfig; abi: Abi }) {
        this.config = options.config;
        this.abi = options.abi;
        this.argSerializer = new ArgSerializer();
        this.smartContractFactory = new SmartContractTransactionsFactory(options);
    }

    /**
     * Creates a transaction to deploy a new multisig contract
     */
    createTransactionForDeploy(sender: Address, options: resources.DeployMultisigContractInput): Transaction {
        const boardAddresses: AddressValue[] = options.board.map((addr) => new AddressValue(addr));
        const args = [new U32Value(options.quorum), VariadicValue.fromItems(...boardAddresses)];

        return this.smartContractFactory.createTransactionForDeploy(sender, {
            bytecode: options.bytecode,
            gasLimit: options.gasLimit,
            isUpgradeable: options.isUpgradeable,
            isReadable: options.isReadable,
            isPayable: options.isPayable,
            isPayableBySmartContract: options.isPayableBySmartContract,
            arguments: args,
        });
    }

    /**
     * Proposes adding a new board member
     */
    createTransactionForProposeAddBoardMember(
        sender: Address,
        options: resources.ProposeAddBoardMemberInput,
    ): Transaction {
        return this.smartContractFactory.createTransactionForExecute(sender, {
            contract: options.multisigContract,
            function: "proposeAddBoardMember",
            gasLimit: options.gasLimit,
            arguments: [options.boardMember],
        });
    }

    /**
     * Proposes adding a new proposer
     */
    createTransactionForProposeAddProposer(sender: Address, options: resources.ProposeAddProposerInput): Transaction {
        return this.smartContractFactory.createTransactionForExecute(sender, {
            contract: options.multisigContract,
            function: "proposeAddProposer",
            gasLimit: options.gasLimit,
            arguments: [options.proposer],
        });
    }

    /**
     * Proposes removing a user (board member or proposer)
     */
    createTransactionForProposeRemoveUser(sender: Address, options: resources.ProposeRemoveUserInput): Transaction {
        return this.smartContractFactory.createTransactionForExecute(sender, {
            contract: options.multisigContract,
            function: "proposeRemoveUser",
            gasLimit: options.gasLimit,
            arguments: [options.userAddress],
        });
    }

    /**
     * Proposes changing the quorum (minimum signatures required)
     */
    createTransactionForProposeChangeQuorum(sender: Address, options: resources.ProposeChangeQuorumInput): Transaction {
        return this.smartContractFactory.createTransactionForExecute(sender, {
            contract: options.multisigContract,
            function: "proposeChangeQuorum",
            gasLimit: options.gasLimit,
            arguments: [options.newQuorum],
        });
    }

    /**
     * Proposes a transaction that will transfer EGLD and/or execute a function
     */
    createTransactionForProposeTransferExecute(
        sender: Address,
        options: resources.ProposeTransferExecuteInput,
    ): Transaction {
        const gasOption = new U64Value(options.optGasLimit ?? 0n);
        const input = ProposeTransferExecuteContractInput.newFromTransferExecuteInput({
            multisig: options.multisigContract,
            to: options.to,
            functionName: options.functionName,
            arguments: options.functionArguments,
            abi: options.abi,
        });

        return this.smartContractFactory.createTransactionForExecute(sender, {
            contract: options.multisigContract,
            function: "proposeTransferExecute",
            gasLimit: options.gasLimit,
            arguments: [
                new AddressValue(options.to),
                new BigUIntValue(options.nativeTokenAmount),
                new OptionValue(new OptionType(new U64Type()), gasOption),
                VariadicValue.fromItems(...input.functionCall.map((value) => new BytesValue(value))),
            ],
        });
    }

    /**
     * Proposes a transaction that will transfer EGLD and/or execute a function
     */
    createTransactionForDeposit(sender: Address, options: resources.DepositExecuteInput): Transaction {
        return this.smartContractFactory.createTransactionForExecute(sender, {
            contract: options.multisigContract,
            function: "deposit",
            gasLimit: options.gasLimit,
            arguments: [],
            nativeTransferAmount: options.nativeTokenAmount,
            tokenTransfers: options.tokenTransfers,
        });
    }

    /**
     * Proposes a transaction that will transfer ESDT tokens and/or execute a function
     */
    createTransactionForProposeTransferExecuteEsdt(
        sender: Address,
        options: resources.ProposeTransferExecuteEsdtInput,
    ): Transaction {
        const input = ProposeTransferExecuteContractInput.newFromTransferExecuteInput({
            multisig: options.multisigContract,
            to: options.to,
            functionName: options.functionName,
            arguments: options.functionArguments,
            abi: options.abi,
        });

        const tokenPayments: resources.EsdtTokenPayment[] = this.mapTokenPayments(options);
        const dataParts = [
            "proposeTransferExecuteEsdt",
            ...this.argSerializer.valuesToStrings(
                NativeSerializer.nativeToTypedValues(
                    [options.to, tokenPayments, options.optGasLimit, VariadicValue.fromItems(...input.functionCall)],
                    this.abi.getEndpoint("proposeTransferExecuteEsdt"),
                ),
            ),
        ];
        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: options.multisigContract,
            dataParts: dataParts,
            gasLimit: options.gasLimit,
            addDataMovementGas: false,
        }).build();
    }

    private mapTokenPayments(options: resources.ProposeTransferExecuteEsdtInput): resources.EsdtTokenPayment[] {
        const tokenComputer = new TokenComputer();
        const tokens = [];
        for (const token of options.tokens) {
            tokens.push({
                token_identifier: tokenComputer.extractIdentifierFromExtendedIdentifier(token.token.identifier),
                token_nonce: token.token.nonce,
                amount: token.amount,
            });
        }
        return tokens;
    }

    /**
     * Proposes an async call to another contract
     */
    createTransactionForProposeAsyncCall(sender: Address, options: resources.ProposeAsyncCallInput): Transaction {
        const input = ProposeTransferExecuteContractInput.newFromProposeAsyncCallInput({
            multisig: options.multisigContract,
            to: options.to,
            tokenTransfers: options.tokenTransfers,
            functionName: options.functionName,
            arguments: options.functionArguments,
            abi: options.abi,
        });

        return this.smartContractFactory.createTransactionForExecute(sender, {
            contract: options.multisigContract,
            function: "proposeAsyncCall",
            gasLimit: options.gasLimit,
            arguments: [
                new AddressValue(options.to),
                new BigUIntValue(options.nativeTransferAmount),
                new BigUIntValue(options.optGasLimit ?? 0n),
                VariadicValue.fromItems(...input.functionCall.map((value) => new BytesValue(value))),
            ],
        });
    }

    /**
     * Proposes deploying a smart contract from source
     */
    createTransactionForProposeContractDeployFromSource(
        sender: Address,
        options: resources.ProposeContractDeployFromSourceInput,
    ): Transaction {
        let args: TypedValue[] = this.argsToTypedValues(options.arguments, options.abi?.constructorDefinition);
        return this.smartContractFactory.createTransactionForExecute(sender, {
            contract: options.multisigContract,
            function: "proposeSCDeployFromSource",
            gasLimit: options.gasLimit,
            arguments: [
                new BigUIntValue(options.amount),
                new AddressValue(options.multisigContract),
                new CodeMetadataValue(options.codeMetadata),
                VariadicValue.fromItems(...args),
            ],
        });
    }

    /**
     * Proposes upgrading a smart contract from source
     */
    createTransactionForProposeContractUpgradeFromSource(
        sender: Address,
        options: resources.ProposeContractUpgradeFromSourceInput,
    ): Transaction {
        let args: TypedValue[] = this.argsToTypedValues(options.arguments, options.abi?.constructorDefinition);
        return this.smartContractFactory.createTransactionForExecute(sender, {
            contract: options.multisigContract,
            function: "proposeSCUpgradeFromSource",
            gasLimit: options.gasLimit,
            arguments: [
                new AddressValue(options.multisigContract),
                new BigUIntValue(options.amount),
                new AddressValue(options.source),
                new CodeMetadataValue(options.codeMetadata),
                VariadicValue.fromItems(...args),
            ],
        });
    }

    /**
     * Signs an action (by a board member)
     */
    createTransactionForSignAction(sender: Address, options: resources.ActionInput): Transaction {
        return this.smartContractFactory.createTransactionForExecute(sender, {
            contract: options.multisigContract,
            function: "sign",
            gasLimit: options.gasLimit,
            arguments: [options.actionId],
        });
    }

    /**
     * Signs all actions in a batch
     */
    createTransactionForSignBatch(sender: Address, options: resources.GroupInput): Transaction {
        return this.smartContractFactory.createTransactionForExecute(sender, {
            contract: options.multisigContract,
            function: "signBatch",
            gasLimit: options.gasLimit,
            arguments: [options.groupId],
        });
    }

    /**
     * Signs and performs an action in one transaction
     */
    createTransactionForSignAndPerform(sender: Address, options: resources.ActionInput): Transaction {
        return this.smartContractFactory.createTransactionForExecute(sender, {
            contract: options.multisigContract,
            function: "signAndPerform",
            gasLimit: options.gasLimit,
            arguments: [options.actionId],
        });
    }

    /**
     * Signs and performs all actions in a batch
     */
    createTransactionForSignBatchAndPerform(sender: Address, options: resources.GroupInput): Transaction {
        return this.smartContractFactory.createTransactionForExecute(sender, {
            contract: options.multisigContract,
            function: "signBatchAndPerform",
            gasLimit: options.gasLimit,
            arguments: [options.groupId],
        });
    }

    /**
     * Withdraws signature from an action
     */
    createTransactionForUnsign(sender: Address, options: resources.ActionInput): Transaction {
        return this.smartContractFactory.createTransactionForExecute(sender, {
            contract: options.multisigContract,
            function: "unsign",
            gasLimit: options.gasLimit,
            arguments: [options.actionId],
        });
    }

    /**
     * Withdraws signatures from all actions in a batch
     */
    createTransactionForUnsignBatch(sender: Address, options: resources.GroupInput): Transaction {
        return this.smartContractFactory.createTransactionForExecute(sender, {
            contract: options.multisigContract,
            function: "unsignBatch",
            gasLimit: options.gasLimit,
            arguments: [options.groupId],
        });
    }

    /**
     * Removes signatures from outdated board members
     */
    createTransactionForUnsignForOutdatedBoardMembers(
        sender: Address,
        options: resources.UnsignForOutdatedBoardMembersInput,
    ): Transaction {
        const outdatedBoardMembers: U32Value[] = options.outdatedBoardMembers.map((id) => new U32Value(id));
        return this.smartContractFactory.createTransactionForExecute(sender, {
            contract: options.multisigContract,
            function: "unsignForOutdatedBoardMembers",
            gasLimit: options.gasLimit,
            arguments: [new U32Value(options.actionId), VariadicValue.fromItems(...outdatedBoardMembers)],
        });
    }

    /**
     * Performs an action that has reached quorum
     */
    createTransactionForPerformAction(sender: Address, options: resources.ActionInput): Transaction {
        return this.smartContractFactory.createTransactionForExecute(sender, {
            contract: options.multisigContract,
            function: "performAction",
            gasLimit: options.gasLimit,
            arguments: [options.actionId],
        });
    }

    /**
     * Performs all actions in a batch that have reached quorum
     */
    createTransactionForPerformBatch(sender: Address, options: resources.GroupInput): Transaction {
        return this.smartContractFactory.createTransactionForExecute(sender, {
            contract: options.multisigContract,
            function: "performBatch",
            gasLimit: options.gasLimit,
            arguments: [options.groupId],
        });
    }

    /**
     * Discards an action that is no longer needed
     */
    createTransactionForDiscardAction(sender: Address, options: resources.ActionInput): Transaction {
        return this.smartContractFactory.createTransactionForExecute(sender, {
            contract: options.multisigContract,
            function: "discardAction",
            gasLimit: options.gasLimit,
            arguments: [options.actionId],
        });
    }

    /**
     * Discards all actions in the provided list
     */
    createTransactionForDiscardBatch(sender: Address, options: resources.DiscardBatchInput): Transaction {
        const actionIdsArgs = options.actionIds.map((id) => new U32Value(id));
        return this.smartContractFactory.createTransactionForExecute(sender, {
            contract: options.multisigContract,
            function: "discardBatch",
            gasLimit: options.gasLimit,
            arguments: [VariadicValue.fromItems(...actionIdsArgs)],
        });
    }

    protected argsToTypedValues(args: any[], endpoint?: EndpointDefinition): TypedValue[] {
        if (endpoint) {
            const typedArgs = NativeSerializer.nativeToTypedValues(args, endpoint);
            return typedArgs;
        }

        if (this.areArgsOfTypedValue(args)) {
            return args;
        }

        throw new Err("Can't convert args to TypedValues");
    }

    private areArgsOfTypedValue(args: any[]): boolean {
        return args.every((arg) => isTyped(arg));
    }
}
