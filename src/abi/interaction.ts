import { Account } from "../accounts";
import { Address } from "../address";
import { Compatibility } from "../compatibility";
import { TRANSACTION_VERSION_DEFAULT } from "../constants";
import { IAddress, IChainID, IGasLimit, IGasPrice, INonce, ITokenTransfer, ITransactionValue } from "../interface";
import { TokenTransfer } from "../tokens";
import { Transaction } from "../transaction";
import { SmartContractTransactionsFactory, TransactionsFactoryConfig } from "../transactionsFactories";
import { ContractFunction } from "./function";
import { InteractionChecker } from "./interactionChecker";
import { CallArguments } from "./interface";
import { Query } from "./query";
import { EndpointDefinition, TypedValue } from "./typesystem";

/**
 * Internal interface: the smart contract, as seen from the perspective of an {@link Interaction}.
 */
interface ISmartContractWithinInteraction {
    call({ func, args, value, gasLimit, receiver }: CallArguments): Transaction;
    getAddress(): IAddress;
    getEndpoint(name: ContractFunction): EndpointDefinition;
}

/**
 * Legacy component. Use "SmartContractTransactionsFactory" (for transactions) or "SmartContractQueriesController" (for queries), instead.
 *
 * Interactions can be seen as mutable transaction & query builders.
 *
 * Aside from building transactions and queries, the interactors are also responsible for interpreting
 * the execution outcome for the objects they've built.
 */
export class Interaction {
    private readonly contract: ISmartContractWithinInteraction;
    private readonly function: ContractFunction;
    private readonly args: TypedValue[];

    private nonce: INonce = 0;
    private value: ITransactionValue = "0";
    private gasLimit: IGasLimit = 0;
    private gasPrice: IGasPrice | undefined = undefined;
    private chainID: IChainID = "";
    private querent: IAddress = Address.empty();
    private explicitReceiver?: IAddress;
    private sender: IAddress = Address.empty();
    private version: number = TRANSACTION_VERSION_DEFAULT;

    private tokenTransfers: TokenTransfer[];

    constructor(contract: ISmartContractWithinInteraction, func: ContractFunction, args: TypedValue[]) {
        this.contract = contract;
        this.function = func;
        this.args = args;
        this.tokenTransfers = [];
    }

    getContractAddress(): IAddress {
        return this.contract.getAddress();
    }

    getFunction(): ContractFunction {
        return this.function;
    }

    getEndpoint(): EndpointDefinition {
        return this.contract.getEndpoint(this.function);
    }

    getArguments(): TypedValue[] {
        return this.args;
    }

    getValue(): ITransactionValue {
        return this.value;
    }

    getTokenTransfers(): ITokenTransfer[] {
        return this.tokenTransfers;
    }

    getGasLimit(): IGasLimit {
        return this.gasLimit;
    }

    getExplicitReceiver(): IAddress | undefined {
        return this.explicitReceiver;
    }

    buildTransaction(): Transaction {
        Compatibility.guardAddressIsSetAndNonZero(
            this.sender,
            "'sender' of interaction",
            "use interaction.withSender()",
        );

        const factoryConfig = new TransactionsFactoryConfig({ chainID: this.chainID.valueOf() });
        const factory = new SmartContractTransactionsFactory({
            config: factoryConfig,
        });

        const transaction = factory.createTransactionForExecute({
            sender: this.sender,
            contract: this.contract.getAddress(),
            function: this.function.valueOf(),
            gasLimit: BigInt(this.gasLimit.valueOf()),
            arguments: this.args,
            nativeTransferAmount: BigInt(this.value.toString()),
            tokenTransfers: this.tokenTransfers,
        });

        transaction.chainID = this.chainID.valueOf();
        transaction.nonce = BigInt(this.nonce.valueOf());
        transaction.version = this.version;

        if (this.gasPrice) {
            transaction.gasPrice = BigInt(this.gasPrice.valueOf());
        }

        return transaction;
    }

    buildQuery(): Query {
        return new Query({
            address: this.contract.getAddress(),
            func: this.function,
            args: this.args,
            // Value will be set using "withValue()".
            value: this.value,
            caller: this.querent,
        });
    }

    withValue(value: ITransactionValue): Interaction {
        this.value = value;
        return this;
    }

    withSingleESDTTransfer(transfer: ITokenTransfer): Interaction {
        this.tokenTransfers = [transfer].map((transfer) => new TokenTransfer(transfer));
        return this;
    }

    withSingleESDTNFTTransfer(transfer: ITokenTransfer): Interaction {
        this.tokenTransfers = [transfer].map((transfer) => new TokenTransfer(transfer));
        return this;
    }

    withMultiESDTNFTTransfer(transfers: ITokenTransfer[]): Interaction {
        this.tokenTransfers = transfers.map((transfer) => new TokenTransfer(transfer));
        return this;
    }

    withGasLimit(gasLimit: IGasLimit): Interaction {
        this.gasLimit = gasLimit;
        return this;
    }

    withGasPrice(gasPrice: IGasPrice): Interaction {
        this.gasPrice = gasPrice;
        return this;
    }

    withNonce(nonce: INonce): Interaction {
        this.nonce = nonce;
        return this;
    }

    useThenIncrementNonceOf(account: Account): Interaction {
        return this.withNonce(account.getNonceThenIncrement());
    }

    withChainID(chainID: IChainID): Interaction {
        this.chainID = chainID;
        return this;
    }

    withSender(sender: IAddress): Interaction {
        this.sender = sender;
        return this;
    }

    withVersion(version: number): Interaction {
        this.version = version;
        return this;
    }

    /**
     * Sets the "caller" field on contract queries.
     */
    withQuerent(querent: IAddress): Interaction {
        this.querent = querent;
        return this;
    }

    withExplicitReceiver(receiver: IAddress): Interaction {
        this.explicitReceiver = receiver;
        return this;
    }

    /**
     * To perform custom checking, extend {@link Interaction} and override this method.
     */
    check(): Interaction {
        new InteractionChecker().checkInteraction(this, this.getEndpoint());
        return this;
    }
}
