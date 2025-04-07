import {
    AddressValue,
    ArgSerializer,
    BigUIntValue,
    ContractFunction,
    EndpointDefinition,
    OptionType,
    OptionValue,
    U32Value,
    U64Type,
    U64Value,
    VariadicValue,
} from "../abi";
import { TransactionsFactoryConfig } from "../core";
import { Address } from "../core/address";
import { CodeMetadata } from "../core/codeMetadata";
import { Transaction } from "../core/transaction";
import { TransactionBuilder } from "../core/transactionBuilder";
import { SmartContractTransactionsFactory } from "../smartContracts";
import * as resources from "./resources";

interface IAbi {
    constructorDefinition: EndpointDefinition;
    upgradeConstructorDefinition?: EndpointDefinition;

    getEndpoint(name: string | ContractFunction): EndpointDefinition;
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
            gasLimit: this.config.gasLimitCreateMultisig,
            nativeTransferAmount,
            isUpgradeable: options.isUpgradeable,
            isReadable: options.isReadable,
            isPayable: options.isPayable,
            isPayableBySmartContract: options.isPayableBySmartContract,
            arguments: args,
        });
    }

    /**
     * Creates a transaction to upgrade a new multisig contract
     */
    createTransactionForMultisigUpgrade(sender: Address, options: resources.UpgradeMultisigContractInput): Transaction {
        return this.createTransactionForUpgrade(sender, {
            bytecode: options.bytecode,
            gasLimit: this.config.gasLimitCreateMultisig,
            isUpgradeable: options.isUpgradeable,
            isReadable: options.isReadable,
            isPayable: options.isPayable,
            isPayableBySmartContract: options.isPayableBySmartContract,
            contract: options.multisigContract,
            arguments: [],
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
            this.argSerializer.valuesToStrings([new AddressValue(options.boardMemberAddress)])[0],
        ];

        const gasLimit = this.config.gasLimitProposeAction + this.config.additionalGasLimitForMultisigOperations;

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: options.multisigContract,
            dataParts: dataParts,
            gasLimit: gasLimit,
            addDataMovementGas: true,
        }).build();
    }

    /**
     * Proposes adding a new proposer
     */
    createTransactionForProposeAddProposer(sender: Address, options: resources.ProposeAddProposerInput): Transaction {
        const dataParts = [
            "proposeAddProposer",
            this.argSerializer.valuesToStrings([new AddressValue(options.proposerAddress)])[0],
        ];

        const gasLimit = this.config.gasLimitProposeAction + this.config.additionalGasLimitForMultisigOperations;

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: options.multisigContract,
            dataParts: dataParts,
            gasLimit: gasLimit,
            addDataMovementGas: true,
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

        const gasLimit = this.config.gasLimitProposeAction + this.config.additionalGasLimitForMultisigOperations;

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: options.multisigContract,
            dataParts: dataParts,
            gasLimit: gasLimit,
            addDataMovementGas: true,
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

        const gasLimit = this.config.gasLimitProposeAction + this.config.additionalGasLimitForMultisigOperations;

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: options.multisigContract,
            dataParts: dataParts,
            gasLimit: gasLimit,
            addDataMovementGas: true,
        }).build();
    }

    /**
     * Proposes a transaction that will transfer EGLD and/or execute a function
     */
    createTransactionForProposeTransferExecute(
        sender: Address,
        options: resources.ProposeTransferExecuteInput,
    ): Transaction {
        const gasOption = new U64Value(options.gasLimit ?? this.config.gasLimitCreateMultisig);
        const input = resources.ProposeTransferExecutInput.newFromTransferExecuteInput({
            multisig: options.multisigContract,
            to: options.to,
            nativeTransferAmount: options.egldAmount,
            tokenTransfers: [],
            functionName: options.functionName,
            arguments: options.functionArguments,
            abi: options.abi,
        });
        const dataParts = [
            "proposeTransferExecute",
            this.argSerializer.valuesToStrings([new AddressValue(options.to)])[0],
            this.argSerializer.valuesToStrings([new BigUIntValue(options.egldAmount)])[0],
            this.argSerializer.valuesToStrings([new OptionValue(new OptionType(new U64Type()), gasOption)])[0],
            ...input.functionCall,
        ];

        const gasLimit = this.config.gasLimitProposeAction + this.config.additionalGasLimitForMultisigOperations;

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: options.multisigContract,
            dataParts: dataParts,
            gasLimit: gasLimit,
            addDataMovementGas: true,
        }).build();
    }

    /**
     * Proposes a transaction that will transfer EGLD and/or execute a function
     */
    createTransactionForDeposit(sender: Address, options: resources.DepositExecuteInput): Transaction {
        console.log(111, options.tokenTransfers.length, { t: options.tokenTransfers });
        return this.createTransactionForExecute(sender, {
            contract: options.multisigContract,
            function: "deposit",
            gasLimit: options.gasLimit ?? 0n,
            arguments: [],
            nativeTransferAmount: options.egldAmount,
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
        const gasOption = new U64Value(options.gasLimit ?? this.config.gasLimitCreateMultisig);

        // Tokens serialization would need a dedicated helper or converter
        const tokensSerialized = this.serializeEsdtTokenPayments(options.tokens);

        const dataParts = [
            "proposeTransferExecuteEsdt",
            this.argSerializer.valuesToStrings([new AddressValue(options.to)])[0],
            tokensSerialized,
            this.argSerializer.valuesToStrings([new OptionValue(new OptionType(new U64Type()), gasOption)])[0],
            ...options.functionName,
        ];

        const gasLimit = this.config.gasLimitProposeAction + this.config.additionalGasLimitForMultisigOperations;

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: options.multisigContract,
            dataParts: dataParts,
            gasLimit: gasLimit,
            addDataMovementGas: true,
        }).build();
    }

    /**
     * Proposes an async call to another contract
     */
    createTransactionForProposeAsyncCall(sender: Address, options: resources.ProposeAsyncCallInput): Transaction {
        const input = resources.ProposeTransferExecutInput.newFromTransferExecuteInput({
            multisig: options.multisigContract,
            to: options.to,
            nativeTransferAmount: options.nativeTransferAmount,
            tokenTransfers: options.tokenTransfers,
            functionName: options.functionName,
            arguments: options.functionArguments,
            abi: options.abi,
        });
        const gasLimit = this.config.gasLimitProposeAction + this.config.additionalGasLimitForMultisigOperations;

        let receiver = options.multisigContract;
        const dataParts = [
            "proposeAsyncCall",
            this.argSerializer.valuesToStrings([new AddressValue(options.to)])[0],
            this.argSerializer.valuesToStrings([new BigUIntValue(options.nativeTransferAmount)])[0],
            this.argSerializer.valuesToStrings([new BigUIntValue(options.optGasLimit ?? 0n)])[0],
            ...input.functionCall,
        ];

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: receiver,
            dataParts: dataParts,
            gasLimit: gasLimit,
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
            this.argSerializer.valuesToStrings([new BigUIntValue(options.amount)])[0],
            this.argSerializer.valuesToStrings([new AddressValue(options.source)])[0],
            this.serializeCodeMetadata(options.codeMetadata),
            ...options.arguments,
        ];

        const gasLimit = this.config.gasLimitProposeAction + this.config.additionalGasLimitForMultisigOperations;

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: options.multisigContract,
            dataParts: dataParts,
            gasLimit: gasLimit,
            addDataMovementGas: true,
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
            this.argSerializer.valuesToStrings([new AddressValue(options.scAddress)])[0],
            this.argSerializer.valuesToStrings([new BigUIntValue(options.amount)])[0],
            this.argSerializer.valuesToStrings([new AddressValue(options.source)])[0],
            this.serializeCodeMetadata(options.codeMetadata),
            ...options.arguments,
        ];

        const gasLimit = this.config.gasLimitProposeAction + this.config.additionalGasLimitForMultisigOperations;

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: options.multisigContract,
            dataParts: dataParts,
            gasLimit: gasLimit,
            addDataMovementGas: true,
        }).build();
    }

    /**
     * Signs an action (by a board member)
     */
    createTransactionForSignAction(sender: Address, options: resources.ActionInput): Transaction {
        const dataParts = ["sign", this.argSerializer.valuesToStrings([new U32Value(options.actionId)])[0]];

        const gasLimit = this.config.gasLimitSignAction + this.config.additionalGasLimitForMultisigOperations;

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: options.multisigContract,
            dataParts: dataParts,
            gasLimit: gasLimit,
            addDataMovementGas: true,
        }).build();
    }

    /**
     * Signs all actions in a batch
     */
    createTransactionForSignBatch(sender: Address, options: resources.GroupInput): Transaction {
        const dataParts = ["signBatch", this.argSerializer.valuesToStrings([new U32Value(options.groupId)])[0]];

        const gasLimit =
            this.config.gasLimitSignAction +
            this.config.gasLimitPerBatchAction +
            this.config.additionalGasLimitForMultisigOperations;

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: options.multisigContract,
            dataParts: dataParts,
            gasLimit: gasLimit,
            addDataMovementGas: true,
        }).build();
    }

    /**
     * Signs and performs an action in one transaction
     */
    createTransactionForSignAndPerform(sender: Address, options: resources.ActionInput): Transaction {
        const dataParts = ["signAndPerform", this.argSerializer.valuesToStrings([new U32Value(options.actionId)])[0]];

        const gasLimit =
            this.config.gasLimitSignAction +
            this.config.gasLimitPerformAction +
            this.config.additionalGasLimitForMultisigOperations;

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: options.multisigContract,
            dataParts: dataParts,
            gasLimit: gasLimit,
            addDataMovementGas: true,
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

        const gasLimit =
            this.config.gasLimitSignAction +
            this.config.gasLimitPerformAction +
            this.config.gasLimitPerBatchAction +
            this.config.additionalGasLimitForMultisigOperations;

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: options.multisigContract,
            dataParts: dataParts,
            gasLimit: gasLimit,
            addDataMovementGas: true,
        }).build();
    }

    /**
     * Withdraws signature from an action
     */
    createTransactionForUnsign(sender: Address, options: resources.ActionInput): Transaction {
        const dataParts = ["unsign", this.argSerializer.valuesToStrings([new U32Value(options.actionId)])[0]];

        const gasLimit = this.config.gasLimitMultisigOperations + this.config.additionalGasLimitForMultisigOperations;

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: options.multisigContract,
            dataParts: dataParts,
            gasLimit: gasLimit,
            addDataMovementGas: true,
        }).build();
    }

    /**
     * Withdraws signatures from all actions in a batch
     */
    createTransactionForUnsignBatch(sender: Address, options: resources.GroupInput): Transaction {
        const dataParts = ["unsignBatch", this.argSerializer.valuesToStrings([new U32Value(options.groupId)])[0]];

        const gasLimit =
            this.config.gasLimitMultisigOperations +
            this.config.gasLimitPerBatchAction +
            this.config.additionalGasLimitForMultisigOperations;

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: options.multisigContract,
            dataParts: dataParts,
            gasLimit: gasLimit,
            addDataMovementGas: true,
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

        const gasLimit = this.config.gasLimitMultisigOperations + this.config.additionalGasLimitForMultisigOperations;

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: options.multisigContract,
            dataParts: dataParts,
            gasLimit: gasLimit,
            addDataMovementGas: true,
        }).build();
    }

    /**
     * Performs an action that has reached quorum
     */
    createTransactionForPerformAction(sender: Address, options: resources.ActionInput): Transaction {
        const dataParts = ["performAction", this.argSerializer.valuesToStrings([new U32Value(options.actionId)])[0]];

        const gasLimit = this.config.gasLimitPerformAction + this.config.additionalGasLimitForMultisigOperations;

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: options.multisigContract,
            dataParts: dataParts,
            gasLimit: gasLimit,
            addDataMovementGas: true,
        }).build();
    }

    /**
     * Performs all actions in a batch that have reached quorum
     */
    createTransactionForPerformBatch(sender: Address, options: resources.GroupInput): Transaction {
        const dataParts = ["performBatch", this.argSerializer.valuesToStrings([new U32Value(options.groupId)])[0]];

        const gasLimit =
            this.config.gasLimitPerformAction +
            this.config.gasLimitPerBatchAction +
            this.config.additionalGasLimitForMultisigOperations;

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: options.multisigContract,
            dataParts: dataParts,
            gasLimit: gasLimit,
            addDataMovementGas: true,
        }).build();
    }

    /**
     * Discards an action that is no longer needed
     */
    createTransactionForDiscardAction(sender: Address, options: resources.ActionInput): Transaction {
        const dataParts = ["discardAction", this.argSerializer.valuesToStrings([new U32Value(options.actionId)])[0]];

        const gasLimit = this.config.gasLimitMultisigOperations + this.config.additionalGasLimitForMultisigOperations;

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: options.multisigContract,
            dataParts: dataParts,
            gasLimit: gasLimit,
            addDataMovementGas: true,
        }).build();
    }

    /**
     * Discards all actions in the provided list
     */
    createTransactionForDiscardBatch(sender: Address, options: resources.DiscardBatchInput): Transaction {
        const actionIdsArgs = options.actionIds.map((id) => this.argSerializer.valuesToStrings([new U32Value(id)])[0]);

        const dataParts = ["discardBatch", ...actionIdsArgs];

        const gasLimit =
            this.config.gasLimitMultisigOperations +
            this.config.gasLimitPerBatchAction +
            this.config.additionalGasLimitForMultisigOperations;

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: options.multisigContract,
            dataParts: dataParts,
            gasLimit: gasLimit,
            addDataMovementGas: true,
        }).build();
    }

    /**
     * Helper method to serialize ESDT token payments
     */
    private serializeEsdtTokenPayments(_tokens: any[]): string {
        // This is a placeholder - the actual implementation would depend on your SDK's
        // serialization format for lists of EsdtTokenPayment objects
        return "serialized_tokens";
    }

    /**
     * Helper method to serialize CodeMetadata
     */
    private serializeCodeMetadata(_metadata: CodeMetadata): string {
        // This is a placeholder - the actual implementation would depend on your SDK's
        // serialization format for CodeMetadata
        return "serialized_metadata";
    }
}
