import { IGasLimitEstimator } from "../core";
import { Address } from "../core/address";
import { BaseFactory } from "../core/baseFactory";
import { EGLD_IDENTIFIER_FOR_MULTI_ESDTNFT_TRANSFER } from "../core/constants";
import { ErrBadUsage } from "../core/errors";
import { TokenComputer, TokenTransfer } from "../core/tokens";
import { TokenTransfersDataBuilder } from "../core/tokenTransfersDataBuilder";
import { Transaction } from "../core/transaction";
import * as resources from "./resources";

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

/**
 * Use this class to create transactions for native token transfers (EGLD) or custom tokens transfers (ESDT/NTF/MetaESDT).
 */
export class TransferTransactionsFactory extends BaseFactory {
    private readonly config: IConfig;
    private readonly tokenTransfersDataBuilder: TokenTransfersDataBuilder;
    private readonly tokenComputer: TokenComputer;

    constructor(options: { config: IConfig; gasLimitEstimator?: IGasLimitEstimator }) {
        super({ config: options.config, gasLimitEstimator: options.gasLimitEstimator });
        this.config = options.config;
        this.tokenComputer = new TokenComputer();
        this.tokenTransfersDataBuilder = new TokenTransfersDataBuilder();
    }

    async createTransactionForNativeTokenTransfer(
        sender: Address,
        options: resources.NativeTokenTransferInput,
    ): Promise<Transaction> {
        const data = options.data || new Uint8Array();

        const transaction = new Transaction({
            sender: sender,
            receiver: options.receiver,
            chainID: this.config.chainID,
            gasLimit: 0n,
            data: data,
            value: options.nativeAmount ?? BigInt(0),
        });

        await this.setGasLimit(transaction, undefined, 0n);

        return transaction;
    }

    async createTransactionForESDTTokenTransfer(
        sender: Address,
        options: resources.CustomTokenTransferInput,
    ): Promise<Transaction> {
        const numberOfTransfers = options.tokenTransfers.length;

        if (numberOfTransfers === 0) {
            throw new ErrBadUsage("No token transfer has been provided");
        }

        if (numberOfTransfers === 1) {
            return await this.createSingleESDTTransferTransaction(sender, options);
        }

        const { dataParts, extraGasForTransfer } = this.buildMultiESDTNFTTransferData(
            options.tokenTransfers,
            options.receiver,
        );

        const transaction = new Transaction({
            sender: sender,
            receiver: sender,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, undefined, extraGasForTransfer);

        return transaction;
    }

    async createTransactionForTransfer(
        sender: Address,
        options: resources.CreateTransferTransactionInput,
    ): Promise<Transaction> {
        const nativeAmount = options.nativeAmount ?? 0n;
        let tokenTransfers = options.tokenTransfers ? [...options.tokenTransfers] : [];
        const numberOfTokens = tokenTransfers.length;

        if (numberOfTokens && options.data?.length) {
            throw new ErrBadUsage("Can't set data field when sending esdt tokens");
        }

        if ((nativeAmount && numberOfTokens === 0) || options.data) {
            return await this.createTransactionForNativeTokenTransfer(sender, {
                receiver: options.receiver,
                nativeAmount: nativeAmount,
                data: options.data,
            });
        }

        const nativeTransfer = nativeAmount ? TokenTransfer.newFromNativeAmount(nativeAmount) : undefined;
        if (nativeTransfer) {
            tokenTransfers.push(nativeTransfer);
        }

        return await this.createTransactionForESDTTokenTransfer(sender, {
            receiver: options.receiver,
            tokenTransfers: tokenTransfers,
        });
    }

    private async createSingleESDTTransferTransaction(
        sender: Address,
        options: {
            receiver: Address;
            tokenTransfers: TokenTransfer[];
        },
    ): Promise<Transaction> {
        const transfer = options.tokenTransfers[0];
        const { dataParts, extraGasForTransfer, receiver } = this.buildTransferData(transfer, {
            sender,
            receiver: options.receiver,
        });

        const transaction = new Transaction({
            sender: sender,
            receiver: receiver,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, undefined, extraGasForTransfer);

        return transaction;
    }

    private buildTransferData(transfer: TokenTransfer, options: { sender: Address; receiver: Address }) {
        let dataParts: string[] = [];
        let extraGasForTransfer: bigint;
        let receiver = options.receiver;

        if (this.tokenComputer!.isFungible(transfer.token)) {
            if (transfer.token.identifier === EGLD_IDENTIFIER_FOR_MULTI_ESDTNFT_TRANSFER) {
                ({ dataParts, extraGasForTransfer } = this.buildMultiESDTNFTTransferData([transfer], receiver));
                receiver = options.sender;
            } else {
                ({ dataParts, extraGasForTransfer } = this.buildESDTTransferData(transfer));
            }
        } else {
            ({ dataParts, extraGasForTransfer } = this.buildSingleESDTNFTTransferData(transfer, receiver));
            receiver = options.sender; // Override receiver for non-fungible tokens
        }
        return { dataParts, extraGasForTransfer, receiver };
    }

    private buildMultiESDTNFTTransferData(transfer: TokenTransfer[], receiver: Address) {
        return {
            dataParts: this.tokenTransfersDataBuilder!.buildDataPartsForMultiESDTNFTTransfer(receiver, transfer),
            extraGasForTransfer:
                this.config!.gasLimitMultiESDTNFTTransfer * BigInt(transfer.length) +
                BigInt(ADDITIONAL_GAS_FOR_ESDT_NFT_TRANSFER),
        };
    }

    private buildESDTTransferData(transfer: TokenTransfer) {
        return {
            dataParts: this.tokenTransfersDataBuilder!.buildDataPartsForESDTTransfer(transfer),
            extraGasForTransfer: this.config!.gasLimitESDTTransfer + BigInt(ADDITIONAL_GAS_FOR_ESDT_TRANSFER),
        };
    }

    private buildSingleESDTNFTTransferData(transfer: TokenTransfer, receiver: Address) {
        return {
            dataParts: this.tokenTransfersDataBuilder!.buildDataPartsForSingleESDTNFTTransfer(transfer, receiver),
            extraGasForTransfer: this.config!.gasLimitESDTNFTTransfer + BigInt(ADDITIONAL_GAS_FOR_ESDT_NFT_TRANSFER),
        };
    }
}
