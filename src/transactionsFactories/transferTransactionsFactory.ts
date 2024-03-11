import { ErrBadUsage } from "../errors";
import { IAddress } from "../interface";
import { NextTokenTransfer, Token } from "../tokens";
import { Transaction } from "../transaction";
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

interface TokenComputer {
    isFungible(token: Token): boolean;
}

/**
 * Use this class to create transactions for native token transfers (EGLD) or custom tokens transfers (ESDT/NTF/MetaESDT).
 * This name is only temporary, the class will be renamed to `TransferTransactionsFactory`.
 */
export class NextTransferTransactionsFactory {
    private readonly config: IConfig;
    private readonly dataArgsBuilder: TokenTransfersDataBuilder;
    private readonly tokenComputer: TokenComputer;

    constructor(config: IConfig, tokenComputer: TokenComputer) {
        this.config = config;
        this.tokenComputer = tokenComputer;
        this.dataArgsBuilder = new TokenTransfersDataBuilder();
    }

    createTransactionForNativeTokenTransfer(options: {
        sender: IAddress;
        receiver: IAddress;
        nativeAmount: bigint;
        data?: string;
    }): Transaction {
        const data = options.data || "";

        return new TransactionBuilder({
            config: this.config,
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
        const numberOfTransfers = options.tokenTransfers.length;

        if (numberOfTransfers === 0) {
            throw new ErrBadUsage("No token transfer has been provided");
        }

        if (numberOfTransfers === 1) {
            return this.createSingleESDTTransferDraft(options);
        }

        const transferArgs = this.dataArgsBuilder.buildArgsForMultiESDTNFTTransfer(
            options.receiver,
            options.tokenTransfers,
        );

        const extraGasForTransfer =
            this.config.gasLimitMultiESDTNFTTransfer * BigInt(numberOfTransfers) +
            BigInt(ADDITIONAL_GAS_FOR_ESDT_NFT_TRANSFER);

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.sender,
            dataParts: transferArgs,
            gasLimit: extraGasForTransfer,
            addDataMovementGas: true,
        }).build();
    }

    private createSingleESDTTransferDraft(options: {
        sender: IAddress;
        receiver: IAddress;
        tokenTransfers: NextTokenTransfer[];
    }): Transaction {
        let transferArgs: string[] = [];
        const transfer = options.tokenTransfers[0];
        let extraGasForTransfer = 0n;
        let receiver = options.receiver;

        if (this.tokenComputer.isFungible(transfer.token)) {
            transferArgs = this.dataArgsBuilder.buildArgsForESDTTransfer(transfer);
            extraGasForTransfer = this.config.gasLimitESDTTransfer + BigInt(ADDITIONAL_GAS_FOR_ESDT_TRANSFER);
        } else {
            transferArgs = this.dataArgsBuilder.buildArgsForSingleESDTNFTTransfer(transfer, receiver);
            extraGasForTransfer = this.config.gasLimitESDTNFTTransfer + BigInt(ADDITIONAL_GAS_FOR_ESDT_NFT_TRANSFER);
            receiver = options.sender;
        }

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: receiver,
            dataParts: transferArgs,
            gasLimit: extraGasForTransfer,
            addDataMovementGas: true,
        }).build();
    }
}
