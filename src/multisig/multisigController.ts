import BigNumber from "bignumber.js";
import { Abi } from "../abi";
import {
    Address,
    BaseController,
    BaseControllerInput,
    IAccount,
    Transaction,
    TransactionOnNetwork,
    TransactionsFactoryConfig,
    TransactionWatcher,
} from "../core";
import { INetworkProvider } from "../networkProviders/interface";
import { SmartContractController, SmartContractDeployOutcome } from "../smartContracts";
import { MultisigTransactionsFactory } from "./multisigTransactionsFactory";
import { MultisigTransactionsOutcomeParser } from "./multisigTransactionsOutcomeParser";
import * as resources from "./resources";

export class MultisigController extends BaseController {
    private transactionAwaiter: TransactionWatcher;
    private multisigFactory: MultisigTransactionsFactory;
    private multisigParser: MultisigTransactionsOutcomeParser;
    private smartContractController: SmartContractController;

    constructor(options: { chainID: string; networkProvider: INetworkProvider; abi: Abi }) {
        super();
        this.transactionAwaiter = new TransactionWatcher(options.networkProvider);
        this.multisigFactory = new MultisigTransactionsFactory({
            config: new TransactionsFactoryConfig({ chainID: options.chainID }),
            abi: options.abi,
        });
        this.multisigParser = new MultisigTransactionsOutcomeParser({ abi: options.abi });
        this.smartContractController = new SmartContractController({
            chainID: options.chainID,
            networkProvider: options.networkProvider,
            abi: options.abi,
        });
    }

