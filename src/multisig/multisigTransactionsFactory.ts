import {
    AddressValue,
    ArgSerializer,
    BigUIntValue,
    EndpointDefinition,
    EndpointModifiers,
    NativeSerializer,
    OptionType,
    OptionValue,
    TokenIdentifierValue,
    U32Value,
    U64Type,
    U64Value,
    VariadicValue,
} from "../abi";
import { TokenComputer, TransactionsFactoryConfig } from "../core";
import { Address } from "../core/address";
import { Transaction } from "../core/transaction";
import { TransactionBuilder } from "../core/transactionBuilder";
import { SmartContractTransactionsFactory } from "../smartContracts";
import { ProposeTransferExecuteContractInput } from "./proposeTransferExecuteContract";
import * as resources from "./resources";

interface IAbi {
    constructorDefinition: EndpointDefinition;
    upgradeConstructorDefinition?: EndpointDefinition;

    getEndpoint(name: string): EndpointDefinition;
}
/**
 * Use this class to create multisig related transactions like creating a new multisig contract,
 * proposing actions, signing actions, and performing actions.
 */
export class MultisigTransactionsFactory extends SmartContractTransactionsFactory {
    private readonly argSerializer: ArgSerializer;

    constructor(options: { config: TransactionsFactoryConfig; abi?: IAbi }) {
        super(options);
        this.argSerializer = new ArgSerializer();
    }

