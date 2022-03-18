import { Balance } from "../balance";
import { GasLimit } from "../networkParams";
import { Transaction } from "../transaction";
import { Query } from "./query";
import { QueryResponse } from "./queryResponse";
import { ContractFunction } from "./function";
import { Address } from "../address";
import { SmartContract } from "./smartContract";
import { AddressValue, BigUIntValue, BytesValue, EndpointDefinition, TypedValue, U64Value, U8Value } from "./typesystem";
import { Nonce } from "../nonce";
import { QueryResponseBundle } from "./interface";
import { NetworkConfig } from "../networkConfig";
import { ESDTNFT_TRANSFER_FUNCTION_NAME, ESDT_TRANSFER_FUNCTION_NAME, MULTI_ESDTNFT_TRANSFER_FUNCTION_NAME } from "../constants";
import { InteractionChecker } from "./interactionChecker";
import { Account } from "../account";

/**
 * Interactions can be seen as mutable transaction & query builders.
 * 
 * Aside from building transactions and queries, the interactors are also responsible for interpreting
 * the execution outcome for the objects they've built.
 */
export class Interaction {
    private readonly checker: InteractionChecker;
    private readonly contract: SmartContract;
    private readonly function: ContractFunction;
    private readonly args: TypedValue[];
    private readonly receiver?: Address;

    private nonce: Nonce = new Nonce(0);
    private value: Balance = Balance.Zero();
    private gasLimit: GasLimit = GasLimit.min();
    private querent: Address = new Address();

    private isWithSingleESDTTransfer: boolean = false;
    private isWithSingleESDTNFTTransfer: boolean = false;
    private isWithMultiESDTNFTTransfer: boolean = false;
    private tokenTransfers: TokenTransfersWithinInteraction;
    private tokenTransfersSender: Address = new Address();

    constructor(
        contract: SmartContract,
        func: ContractFunction,
        args: TypedValue[],
        receiver?: Address,
    ) {
        this.checker = new InteractionChecker();
        this.contract = contract;
        this.function = func;
        this.args = args;
        this.receiver = receiver;
        this.tokenTransfers = new TokenTransfersWithinInteraction([], this);
    }

    getContract(): SmartContract {
        return this.contract;
    }

    getFunction(): ContractFunction {
        return this.function;
    }

    getArguments(): TypedValue[] {
        return this.args;
    }

    getValue(): Balance {
        return this.value;
    }

    getTokenTransfers(): Balance[] {
        return this.tokenTransfers.getTransfers();
    }

    getGasLimit(): GasLimit {
        return this.gasLimit;
    }

    buildTransaction(): Transaction {
        let receiver = this.receiver;
        let func: ContractFunction = this.function;
        let args = this.args;

        if (this.isWithSingleESDTTransfer) {
            func = new ContractFunction(ESDT_TRANSFER_FUNCTION_NAME);
            args = this.tokenTransfers.buildArgsForSingleESDTTransfer();
        } else if (this.isWithSingleESDTNFTTransfer) {
            // For NFT, SFT and MetaESDT, transaction.sender == transaction.receiver.
            receiver = this.tokenTransfersSender;
            func = new ContractFunction(ESDTNFT_TRANSFER_FUNCTION_NAME);
            args = this.tokenTransfers.buildArgsForSingleESDTNFTTransfer();
        } else if (this.isWithMultiESDTNFTTransfer) {
            // For NFT, SFT and MetaESDT, transaction.sender == transaction.receiver.
            receiver = this.tokenTransfersSender;
            func = new ContractFunction(MULTI_ESDTNFT_TRANSFER_FUNCTION_NAME);
            args = this.tokenTransfers.buildArgsForMultiESDTNFTTransfer();
        }

        // TODO: create as "deploy" transaction if the function is "init" (or find a better pattern for deployments).
        let transaction = this.contract.call({
            func: func,
            // GasLimit will be set using "withGasLimit()".
            gasLimit: this.gasLimit,
            args: args,
            // Value will be set using "withValue()".
            value: this.value,
            receiver: receiver,
        });

        transaction.setNonce(this.nonce);
        return transaction;
    }

    buildQuery(): Query {
        return new Query({
            address: this.contract.getAddress(),
            func: this.function,
            args: this.args,
            // Value will be set using "withValue()".
            value: this.value,
            caller: this.querent
        });
    }

    /**
     * Interprets the raw outcome of a Smart Contract query.
     * The outcome is structured such that it allows quick access to each level of detail.
     */
    interpretQueryResponse(queryResponse: QueryResponse): QueryResponseBundle {
        let endpoint = this.getEndpoint();
        queryResponse.setEndpointDefinition(endpoint);

        let values = queryResponse.outputTyped();
        let returnCode = queryResponse.returnCode;

        return {
            queryResponse: queryResponse,
            values: values,
            firstValue: values[0],
            returnCode: returnCode
        };
    }

    withValue(value: Balance): Interaction {
        this.value = value;
        return this;
    }

    withSingleESDTTransfer(transfer: Balance): Interaction {
        this.isWithSingleESDTTransfer = true;
        this.tokenTransfers = new TokenTransfersWithinInteraction([transfer], this);
        return this;
    }

