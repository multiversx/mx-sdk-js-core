import { Err, ErrBadUsage } from "../errors";
import {
    IAddress,
    IChainID,
    IGasLimit,
    IGasPrice,
    INonce,
    ITokenTransfer,
    ITransactionPayload,
    ITransactionValue,
} from "../interface";
import {
    AddressValue,
    ArgSerializer,
    BigUIntValue,
    BytesValue,
    TypedValue,
    U16Value,
    U64Value,
} from "../smartcontracts";
import { NextTokenTransfer, Token } from "../tokens";
import { Transaction } from "../transaction";
import { TransactionPayload } from "../transactionPayload";
import { TokenTransfersDataBuilder } from "./tokenTransfersDataBuilder";
import { TransactionBuilder } from "./transactionBuilder";

const ADDITIONAL_GAS_FOR_ESDT_TRANSFER = 100000;
const ADDITIONAL_GAS_FOR_ESDT_NFT_TRANSFER = 800000;

interface IConfig {
    chainID: string;
    minGasLimit: bigint;
    gasLimitPerByte: bigint;
    gasLimitESDTTransfer: bigint;
    gasLimitESDTNFTTransfer: bigint;
    gasLimitMultiESDTNFTTransfer: bigint;
}

interface ITokenComputer {
    isFungible(token: Token): boolean;
}

interface IGasEstimator {
    forEGLDTransfer(dataLength: number): number;
    forESDTTransfer(dataLength: number): number;
    forESDTNFTTransfer(dataLength: number): number;
    forMultiESDTNFTTransfer(dataLength: number, numTransfers: number): number;
}

/**
 * Use this class to create transactions for native token transfers (EGLD) or custom tokens transfers (ESDT/NTF/MetaESDT).
 * This name is only temporary, the class will be renamed to `TransferTransactionsFactory`.
 */
export class TransferTransactionsFactory {
    private readonly config?: IConfig;
    private readonly dataArgsBuilder?: TokenTransfersDataBuilder;
    private readonly tokenComputer?: ITokenComputer;
    private readonly gasEstimator?: IGasEstimator;

    constructor(options: IGasEstimator | { config: IConfig; tokenComputer: ITokenComputer }) {
        if (this.isGasEstimator(options)) {
            this.gasEstimator = options;
        } else {
            this.config = options.config;
            this.tokenComputer = options.tokenComputer;
            this.dataArgsBuilder = new TokenTransfersDataBuilder();
        }
    }

    private isGasEstimator(options: any): options is IGasEstimator {
        return (
            typeof options === "object" &&
            typeof options.forEGLDTransfer === "function" &&
            typeof options.forESDTTransfer === "function" &&
            typeof options.forESDTNFTTransfer === "function" &&
            typeof options.forMultiESDTNFTTransfer === "function"
        );
    }

    private isGasEstimatorDefined(): boolean {
        if (this.gasEstimator === undefined) {
            return false;
        }
        return this.isGasEstimator(this.gasEstimator);
    }

    private ensureMembersAreDefined() {
        if (this.config === undefined) {
            throw new Err("'config' is not defined");
        }

        if (this.dataArgsBuilder === undefined) {
            throw new Err("`dataArgsBuilder is not defined`");
        }

        if (this.tokenComputer === undefined) {
            throw new Err("`tokenComputer is not defined`");
        }
    }

    createTransactionForNativeTokenTransfer(options: {
        sender: IAddress;
        receiver: IAddress;
        nativeAmount: bigint;
        data?: string;
    }): Transaction {
        this.ensureMembersAreDefined();

        const data = options.data || "";

        return new TransactionBuilder({
            config: this.config!,
            sender: options.sender,
            receiver: options.receiver,
            dataParts: [data],
            gasLimit: 0n,
            addDataMovementGas: true,
            amount: options.nativeAmount,
        }).build();
    }

    createTransactionForESDTTokenTransfer(options: {
        sender: IAddress;
        receiver: IAddress;
        tokenTransfers: NextTokenTransfer[];
    }): Transaction {
        this.ensureMembersAreDefined();

        const numberOfTransfers = options.tokenTransfers.length;

        if (numberOfTransfers === 0) {
            throw new ErrBadUsage("No token transfer has been provided");
        }

        if (numberOfTransfers === 1) {
            return this.createSingleESDTTransferDraft(options);
        }

        const transferArgs = this.dataArgsBuilder!.buildArgsForMultiESDTNFTTransfer(
            options.receiver,
            options.tokenTransfers,
        );

        const extraGasForTransfer =
            this.config!.gasLimitMultiESDTNFTTransfer * BigInt(numberOfTransfers) +
            BigInt(ADDITIONAL_GAS_FOR_ESDT_NFT_TRANSFER);

        return new TransactionBuilder({
            config: this.config!,
            sender: options.sender,
            receiver: options.sender,
            dataParts: transferArgs,
            gasLimit: extraGasForTransfer,
            addDataMovementGas: true,
        }).build();
    }

    createEGLDTransfer(args: {
        nonce?: INonce;
        value: ITransactionValue;
        receiver: IAddress;
        sender: IAddress;
        gasPrice?: IGasPrice;
        gasLimit?: IGasLimit;
        data?: ITransactionPayload;
        chainID: IChainID;
    }) {
        if (!this.isGasEstimatorDefined()) {
            throw new Err("`gasEstimator` is not defined. Instantiate the factory using the gasEstimator.");
        }

        const dataLength = args.data?.length() || 0;
        const estimatedGasLimit = this.gasEstimator!.forEGLDTransfer(dataLength);

        return new Transaction({
            nonce: args.nonce,
            value: args.value,
            receiver: args.receiver,
            sender: args.sender,
            gasPrice: args.gasPrice,
            gasLimit: args.gasLimit || estimatedGasLimit,
            data: args.data,
            chainID: args.chainID,
        });
    }