    /**
     * Creates a transaction to deploy a new multisig contract
     */
    createTransactionForMultisigDeploy(sender: Address, options: resources.DeployMultisigContractInput): Transaction {
        const nativeTransferAmount = options.amount ?? 0n;
        const boardAddresses: AddressValue[] = options.board.map((addr) => new AddressValue(addr));
        const args = [new U32Value(options.quorum), VariadicValue.fromItems(...boardAddresses)];

        return this.createTransactionForDeploy(sender, {
            bytecode: options.bytecode,
            gasLimit: options.gasLimit,
            nativeTransferAmount,
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
        const dataParts = [
            "proposeAddBoardMember",
            this.argSerializer.valuesToStrings([new AddressValue(options.boardMember)])[0],
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

    /**
     * Proposes adding a new proposer
     */
    createTransactionForProposeAddProposer(sender: Address, options: resources.ProposeAddProposerInput): Transaction {
        const dataParts = [
            "proposeAddProposer",
            this.argSerializer.valuesToStrings([new AddressValue(options.proposer)])[0],
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

    /**
     * Proposes removing a user (board member or proposer)
     */
    createTransactionForProposeRemoveUser(sender: Address, options: resources.ProposeRemoveUserInput): Transaction {
        const dataParts = [
            "proposeRemoveUser",
            this.argSerializer.valuesToStrings([new AddressValue(options.userAddress)])[0],
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

    /**
     * Proposes changing the quorum (minimum signatures required)
     */
    createTransactionForProposeChangeQuorum(sender: Address, options: resources.ProposeChangeQuorumInput): Transaction {
        const dataParts = [
            "proposeChangeQuorum",
            this.argSerializer.valuesToStrings([new U32Value(options.newQuorum)])[0],
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

    /**
     * Proposes a transaction that will transfer EGLD and/or execute a function
     */
    createTransactionForProposeTransferExecute(
        sender: Address,
        options: resources.ProposeTransferExecuteInput,
    ): Transaction {
        const gasOption = new U64Value(options.gasLimit);
        const input = ProposeTransferExecuteContractInput.newFromTransferExecuteInput({
            multisig: options.multisigContract,
            to: options.to,
            functionName: options.functionName,
            arguments: options.functionArguments,
            abi: options.abi,
        });
        const dataParts = [
            "proposeTransferExecute",
            ...this.argSerializer.valuesToStrings([
                new AddressValue(options.to),
                new BigUIntValue(options.nativeTokenAmount),
                new OptionValue(new OptionType(new U64Type()), gasOption),
            ]),
            ...input.functionCall,
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

    /**
     * Proposes a transaction that will transfer EGLD and/or execute a function
     */
    createTransactionForDeposit(sender: Address, options: resources.DepositExecuteInput): Transaction {
        return this.createTransactionForExecute(sender, {
            contract: options.multisigContract,
            function: "deposit",
            gasLimit: options.gasLimit ?? 0n,
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
        const tokenComputer = new TokenComputer();
        const argsTyped = [];
        for (const token of options.tokens) {
            argsTyped.push({
                token_identifier: new TokenIdentifierValue(
                    tokenComputer.extractIdentifierFromExtendedIdentifier(token.token.identifier),
                ),
                token_nonce: new U64Value(token.token.nonce),
                amount: new BigUIntValue(token.amount),
            });
        }
        const dataParts = [
            "proposeTransferExecuteEsdt",
            ...this.argSerializer.valuesToStrings(
                NativeSerializer.nativeToTypedValues(
                    [options.to, argsTyped, options.gasLimit, VariadicValue.fromItems(...input.functionCall)],
                    this.abi?.getEndpoint("proposeTransferExecuteEsdt") ??
                        new EndpointDefinition("proposeTransferExecuteEsdt", [], [], new EndpointModifiers("", [])),
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
        let receiver = options.multisigContract;
        const dataParts = [
            "proposeAsyncCall",
            ...this.argSerializer.valuesToStrings([
                new AddressValue(options.to),
                new BigUIntValue(options.nativeTransferAmount),
                new BigUIntValue(options.gasLimit ?? 0n),
            ]),
            ...input.functionCall,
        ];

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: receiver,
            dataParts: dataParts,
            gasLimit: options.gasLimit,
            addDataMovementGas: false,
            amount: 0n,
        }).build();
    }

    /**
     * Proposes deploying a smart contract from source
     */
    createTransactionForProposeSCDeployFromSource(
        sender: Address,
        options: resources.ProposeSCDeployFromSourceInput,
    ): Transaction {
        const dataParts = [
            "proposeSCDeployFromSource",
            ...this.argSerializer.valuesToStrings([new BigUIntValue(options.amount), new AddressValue(options.source)]),
            options.codeMetadata.toString(),
            ...options.arguments,
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

    /**
     * Proposes upgrading a smart contract from source
     */
    createTransactionForProposeSCUpgradeFromSource(
        sender: Address,
        options: resources.ProposeSCUpgradeFromSourceInput,
    ): Transaction {
        const dataParts = [
            "proposeSCUpgradeFromSource",
            ...this.argSerializer.valuesToStrings([
                new AddressValue(options.scAddress),
                new BigUIntValue(options.amount),
                new AddressValue(options.source),
            ]),
            options.codeMetadata.toString(),
            ...options.arguments,
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

    /**
     * Signs an action (by a board member)
     */
    createTransactionForSignAction(sender: Address, options: resources.ActionInput): Transaction {
        const dataParts = ["sign", this.argSerializer.valuesToStrings([new U32Value(options.actionId)])[0]];

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: options.multisigContract,
            dataParts: dataParts,
            gasLimit: options.gasLimit,
            addDataMovementGas: false,
        }).build();
    }

    /**
     * Signs all actions in a batch
     */
    createTransactionForSignBatch(sender: Address, options: resources.GroupInput): Transaction {
        const dataParts = ["signBatch", this.argSerializer.valuesToStrings([new U32Value(options.groupId)])[0]];

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: options.multisigContract,
            dataParts: dataParts,
            gasLimit: options.gasLimit,
            addDataMovementGas: false,
        }).build();
    }

    /**
     * Signs and performs an action in one transaction
     */
    createTransactionForSignAndPerform(sender: Address, options: resources.ActionInput): Transaction {
        const dataParts = ["signAndPerform", this.argSerializer.valuesToStrings([new U32Value(options.actionId)])[0]];

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: options.multisigContract,
            dataParts: dataParts,
            gasLimit: options.gasLimit,
            addDataMovementGas: false,
        }).build();
    }

    /**
     * Signs and performs all actions in a batch
     */
    createTransactionForSignBatchAndPerform(sender: Address, options: resources.GroupInput): Transaction {
        const dataParts = [
            "signBatchAndPerform",
            this.argSerializer.valuesToStrings([new U32Value(options.groupId)])[0],
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

    /**
     * Withdraws signature from an action
     */
    createTransactionForUnsign(sender: Address, options: resources.ActionInput): Transaction {
        const dataParts = ["unsign", this.argSerializer.valuesToStrings([new U32Value(options.actionId)])[0]];

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: options.multisigContract,
            dataParts: dataParts,
            gasLimit: options.gasLimit,
            addDataMovementGas: false,
        }).build();
    }

    /**
     * Withdraws signatures from all actions in a batch
     */
    createTransactionForUnsignBatch(sender: Address, options: resources.GroupInput): Transaction {
        const dataParts = ["unsignBatch", this.argSerializer.valuesToStrings([new U32Value(options.groupId)])[0]];

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: options.multisigContract,
            dataParts: dataParts,
            gasLimit: options.gasLimit,
            addDataMovementGas: false,
        }).build();
    }

    /**
     * Removes signatures from outdated board members
     */
    createTransactionForUnsignForOutdatedBoardMembers(
        sender: Address,
        options: resources.UnsignForOutdatedBoardMembersInput,
    ): Transaction {
        const outdatedMembersArgs = options.outdatedBoardMembers.map(
            (id) => this.argSerializer.valuesToStrings([new U32Value(id)])[0],
        );

        const dataParts = [
            "unsignForOutdatedBoardMembers",
            this.argSerializer.valuesToStrings([new U32Value(options.actionId)])[0],
            ...outdatedMembersArgs,
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

    /**
     * Performs an action that has reached quorum
     */
    createTransactionForPerformAction(sender: Address, options: resources.ActionInput): Transaction {
        const dataParts = ["performAction", this.argSerializer.valuesToStrings([new U32Value(options.actionId)])[0]];

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: options.multisigContract,
            dataParts: dataParts,
            gasLimit: options.gasLimit,
            addDataMovementGas: false,
        }).build();
    }

    /**
     * Performs all actions in a batch that have reached quorum
     */
    createTransactionForPerformBatch(sender: Address, options: resources.GroupInput): Transaction {
        const dataParts = ["performBatch", this.argSerializer.valuesToStrings([new U32Value(options.groupId)])[0]];

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: options.multisigContract,
            dataParts: dataParts,
            gasLimit: options.gasLimit,
            addDataMovementGas: false,
        }).build();
    }

    /**
     * Discards an action that is no longer needed
     */
    createTransactionForDiscardAction(sender: Address, options: resources.ActionInput): Transaction {
        const dataParts = ["discardAction", this.argSerializer.valuesToStrings([new U32Value(options.actionId)])[0]];

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: options.multisigContract,
            dataParts: dataParts,
            gasLimit: options.gasLimit,
            addDataMovementGas: false,
        }).build();
    }

    /**
     * Discards all actions in the provided list
     */
    createTransactionForDiscardBatch(sender: Address, options: resources.DiscardBatchInput): Transaction {
        const actionIdsArgs = options.actionIds.map((id) => this.argSerializer.valuesToStrings([new U32Value(id)])[0]);

        const dataParts = ["discardBatch", ...actionIdsArgs];

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: options.multisigContract,
            dataParts: dataParts,
            gasLimit: options.gasLimit,
            addDataMovementGas: false,
        }).build();
    }
}