    /**
     * Creates a transaction for deploying a new multisig contract
     */
    async createTransactionForDeploy(
        sender: IAccount,
        nonce: bigint,
        options: resources.DeployMultisigContractInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.multisigFactory.createTransactionForDeploy(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    parseDeploy(transactionOnNetwork: TransactionOnNetwork): SmartContractDeployOutcome {
        return this.multisigParser.parseDeploy(transactionOnNetwork);
    }

    async awaitCompletedDeploy(txHash: string): Promise<SmartContractDeployOutcome> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parseDeploy(transaction);
    }

    /**
     * Gets quorum for specific multisig
     */
    async getQuorum(options: { multisigAddress: string }): Promise<number> {
        const [value] = await this.smartContractController.query({
            contract: Address.newFromBech32(options.multisigAddress),
            function: "getQuorum",
            arguments: [],
        });
        return Number(value.toString());
    }

    /**
     * Gets number of board members for specific multisig
     */
    async getNumBoardMembers(options: { multisigAddress: string }): Promise<number> {
        const [value] = await this.smartContractController.query({
            contract: Address.newFromBech32(options.multisigAddress),
            function: "getNumBoardMembers",
            arguments: [],
        });
        return Number(value.toString());
    }

    /**
     * Gets number of groups for specific multisig
     */
    async getNumGroups(options: { multisigAddress: string }): Promise<number> {
        const [value] = await this.smartContractController.query({
            contract: Address.newFromBech32(options.multisigAddress),
            function: "getNumGroups",
            arguments: [],
        });

        return Number(value.toString());
    }

    /**
     * Gets number of proposers for specific multisig
     */
    async getNumProposers(options: { multisigAddress: string }): Promise<number> {
        const [value] = await this.smartContractController.query({
            contract: Address.newFromBech32(options.multisigAddress),
            function: "getNumProposers",
            arguments: [],
        });

        return Number(value.toString());
    }

    /**
     * Gets action group for specific multisig
     */
    async getActionGroup(options: { multisigAddress: string; groupId: number }): Promise<number[]> {
        const [value] = await this.smartContractController.query({
            contract: Address.newFromBech32(options.multisigAddress),
            function: "getActionGroup",
            arguments: [options.groupId],
        });

        return value.map((n: BigNumber) => Number(n.toString()));
    }

    /**
     * Gets last group action id specific multisig
     */
    async getLastGroupActionId(options: { multisigAddress: string }): Promise<number> {
        const [value] = await this.smartContractController.query({
            contract: Address.newFromBech32(options.multisigAddress),
            function: "getLastGroupActionId",
            arguments: [],
        });

        return Number(value.toString());
    }

    /**
     * Gets last action index specific multisig
     */
    async getActionLastIndex(options: { multisigAddress: string }): Promise<number> {
        const [value] = await this.smartContractController.query({
            contract: Address.newFromBech32(options.multisigAddress),
            function: "getActionLastIndex",
            arguments: [],
        });

        return Number(value.toString());
    }

    /**
     * Returns `true` (`1`) if the user has signed the action.
     * Does not check whether or not the user is still a board member and the signature valid.
     */
    async hasSignedAction(options: {
        multisigAddress: string;
        userAddress: string;
        actionId: number;
    }): Promise<boolean> {
        const [value] = await this.smartContractController.query({
            contract: Address.newFromBech32(options.multisigAddress),
            function: "signed",
            arguments: [Address.newFromBech32(options.userAddress), options.actionId],
        });

        return value;
    }

    /**
     * Returns `true` (`1`) if `getActionValidSignerCount >= getQuorum`.
     */
    async quorumReached(options: { multisigAddress: string; actionId: number }): Promise<boolean> {
        const [value] = await this.smartContractController.query({
            contract: Address.newFromBech32(options.multisigAddress),
            function: "quorumReached",
            arguments: [options.actionId],
        });

        return value;
    }

    /**
     * Lists all users that can sign actions.
     */
    async getAllBoardMembers(options: { multisigAddress: string }): Promise<string[]> {
        const [value] = await this.smartContractController.query({
            contract: Address.newFromBech32(options.multisigAddress),
            function: "getAllBoardMembers",
            arguments: [],
        });

        return value.map((address: Address) => address?.toBech32());
    }

    /**
     * Lists all proposers that are not board members.
     */
    async getAllProposers(options: { multisigAddress: string }): Promise<string[]> {
        const [value] = await this.smartContractController.query({
            contract: Address.newFromBech32(options.multisigAddress),
            function: "getAllProposers",
            arguments: [],
        });

        return value.map((address: Address) => address?.toBech32());
    }
    /**
     *  "Indicates user rights.",
     * `0` = no rights,",
     * `1` = can propose, but not sign,
     * `2` = can propose and sign.
     */
    async getUserRole(options: { multisigAddress: string; userAddress: string }): Promise<resources.UserRoleEnum> {
        const [value] = await this.smartContractController.query({
            contract: Address.newFromBech32(options.multisigAddress),
            function: "userRole",
            arguments: [Address.newFromBech32(options.userAddress)],
        });
        const userRole = value.valueOf().name as keyof typeof resources.UserRoleEnum;
        return resources.UserRoleEnum[userRole];
    }

    /**
     * Serialized action data of an action with index.
     */
    async getActionData(options: { multisigAddress: string; actionId: number }): Promise<resources.MultisigAction> {
        const [value] = await this.smartContractController.query({
            contract: Address.newFromBech32(options.multisigAddress),
            function: "getActionData",
            arguments: [options.actionId],
        });
        const result = this.mapResponseToAction(value.valueOf());
        return result;
    }

    /**
     * Gets all pending actions.
     */
    async getPendingActionFullInfo(options: { multisigAddress: string }): Promise<resources.FullMultisigAction[]> {
        const [actions] = await this.smartContractController.query({
            contract: Address.newFromBech32(options.multisigAddress),
            function: "getPendingActionFullInfo",
            arguments: [],
        });

        const result: resources.FullMultisigAction[] = [];
        for (let action = 0; action < actions.length; action++) {
            const element = actions[action];
            result.push({
                actionId: Number(element.action_id.toString()),
                groupId: Number(element.group_id.toString()),
                actionData: this.mapResponseToAction(element.action_data.valueOf()),
                signers: element.signers.map((address: Address) => new Address(address)),
            });
        }
        return result;
    }

    /**
     * Gets addresses of all users who signed an action.
     * Does not check if those users are still board members or not, so the result may contain invalid signers.
     */
    async getActionSigners(options: { multisigAddress: string; actionId: number }): Promise<string[]> {
        const response = await this.smartContractController.query({
            contract: Address.newFromBech32(options.multisigAddress),
            function: "getActionSigners",
            arguments: [options.actionId],
        });
        const addresses: any = response.valueOf();
        return addresses[0];
    }

    /**
     * Gets addresses of all users who signed an action and are still board members.
     * All these signatures are currently valid.
     */
    async getActionSignerCount(options: { multisigAddress: string; actionId: number }): Promise<number> {
        const [value] = await this.smartContractController.query({
            contract: Address.newFromBech32(options.multisigAddress),
            function: "getActionSignerCount",
            arguments: [options.actionId],
        });

        return value;
    }

    /**
     * Gets addresses of all users who signed an action and are still board members.
     * All these signatures are currently valid.
     */
    async getActionValidSignerCount(options: { multisigAddress: string; actionId: number }): Promise<number> {
        const [value] = await this.smartContractController.query({
            contract: Address.newFromBech32(options.multisigAddress),
            function: "getActionValidSignerCount",
            arguments: [options.actionId],
        });

        return Number(value.toString());
    }

    /**
     * Creates a transaction for proposing to add a board member
     */
    async createTransactionForProposeAddBoardMember(
        sender: IAccount,
        nonce: bigint,
        options: resources.ProposeAddBoardMemberInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.multisigFactory.createTransactionForProposeAddBoardMember(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    /**
     * Creates a transaction for proposing to add a proposer
     */
    async createTransactionForProposeAddProposer(
        sender: IAccount,
        nonce: bigint,
        options: resources.ProposeAddProposerInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.multisigFactory.createTransactionForProposeAddProposer(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    /**
     * Creates a transaction for proposing to remove a user
     */
    async createTransactionForProposeRemoveUser(
        sender: IAccount,
        nonce: bigint,
        options: resources.ProposeRemoveUserInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.multisigFactory.createTransactionForProposeRemoveUser(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    /**
     * Creates a transaction for proposing to change quorum
     */
    async createTransactionForProposeChangeQuorum(
        sender: IAccount,
        nonce: bigint,
        options: resources.ProposeChangeQuorumInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.multisigFactory.createTransactionForProposeChangeQuorum(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    parseProposeAction(transaction: TransactionOnNetwork): number {
        return this.multisigParser.parseProposeAction(transaction);
    }

    async awaitCompletedProposeAction(txHash: string): Promise<number> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.multisigParser.parseProposeAction(transaction);
    }

    /**
     * Creates a transaction for signing an action
     */
    async createTransactionForSignAction(
        sender: IAccount,
        nonce: bigint,
        options: resources.ActionInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.multisigFactory.createTransactionForSignAction(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    /**
     * Creates a transaction for performing an action
     */
    async createTransactionForPerformAction(
        sender: IAccount,
        nonce: bigint,
        options: resources.ActionInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.multisigFactory.createTransactionForPerformAction(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    parsePerformAction(transaction: TransactionOnNetwork): Address | undefined {
        return this.multisigParser.parsePerformAction(transaction);
    }

    async awaitCompletedPerformAction(txHash: string): Promise<Address | undefined> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.multisigParser.parsePerformAction(transaction);
    }

    /**
     * Creates a transaction for unsigning an action
     */
    async createTransactionForUnsignAction(
        sender: IAccount,
        nonce: bigint,
        options: resources.ActionInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.multisigFactory.createTransactionForUnsign(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    /**
     * Creates a transaction for discarding an action
     */
    async createTransactionForDiscardAction(
        sender: IAccount,
        nonce: bigint,
        options: resources.ActionInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.multisigFactory.createTransactionForDiscardAction(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    /**
     * Creates a transaction for deposit native token or tokens
     */
    async createTransactionForDeposit(
        sender: IAccount,
        nonce: bigint,
        options: resources.DepositExecuteInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.multisigFactory.createTransactionForDeposit(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    /**
     * Creates a transaction for proposing to transfer EGLD and execute a smart contract call
     */
    async createTransactionForProposeTransferExecute(
        sender: IAccount,
        nonce: bigint,
        options: resources.ProposeTransferExecuteInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.multisigFactory.createTransactionForProposeTransferExecute(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    /**
     * Creates a transaction for proposing to transfer ESDT tokens and execute a smart contract call
     */
    async createTransactionForProposeTransferExecuteEsdt(
        sender: IAccount,
        nonce: bigint,
        options: resources.ProposeTransferExecuteEsdtInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.multisigFactory.createTransactionForProposeTransferExecuteEsdt(
            sender.address,
            options,
        );

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    /**
     * Creates a transaction for proposing an async call to another contract
     */
    async createTransactionForProposeAsyncCall(
        sender: IAccount,
        nonce: bigint,
        options: resources.ProposeAsyncCallInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.multisigFactory.createTransactionForProposeAsyncCall(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    /**
     * Creates a transaction for proposing to deploy a smart contract from source
     */
    async createTransactionForProposeContractDeployFromSource(
        sender: IAccount,
        nonce: bigint,
        options: resources.ProposeContractDeployFromSourceInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.multisigFactory.createTransactionForProposeContractDeployFromSource(
            sender.address,
            options,
        );

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    /**
     * Creates a transaction for proposing to upgrade a smart contract from source
     */
    async createTransactionForProposeContractUpgradeFromSource(
        sender: IAccount,
        nonce: bigint,
        options: resources.ProposeContractUpgradeFromSourceInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.multisigFactory.createTransactionForProposeContractUpgradeFromSource(
            sender.address,
            options,
        );

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    /**
     * Creates a transaction for signing a batch of actions
     */
    async createTransactionForSignBatch(
        sender: IAccount,
        nonce: bigint,
        options: resources.GroupInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.multisigFactory.createTransactionForSignBatch(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    /**
     * Creates a transaction for signing and performing an action in one step
     */
    async createTransactionForSignAndPerform(
        sender: IAccount,
        nonce: bigint,
        options: resources.ActionInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.multisigFactory.createTransactionForSignAndPerform(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    /**
     * Creates a transaction for unsigning for outdated board members
     */
    async createTransactionForUnsignForOutdatedBoardMembers(
        sender: IAccount,
        nonce: bigint,
        options: resources.UnsignForOutdatedBoardMembersInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.multisigFactory.createTransactionForUnsignForOutdatedBoardMembers(
            sender.address,
            options,
        );

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    /**
     * Creates a transaction for performing a batch of actions
     */
    async createTransactionForPerformBatch(
        sender: IAccount,
        nonce: bigint,
        options: resources.GroupInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.multisigFactory.createTransactionForPerformBatch(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    /**
     * Creates a transaction for discarding a batch of actions
     */
    async createTransactionForDiscardBatch(
        sender: IAccount,
        nonce: bigint,
        options: resources.DiscardBatchInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.multisigFactory.createTransactionForDiscardBatch(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    private mapResponseToAction = (responseData: any): resources.MultisigAction => {
        const { name, fields } = responseData;
        switch (name) {
            case resources.MultisigActionEnum.Nothing:
                return new resources.MultisigAction();
            case resources.MultisigActionEnum.AddBoardMember:
                return new resources.AddBoardMember(fields[0]);
            case resources.MultisigActionEnum.AddProposer:
                return new resources.AddProposer(fields[0]);
            case resources.MultisigActionEnum.RemoveUser:
                return new resources.RemoveUser(fields[0]);
            case resources.MultisigActionEnum.ChangeQuorum:
                return new resources.ChangeQuorum(fields[0]);
            case resources.MultisigActionEnum.SendTransferExecuteEgld:
                return new resources.SendTransferExecuteEgld(fields[0]);
            case resources.MultisigActionEnum.SendTransferExecuteEsdt:
                return new resources.SendTransferExecuteEsdt(fields[0]);
            case resources.MultisigActionEnum.SendAsyncCall:
                return new resources.SendAsyncCall(fields[0]);
            case resources.MultisigActionEnum.SCDeployFromSource:
                return new resources.SCDeployFromSource(fields);
            case resources.MultisigActionEnum.SCUpgradeFromSource:
                return new resources.SCUpgradeFromSource(fields);
            default:
                throw new Error(`Unknown action type: ${name}`);
        }
    };
}
