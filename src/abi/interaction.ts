import { Account } from "../accounts";
import { Address } from "../core/address";
import { Compatibility } from "../core/compatibility";
import { TRANSACTION_VERSION_DEFAULT } from "../core/constants";
import { TokenTransfer } from "../core/tokens";
import { Transaction } from "../core/transaction";
import { TransactionsFactoryConfig } from "../core/transactionsFactoryConfig";
import { SmartContractTransactionsFactory } from "../smartContracts";
import { ContractFunction } from "./function";
import { CallArguments } from "./interface";
import { Query } from "./query";
import { EndpointDefinition, TypedValue } from "./typesystem";

/**
 * Internal interface: the smart contract, as seen from the perspective of an {@link Interaction}.
 */
interface ISmartContractWithinInteraction {
    call({ func, args, value, gasLimit, receiver }: CallArguments): Transaction;
    getAddress(): Address;
    getEndpoint(name: ContractFunction): EndpointDefinition;
}

/**
 * @deprecated component. Use "SmartContractTransactionsFactory" or "SmartContractController", instead.
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

    private nonce: bigint = 0n;
    private value: bigint = 0n;
    private gasLimit: bigint = 0n;
    private gasPrice: bigint | undefined = undefined;
    private chainID: string = "";
    private querent: Address = Address.empty();
    private explicitReceiver?: Address;
    private sender: Address = Address.empty();
    private version: number = TRANSACTION_VERSION_DEFAULT;

    private tokenTransfers: TokenTransfer[];

    constructor(contract: ISmartContractWithinInteraction, func: ContractFunction, args: TypedValue[]) {
        this.contract = contract;
        this.function = func;
        this.args = args;
        this.tokenTransfers = [];
    }

    getContractAddress(): Address {
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

    getValue(): bigint {
        return this.value;
    }

    getTokenTransfers(): TokenTransfer[] {
        return this.tokenTransfers;
    }

    getGasLimit(): bigint {
        return this.gasLimit;
    }

    getExplicitReceiver(): Address | undefined {
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

        const transaction = factory.createTransactionForExecute(this.sender, {
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

    withValue(value: bigint): Interaction {
        this.value = value;
        return this;
    }

    withSingleESDTTransfer(transfer: TokenTransfer): Interaction {
        this.tokenTransfers = [transfer].map((transfer) => new TokenTransfer(transfer));
        return this;
    }

    withSingleESDTNFTTransfer(transfer: TokenTransfer): Interaction {
        this.tokenTransfers = [transfer].map((transfer) => new TokenTransfer(transfer));
        return this;
    }

    withMultiESDTNFTTransfer(transfers: TokenTransfer[]): Interaction {
        this.tokenTransfers = transfers.map((transfer) => new TokenTransfer(transfer));
        return this;
    }

    withGasLimit(gasLimit: bigint): Interaction {
        this.gasLimit = gasLimit;
        return this;
    }

    withGasPrice(gasPrice: bigint): Interaction {
        this.gasPrice = gasPrice;
        return this;
    }

    withNonce(nonce: bigint): Interaction {
        this.nonce = nonce;
        return this;
    }

    useThenIncrementNonceOf(account: Account): Interaction {
        return this.withNonce(account.getNonceThenIncrement());
    }

    withChainID(chainID: string): Interaction {
        this.chainID = chainID;
        return this;
    }

    withSender(sender: Address): Interaction {
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
    withQuerent(querent: Address): Interaction {
        this.querent = querent;
        return this;
    }

    withExplicitReceiver(receiver: Address): Interaction {
        this.explicitReceiver = receiver;
        return this;
    }
}
