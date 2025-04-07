import BigNumber from "bignumber.js";
import * as fs from "fs";
import { Abi } from "../abi";
import {
    Address,
    BaseControllerInput,
    IAccount,
    Transaction,
    TransactionsFactoryConfig,
    TransactionWatcher,
} from "../core";
import { INetworkProvider } from "../networkProviders/interface";
import { SmartContractController } from "../smartContracts";
import { MultisigTransactionsFactory } from "./multisigTransactionFactory";
import { MultisigTransactionsOutcomeParser } from "./multisigTransactionsOutcomeParser";
import * as resources from "./resources";
export class MultisigController extends SmartContractController {
    private transactionAwaiter: TransactionWatcher;
    private multisigFactory: MultisigTransactionsFactory;
    private multisigParser: MultisigTransactionsOutcomeParser;
    private chainId: string;
    private initialized: boolean = false;

    constructor(options: { chainID: string; networkProvider: INetworkProvider }) {
        super(options);
        this.transactionAwaiter = new TransactionWatcher(options.networkProvider);
        this.chainId = options.chainID;
        this.multisigFactory = new MultisigTransactionsFactory({
            config: new TransactionsFactoryConfig({ chainID: options.chainID }),
        });
        this.multisigParser = new MultisigTransactionsOutcomeParser();
    }