    withSingleESDTNFTTransfer(transfer: Balance, sender: Address) {
        this.isWithSingleESDTNFTTransfer = true;
        this.tokenTransfers = new TokenTransfersWithinInteraction([transfer], this);
        this.tokenTransfersSender = sender;
        return this;
    }

    withMultiESDTNFTTransfer(transfers: Balance[], sender: Address) {
        this.isWithMultiESDTNFTTransfer = true;
        this.tokenTransfers = new TokenTransfersWithinInteraction(transfers, this);
        this.tokenTransfersSender = sender;
        return this;
    }

    withGasLimit(gasLimit: GasLimit): Interaction {
        this.gasLimit = gasLimit;
        return this;
    }

    withGasLimitComponents(args: { minGasLimit?: number, gasPerDataByte?: number, estimatedExecutionComponent: number }): Interaction {
        let minGasLimit = args.minGasLimit || NetworkConfig.getDefault().MinGasLimit.valueOf();
        let gasPerDataByte = args.gasPerDataByte || NetworkConfig.getDefault().GasPerDataByte;

        let transaction = this.buildTransaction();
        let dataLength = transaction.getData().length();
        let movementComponent = new GasLimit(minGasLimit + gasPerDataByte * dataLength);
        let executionComponent = new GasLimit(args.estimatedExecutionComponent);
        let gasLimit = movementComponent.add(executionComponent);

        return this.withGasLimit(gasLimit);
    }

    withNonce(nonce: Nonce): Interaction {
        this.nonce = nonce;
        return this;
    }

    useThenIncrementNonceOf(account: Account) : Interaction {
        return this.withNonce(account.getNonceThenIncrement());
    }

    /**
     * Sets the "caller" field on contract queries.
     */
    withQuerent(querent: Address): Interaction {
        this.querent = querent;
        return this;
    }

    /**
     * Checks the prepared interaction against the ABI endpoint definition.
     * This function throws if type mismatches (provided vs. ABI) are encountered.
     * 
     * When the ABI is available, it is always recommended to call {@link check} before
     * {@link buildTransaction}.
     */
    check(): Interaction {
        this.checker.checkInteraction(this);
        return this;
    }

    getEndpoint(): EndpointDefinition {
        return this.getContract().getAbi().getEndpoint(this.getFunction());
    }
}

class TokenTransfersWithinInteraction {
    private readonly transfers: Balance[];
    private readonly interaction: Interaction;

    constructor(transfers: Balance[], interaction: Interaction) {
        this.transfers = transfers;
        this.interaction = interaction;
    }

    getTransfers() {
        return this.transfers;
    }

    buildArgsForSingleESDTTransfer(): TypedValue[] {
        let singleTransfer = this.transfers[0];

        return [
            this.getTypedTokenIdentifier(singleTransfer),
            this.getTypedTokenQuantity(singleTransfer),
            this.getTypedInteractionFunction(),
            ...this.getInteractionArguments()
        ];
    }

    buildArgsForSingleESDTNFTTransfer(): TypedValue[] {
        let singleTransfer = this.transfers[0];

        return [
            this.getTypedTokenIdentifier(singleTransfer),
            this.getTypedTokenNonce(singleTransfer),
            this.getTypedTokenQuantity(singleTransfer),
            this.getTypedTokensReceiver(),
            this.getTypedInteractionFunction(),
            ...this.getInteractionArguments()
        ];
    }

    buildArgsForMultiESDTNFTTransfer(): TypedValue[] {
        let result: TypedValue[] = [];

        result.push(this.getTypedTokensReceiver());
        result.push(this.getTypedNumberOfTransfers());

        for (const transfer of this.transfers) {
            result.push(this.getTypedTokenIdentifier(transfer));
            result.push(this.getTypedTokenNonce(transfer));
            result.push(this.getTypedTokenQuantity(transfer));
        }

        result.push(this.getTypedInteractionFunction());
        result.push(...this.getInteractionArguments());

        return result;
    }

    private getTypedNumberOfTransfers(): TypedValue {
        return new U8Value(this.transfers.length);
    }

    private getTypedTokenIdentifier(transfer: Balance): TypedValue {
        // Important: for NFTs, this has to be the "collection" name, actually.
        // We will reconsider adding the field "collection" on "Token" upon merging "ApiProvider" and "ProxyProvider".
        return BytesValue.fromUTF8(transfer.token.identifier);
    }

    private getTypedTokenNonce(transfer: Balance): TypedValue {
        // The token nonce (creation nonce)
        return new U64Value(transfer.getNonce())
    }

    private getTypedTokenQuantity(transfer: Balance): TypedValue {
        // For NFTs, this will be 1.
        return new BigUIntValue(transfer.valueOf());
    }

    private getTypedTokensReceiver(): TypedValue {
        // The actual receiver of the token(s): the contract
        return new AddressValue(this.interaction.getContract().getAddress());
    }

    private getTypedInteractionFunction(): TypedValue {
        return BytesValue.fromUTF8(this.interaction.getFunction().valueOf())
    }

    private getInteractionArguments(): TypedValue[] {
        return this.interaction.getArguments();
    }
}