    createESDTTransfer(args: {
        tokenTransfer: ITokenTransfer;
        nonce?: INonce;
        receiver: IAddress;
        sender: IAddress;
        gasPrice?: IGasPrice;
        gasLimit?: IGasLimit;
        chainID: IChainID;
    }) {
        if (!this.isGasEstimatorDefined()) {
            throw new Err("`gasEstimator` is not defined. Instantiate the factory using the gasEstimator.");
        }

        const { argumentsString } = new ArgSerializer().valuesToString([
            // The token identifier
            BytesValue.fromUTF8(args.tokenTransfer.tokenIdentifier),
            // The transfered amount
            new BigUIntValue(args.tokenTransfer.valueOf()),
        ]);

        const data = `ESDTTransfer@${argumentsString}`;
        const transactionPayload = new TransactionPayload(data);
        const dataLength = transactionPayload.length() || 0;
        const estimatedGasLimit = this.gasEstimator!.forESDTTransfer(dataLength);

        return new Transaction({
            nonce: args.nonce,
            receiver: args.receiver,
            sender: args.sender,
            gasPrice: args.gasPrice,
            gasLimit: args.gasLimit || estimatedGasLimit,
            data: transactionPayload,
            chainID: args.chainID,
        });
    }

    createESDTNFTTransfer(args: {
        tokenTransfer: ITokenTransfer;
        nonce?: INonce;
        destination: IAddress;
        sender: IAddress;
        gasPrice?: IGasPrice;
        gasLimit?: IGasLimit;
        chainID: IChainID;
    }) {
        if (!this.isGasEstimatorDefined()) {
            throw new Err("`gasEstimator` is not defined. Instantiate the factory using the gasEstimator.");
        }

        const { argumentsString } = new ArgSerializer().valuesToString([
            // The token identifier
            BytesValue.fromUTF8(args.tokenTransfer.tokenIdentifier),
            // The nonce of the token
            new U64Value(args.tokenTransfer.nonce),
            // The transferred quantity
            new BigUIntValue(args.tokenTransfer.valueOf()),
            // The destination address
            new AddressValue(args.destination),
        ]);

        const data = `ESDTNFTTransfer@${argumentsString}`;
        const transactionPayload = new TransactionPayload(data);
        const dataLength = transactionPayload.length() || 0;
        const estimatedGasLimit = this.gasEstimator!.forESDTNFTTransfer(dataLength);

        return new Transaction({
            nonce: args.nonce,
            receiver: args.sender,
            sender: args.sender,
            gasPrice: args.gasPrice,
            gasLimit: args.gasLimit || estimatedGasLimit,
            data: transactionPayload,
            chainID: args.chainID,
        });
    }

    createMultiESDTNFTTransfer(args: {
        tokenTransfers: ITokenTransfer[];
        nonce?: INonce;
        destination: IAddress;
        sender: IAddress;
        gasPrice?: IGasPrice;
        gasLimit?: IGasLimit;
        chainID: IChainID;
    }) {
        if (!this.isGasEstimatorDefined()) {
            throw new Err("`gasEstimator` is not defined. Instantiate the factory using the gasEstimator.");
        }

        const parts: TypedValue[] = [
            // The destination address
            new AddressValue(args.destination),
            // Number of tokens
            new U16Value(args.tokenTransfers.length),
        ];

        for (const payment of args.tokenTransfers) {
            parts.push(
                ...[
                    // The token identifier
                    BytesValue.fromUTF8(payment.tokenIdentifier),
                    // The nonce of the token
                    new U64Value(payment.nonce),
                    // The transfered quantity
                    new BigUIntValue(payment.valueOf()),
                ],
            );
        }

        const { argumentsString } = new ArgSerializer().valuesToString(parts);
        const data = `MultiESDTNFTTransfer@${argumentsString}`;
        const transactionPayload = new TransactionPayload(data);
        const dataLength = transactionPayload.length() || 0;
        const estimatedGasLimit = this.gasEstimator!.forMultiESDTNFTTransfer(dataLength, args.tokenTransfers.length);

        return new Transaction({
            nonce: args.nonce,
            receiver: args.sender,
            sender: args.sender,
            gasPrice: args.gasPrice,
            gasLimit: args.gasLimit || estimatedGasLimit,
            data: transactionPayload,
            chainID: args.chainID,
        });
    }

    private createSingleESDTTransferDraft(options: {
        sender: IAddress;
        receiver: IAddress;
        tokenTransfers: NextTokenTransfer[];
    }): Transaction {
        this.ensureMembersAreDefined();

        let transferArgs: string[] = [];
        const transfer = options.tokenTransfers[0];
        let extraGasForTransfer = 0n;
        let receiver = options.receiver;

        if (this.tokenComputer!.isFungible(transfer.token)) {
            transferArgs = this.dataArgsBuilder!.buildArgsForESDTTransfer(transfer);
            extraGasForTransfer = this.config!.gasLimitESDTTransfer + BigInt(ADDITIONAL_GAS_FOR_ESDT_TRANSFER);
        } else {
            transferArgs = this.dataArgsBuilder!.buildArgsForSingleESDTNFTTransfer(transfer, receiver);
            extraGasForTransfer = this.config!.gasLimitESDTNFTTransfer + BigInt(ADDITIONAL_GAS_FOR_ESDT_NFT_TRANSFER);
            receiver = options.sender;
        }

        return new TransactionBuilder({
            config: this.config!,
            sender: options.sender,
            receiver: receiver,
            dataParts: transferArgs,
            gasLimit: extraGasForTransfer,
            addDataMovementGas: true,
        }).build();
    }
}