    /**
     * Creates a transaction for deploying a new multisig contract
     */
    async createTransactionForMultisigDeploy(
        sender: IAccount,
        nonce: bigint,
        options: resources.DeployMultisigContractInput & BaseControllerInput,
    ): Promise<Transaction> {
        this.ensureInitialized();
        const transaction = this.multisigFactory.createTransactionForMultisigDeploy(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    /**
     * Gets quorum for specific multisig
     */
    async getQuorum(options: { mutisigAddress: string }): Promise<number> {
        await this.initialize();
        const response = await this.query({
            contract: Address.newFromBech32(options.mutisigAddress),
            function: "getQuorum",
            arguments: [],
        });
        return Number(response[0].toString());
    }

    /**
     * Gets number of board members for specific multisig
     */
    async getNumBoardMembers(options: { mutisigAddress: string }): Promise<number> {
        await this.initialize();
        const response = await this.query({
            contract: Address.newFromBech32(options.mutisigAddress),
            function: "getNumBoardMembers",
            arguments: [],
        });

        return Number(response[0].toString());
    }

    /**
     * Gets number of groups for specific multisig
     */
    async getNumGroups(options: { mutisigAddress: string }): Promise<number> {
        await this.initialize();
        const response = await this.query({
            contract: Address.newFromBech32(options.mutisigAddress),
            function: "getNumGroups",
            arguments: [],
        });

        return Number(Buffer.from(response[0]).toString());
    }

    /**
     * Gets number of proposers for specific multisig
     */
    async getNumProposers(options: { mutisigAddress: string }): Promise<number> {
        await this.initialize();
        const response = await this.query({
            contract: Address.newFromBech32(options.mutisigAddress),
            function: "getNumProposers",
            arguments: [],
        });

        return Number(Buffer.from(response[0]).toString());
    }

    /**
     * Gets action group for specific multisig
     */
    async getActionGroup(options: { mutisigAddress: string; groupId: number }): Promise<number[]> {
        await this.initialize();
        const response = await this.query({
            contract: Address.newFromBech32(options.mutisigAddress),
            function: "getActionGroup",
            arguments: [options.groupId],
        });

        return response[0].map((n: BigNumber) => Number(n.toString()));
    }

    /**
     * Gets last group action id specific multisig
     */
    async getLastGroupActionId(options: { mutisigAddress: string }): Promise<number> {
        await this.initialize();
        const response = await this.query({
            contract: Address.newFromBech32(options.mutisigAddress),
            function: "getLastGroupActionId",
            arguments: [],
        });

        return Number(response[0].toString());
    }

    /**
     * Gets last action index specific multisig
     */
    async getActionLastIndex(options: { mutisigAddress: string }): Promise<number> {
        await this.initialize();
        const response = await this.query({
            contract: Address.newFromBech32(options.mutisigAddress),
            function: "getActionLastIndex",
            arguments: [],
        });

        return Number(response[0].toString());
    }

    /**
     * Returns `true` (`1`) if the user has signed the action.
     * Does not check whether or not the user is still a board member and the signature valid.
     */
    async hasSignedAction(options: {
        mutisigAddress: string;
        userAddress: string;
        actionId: number;
    }): Promise<boolean> {
        await this.initialize();
        const response = await this.query({
            contract: Address.newFromBech32(options.mutisigAddress),
            function: "signed",
            arguments: [Address.newFromBech32(options.userAddress), options.actionId],
        });

        return response[0];
    }

    /**
     * Returns `true` (`1`) if `getActionValidSignerCount >= getQuorum`.
     */
    async quorumReached(options: { mutisigAddress: string; actionId: number }): Promise<boolean> {
        await this.initialize();
        const response = await this.query({
            contract: Address.newFromBech32(options.mutisigAddress),
            function: "quorumReached",
            arguments: [options.actionId],
        });

        return response[0];
    }

    /**
     * Lists all users that can sign actions.
     */
    async getAllBoardMembers(options: { mutisigAddress: string }): Promise<string[]> {
        await this.initialize();
        const response = await this.query({
            contract: Address.newFromBech32(options.mutisigAddress),
            function: "getAllBoardMembers",
            arguments: [],
        });

        return response[0].map((address: Address) => address.toBech32());
    }

    /**
     * Lists all proposers that are not board members.
     */
    async getAllProposers(options: { mutisigAddress: string }): Promise<string[]> {
        await this.initialize();
        const response = await this.query({
            contract: Address.newFromBech32(options.mutisigAddress),
            function: "getAllProposers",
            arguments: [],
        });

        return response[0].map((address: Address) => new Address(address).toBech32());
    }
    /**
     *  "Indicates user rights.",
     * `0` = no rights,",
     * `1` = can propose, but not sign,
     * `2` = can propose and sign.
     */
    async getUserRole(options: { mutisigAddress: string; userAddress: string }): Promise<resources.UserRoleEnum> {
        await this.initialize();
        const response = await this.query({
            contract: Address.newFromBech32(options.mutisigAddress),
            function: "userRole",
            arguments: [Address.newFromBech32(options.userAddress)],
        });
        console.log(1111, response);
        const userRole = response[0].valueOf().name as keyof typeof resources.UserRoleEnum;
        return resources.UserRoleEnum[userRole];
    }

    /**
     * Serialized action data of an action with index.
     */
    async getActionData(options: { mutisigAddress: string; actionId: number }): Promise<resources.MultisigAction> {
        await this.initialize();
        const response = await this.query({
            contract: Address.newFromBech32(options.mutisigAddress),
            function: "getActionData",
            arguments: [options.actionId],
        });

        console.log({ res: JSON.stringify(response[0].valueOf()) });
        const result = this.mapResponseToAction(response[0].valueOf());

        return result;
    }

    /**
     * Gets addresses of all users who signed an action.
     * Does not check if those users are still board members or not, so the result may contain invalid signers.
     */
    async getActionSigners(options: { mutisigAddress: string; actionId: number }): Promise<string[]> {
        await this.initialize();
        const response = await this.query({
            contract: Address.newFromBech32(options.mutisigAddress),
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
    async getActionSignerCount(options: { mutisigAddress: string; actionId: number }): Promise<number> {
        await this.initialize();
        const response = await this.query({
            contract: Address.newFromBech32(options.mutisigAddress),
            function: "getActionSignerCount",
            arguments: [options.actionId],
        });

        return response[0];
    }

    /**
     * Gets addresses of all users who signed an action and are still board members.
     * All these signatures are currently valid.
     */
    async getActionValidSignerCount(options: { mutisigAddress: string; actionId: number }): Promise<number> {
        await this.initialize();
        const response = await this.query({
            contract: Address.newFromBech32(options.mutisigAddress),
            function: "getActionValidSignerCount",
            arguments: [options.actionId],
        });

        return Number(Buffer.from(response[0]).toString());
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
     * Awaits the completion of a propose add board member action
     */
    async awaitCompletedProposeAddBoardMember(txHash: string): Promise<number> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.multisigParser.parseActionProposal(transaction);
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
     * Awaits the completion of a propose add proposer action
     */
    async awaitCompletedProposeAddProposer(txHash: string): Promise<number> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.multisigParser.parseActionProposal(transaction);
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
     * Awaits the completion of a propose remove user action
     */
    async awaitCompletedProposeRemoveUser(txHash: string): Promise<number> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.multisigParser.parseActionProposal(transaction);
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

    /**
     * Awaits the completion of a propose change quorum action
     */
    async awaitCompletedProposeChangeQuorum(txHash: string): Promise<number> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.multisigParser.parseActionProposal(transaction);
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
     * Awaits the completion of a sign action
     */
    async awaitCompletedSignAction(txHash: string): Promise<void> {
        await this.transactionAwaiter.awaitCompleted(txHash);
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

    /**
     * Awaits the completion of a perform action
     */
    async awaitCompletedPerformAction(txHash: string): Promise<void> {
        await this.transactionAwaiter.awaitCompleted(txHash);
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
     * Awaits the completion of an unsign action
     */
    async awaitCompletedUnsignAction(txHash: string): Promise<void> {
        await this.transactionAwaiter.awaitCompleted(txHash);
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
     * Awaits the completion of a discard action
     */
    async awaitCompletedDiscardAction(txHash: string): Promise<void> {
        await this.transactionAwaiter.awaitCompleted(txHash);
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
     * Awaits the completion of a propose transfer execute action
     */
    async awaitCompletedProposeTransferExecute(txHash: string): Promise<number> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.multisigParser.parseActionProposal(transaction);
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
     * Awaits the completion of a propose transfer execute ESDT action
     */
    async awaitCompletedProposeTransferExecuteEsdt(txHash: string): Promise<number> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.multisigParser.parseActionProposal(transaction);
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
     * Awaits the completion of a propose async call action
     */
    async awaitCompletedProposeAsyncCall(txHash: string): Promise<number> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.multisigParser.parseActionProposal(transaction);
    }

    /**
     * Creates a transaction for proposing to deploy a smart contract from source
     */
    async createTransactionForProposeSCDeployFromSource(
        sender: IAccount,
        nonce: bigint,
        options: resources.ProposeSCDeployFromSourceInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.multisigFactory.createTransactionForProposeSCDeployFromSource(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    /**
     * Awaits the completion of a propose SC deploy from source action
     */
    async awaitCompletedProposeSCDeployFromSource(txHash: string): Promise<number> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.multisigParser.parseActionProposal(transaction);
    }

    /**
     * Creates a transaction for proposing to upgrade a smart contract from source
     */
    async createTransactionForProposeSCUpgradeFromSource(
        sender: IAccount,
        nonce: bigint,
        options: resources.ProposeSCUpgradeFromSourceInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.multisigFactory.createTransactionForProposeSCUpgradeFromSource(
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
     * Awaits the completion of a propose SC upgrade from source action
     */
    async awaitCompletedProposeSCUpgradeFromSource(txHash: string): Promise<number> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.multisigParser.parseActionProposal(transaction);
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
     * Awaits the completion of a sign batch action
     */
    async awaitCompletedSignBatch(txHash: string): Promise<void> {
        await this.transactionAwaiter.awaitCompleted(txHash);
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
     * Awaits the completion of a sign and perform action
     */
    async awaitCompletedSignAndPerform(txHash: string): Promise<void> {
        await this.transactionAwaiter.awaitCompleted(txHash);
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
     * Awaits the completion of an unsign for outdated board members action
     */
    async awaitCompletedUnsignForOutdatedBoardMembers(txHash: string): Promise<void> {
        await this.transactionAwaiter.awaitCompleted(txHash);
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
     * Awaits the completion of a perform action batch
     */
    async awaitCompletedPerformActionBatch(txHash: string): Promise<void> {
        await this.transactionAwaiter.awaitCompleted(txHash);
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

    /**
     * Awaits the completion of a discard batch action
     */
    async awaitCompletedDiscardBatch(txHash: string): Promise<void> {
        await this.transactionAwaiter.awaitCompleted(txHash);
    }

    /**
     * Initializes the controller by loading the ABI file
     * This must be called before using ABI-dependent methods
     */
    async initialize(abiPath?: string): Promise<void> {
        if (this.initialized) {
            return;
        }

        // Use provided path or default
        const path = abiPath || "src/testdata/multisig-full.abi.json";

        try {
            this.abi = await this.loadAbi(path);

            // Re-initialize the factory with the ABI
            this.multisigFactory = new MultisigTransactionsFactory({
                config: new TransactionsFactoryConfig({
                    chainID: this.chainId,
                }),
                abi: this.abi,
            });

            this.initialized = true;
        } catch (error) {
            throw new Error(`Failed to initialize MultisigController: ${error}`);
        }
    }

    private async loadAbi(abiPath: string): Promise<Abi> {
        try {
            const jsonContent: string = await fs.promises.readFile(abiPath, { encoding: "utf8" });
            const json = JSON.parse(jsonContent);
            return Abi.create(json);
        } catch (error) {
            throw new Error(`Error loading ABI from ${abiPath}: ${error}`);
        }
    }

    // Make sure ABI is loaded before using it
    private ensureInitialized(): void {
        if (!this.initialized) {
            throw new Error("MultisigController not initialized. Call initialize() first.");
        }
    }

    private mapResponseToAction = (responseData: any): resources.MultisigAction => {
        const { name, fields } = responseData;
        console.log({ name });
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
                return new resources.SCDeployFromSource(fields[0]);
            case resources.MultisigActionEnum.SCUpgradeFromSource:
                return new resources.SCUpgradeFromSource(fields[0]);
            default:
                throw new Error(`Unknown action type: ${name}`);
        }
    };
}
