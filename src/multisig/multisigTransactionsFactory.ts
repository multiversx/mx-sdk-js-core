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
import { Err, IGasLimitEstimator, TokenComputer, TransactionsFactoryConfig } from "../core";
import { Address } from "../core/address";
import { BaseFactory } from "../core/baseFactory";
import { Transaction } from "../core/transaction";
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
export class MultisigTransactionsFactory extends BaseFactory {
    private readonly argSerializer: ArgSerializer;
    private readonly smartContractFactory: SmartContractTransactionsFactory;
    private readonly config: IConfig;
    private readonly abi: Abi;

    constructor(options: { config: TransactionsFactoryConfig; abi: Abi; gasLimitEstimator?: IGasLimitEstimator }) {
        super({ config: options.config, gasLimitEstimator: options.gasLimitEstimator });
        this.config = options.config;
        this.abi = options.abi;
        this.argSerializer = new ArgSerializer();
        this.smartContractFactory = new SmartContractTransactionsFactory(options);
    }

    /**
     * Creates a transaction to deploy a new multisig contract
     */
    async createTransactionForDeploy(
        sender: Address,
        options: resources.DeployMultisigContractInput,
    ): Promise<Transaction> {
        const boardAddresses: AddressValue[] = options.board.map((addr) => new AddressValue(addr));
        const args = [new U32Value(options.quorum), VariadicValue.fromItems(...boardAddresses)];

        return await this.smartContractFactory.createTransactionForDeploy(sender, {
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
    async createTransactionForProposeAddBoardMember(
        sender: Address,
        options: resources.ProposeAddBoardMemberInput,
    ): Promise<Transaction> {
        return await this.smartContractFactory.createTransactionForExecute(sender, {
            contract: options.multisigContract,
            function: "proposeAddBoardMember",
            gasLimit: options.gasLimit,
            arguments: [options.boardMember],
        });
    }

    /**
     * Proposes adding a new proposer
     */
    async createTransactionForProposeAddProposer(
        sender: Address,
        options: resources.ProposeAddProposerInput,
    ): Promise<Transaction> {
        return await this.smartContractFactory.createTransactionForExecute(sender, {
            contract: options.multisigContract,
            function: "proposeAddProposer",
            gasLimit: options.gasLimit,
            arguments: [options.proposer],
        });
    }

    /**
     * Proposes removing a user (board member or proposer)
     */
    async createTransactionForProposeRemoveUser(
        sender: Address,
        options: resources.ProposeRemoveUserInput,
    ): Promise<Transaction> {
        return await this.smartContractFactory.createTransactionForExecute(sender, {
            contract: options.multisigContract,
            function: "proposeRemoveUser",
            gasLimit: options.gasLimit,
            arguments: [options.userAddress],
        });
    }

    /**
     * Proposes changing the quorum (minimum signatures required)
     */
    async createTransactionForProposeChangeQuorum(
        sender: Address,
        options: resources.ProposeChangeQuorumInput,
    ): Promise<Transaction> {
        return await this.smartContractFactory.createTransactionForExecute(sender, {
            contract: options.multisigContract,
            function: "proposeChangeQuorum",
            gasLimit: options.gasLimit,
            arguments: [options.newQuorum],
        });
    }

    /**
     * Proposes a transaction that will transfer EGLD and/or execute a function
     */
    async createTransactionForProposeTransferExecute(
        sender: Address,
        options: resources.ProposeTransferExecuteInput,
    ): Promise<Transaction> {
        const gasOption = new U64Value(options.optGasLimit ?? 0n);
        const input = await ProposeTransferExecuteContractInput.newFromTransferExecuteInput({
            multisig: options.multisigContract,
            to: options.to,
            functionName: options.functionName,
            arguments: options.functionArguments,
            abi: options.abi,
        });

        return await this.smartContractFactory.createTransactionForExecute(sender, {
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
    async createTransactionForDeposit(sender: Address, options: resources.DepositExecuteInput): Promise<Transaction> {
        return await this.smartContractFactory.createTransactionForExecute(sender, {
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
    async createTransactionForProposeTransferExecuteEsdt(
        sender: Address,
        options: resources.ProposeTransferExecuteEsdtInput,
    ): Promise<Transaction> {
        const input = await ProposeTransferExecuteContractInput.newFromTransferExecuteInput({
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

        const transaction = new Transaction({
            sender: sender,
            receiver: options.multisigContract,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, options.gasLimit);

        return transaction;
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
    async createTransactionForProposeAsyncCall(
        sender: Address,
        options: resources.ProposeAsyncCallInput,
    ): Promise<Transaction> {
        const input = await ProposeTransferExecuteContractInput.newFromProposeAsyncCallInput({
            multisig: options.multisigContract,
            to: options.to,
            tokenTransfers: options.tokenTransfers,
            functionName: options.functionName,
            arguments: options.functionArguments,
            abi: options.abi,
        });

        return await this.smartContractFactory.createTransactionForExecute(sender, {
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
    async createTransactionForProposeContractDeployFromSource(
        sender: Address,
        options: resources.ProposeContractDeployFromSourceInput,
    ): Promise<Transaction> {
        let args: TypedValue[] = this.argsToTypedValues(options.arguments, options.abi?.constructorDefinition);
        return await this.smartContractFactory.createTransactionForExecute(sender, {
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
    async createTransactionForProposeContractUpgradeFromSource(
        sender: Address,
        options: resources.ProposeContractUpgradeFromSourceInput,
    ): Promise<Transaction> {
        let args: TypedValue[] = this.argsToTypedValues(options.arguments, options.abi?.constructorDefinition);
        return await this.smartContractFactory.createTransactionForExecute(sender, {
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
    async createTransactionForSignAction(sender: Address, options: resources.ActionInput): Promise<Transaction> {
        return await this.smartContractFactory.createTransactionForExecute(sender, {
            contract: options.multisigContract,
            function: "sign",
            gasLimit: options.gasLimit,
            arguments: [options.actionId],
        });
    }

    /**
     * Signs all actions in a batch
     */
    async createTransactionForSignBatch(sender: Address, options: resources.GroupInput): Promise<Transaction> {
        return await this.smartContractFactory.createTransactionForExecute(sender, {
            contract: options.multisigContract,
            function: "signBatch",
            gasLimit: options.gasLimit,
            arguments: [options.groupId],
        });
    }

    /**
     * Signs and performs an action in one transaction
     */
    async createTransactionForSignAndPerform(sender: Address, options: resources.ActionInput): Promise<Transaction> {
        return await this.smartContractFactory.createTransactionForExecute(sender, {
            contract: options.multisigContract,
            function: "signAndPerform",
            gasLimit: options.gasLimit,
            arguments: [options.actionId],
        });
    }

    /**
     * Signs and performs all actions in a batch
     */
    async createTransactionForSignBatchAndPerform(
        sender: Address,
        options: resources.GroupInput,
    ): Promise<Transaction> {
        return await this.smartContractFactory.createTransactionForExecute(sender, {
            contract: options.multisigContract,
            function: "signBatchAndPerform",
            gasLimit: options.gasLimit,
            arguments: [options.groupId],
        });
    }

    /**
     * Withdraws signature from an action
     */
    async createTransactionForUnsign(sender: Address, options: resources.ActionInput): Promise<Transaction> {
        return await this.smartContractFactory.createTransactionForExecute(sender, {
            contract: options.multisigContract,
            function: "unsign",
            gasLimit: options.gasLimit,
            arguments: [options.actionId],
        });
    }

    /**
     * Withdraws signatures from all actions in a batch
     */
    async createTransactionForUnsignBatch(sender: Address, options: resources.GroupInput): Promise<Transaction> {
        return await this.smartContractFactory.createTransactionForExecute(sender, {
            contract: options.multisigContract,
            function: "unsignBatch",
            gasLimit: options.gasLimit,
            arguments: [options.groupId],
        });
    }

    /**
     * Removes signatures from outdated board members
     */
    async createTransactionForUnsignForOutdatedBoardMembers(
        sender: Address,
        options: resources.UnsignForOutdatedBoardMembersInput,
    ): Promise<Transaction> {
        const outdatedBoardMembers: U32Value[] = options.outdatedBoardMembers.map((id) => new U32Value(id));
        return await this.smartContractFactory.createTransactionForExecute(sender, {
            contract: options.multisigContract,
            function: "unsignForOutdatedBoardMembers",
            gasLimit: options.gasLimit,
            arguments: [new U32Value(options.actionId), VariadicValue.fromItems(...outdatedBoardMembers)],
        });
    }

    /**
     * Performs an action that has reached quorum
     */
    async createTransactionForPerformAction(sender: Address, options: resources.ActionInput): Promise<Transaction> {
        return await this.smartContractFactory.createTransactionForExecute(sender, {
            contract: options.multisigContract,
            function: "performAction",
            gasLimit: options.gasLimit,
            arguments: [options.actionId],
        });
    }

    /**
     * Performs all actions in a batch that have reached quorum
     */
    async createTransactionForPerformBatch(sender: Address, options: resources.GroupInput): Promise<Transaction> {
        return await this.smartContractFactory.createTransactionForExecute(sender, {
            contract: options.multisigContract,
            function: "performBatch",
            gasLimit: options.gasLimit,
            arguments: [options.groupId],
        });
    }

    /**
     * Discards an action that is no longer needed
     */
    async createTransactionForDiscardAction(sender: Address, options: resources.ActionInput): Promise<Transaction> {
        return await this.smartContractFactory.createTransactionForExecute(sender, {
            contract: options.multisigContract,
            function: "discardAction",
            gasLimit: options.gasLimit,
            arguments: [options.actionId],
        });
    }

    /**
     * Discards all actions in the provided list
     */
    async createTransactionForDiscardBatch(
        sender: Address,
        options: resources.DiscardBatchInput,
    ): Promise<Transaction> {
        const actionIdsArgs = options.actionIds.map((id) => new U32Value(id));
        return await this.smartContractFactory.createTransactionForExecute(sender, {
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
