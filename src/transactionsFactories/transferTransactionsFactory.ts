import BigNumber from "bignumber.js";
import { TokenTransfersDataBuilder } from "./tokenTransfersDataBuilder";
import { IAddress } from "../interface";
import { NextTokenTransfer, Token } from "../tokens";
import { ErrBadUsage } from "../errors";
import { TransactionNextBuilder } from "./transactionNextBuilder";
import { TransactionNext } from "../transaction";


const ADDITIONAL_GAS_FOR_ESDT_TRANSFER = 100000;
const ADDITIONAL_GAS_FOR_ESDT_NFT_TRANSFER = 800000;

interface IConfig {
    chainID: string;
    minGasLimit: BigNumber.Value;
    gasLimitPerByte: BigNumber.Value;
    gasLimitESDTTransfer: BigNumber.Value;
    gasLimitESDTNFTTransfer: BigNumber.Value;
    gasLimitMultiESDTNFTTransfer: BigNumber.Value;
}

interface TokenComputer {
    isFungible(token: Token): boolean;
}

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
        nativeAmount: BigNumber.Value;
        data?: string;
    }): TransactionNext {
        const data = options.data || "";

        return new TransactionNextBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.receiver,
            dataParts: [data],
            gasLimit: 0,
            addDataMovementGas: true,
            amount: options.nativeAmount,
        }).build();
    }

    createTransactionForESDTTokenTransfer(options: {
        sender: IAddress;
        receiver: IAddress;
        tokenTransfers: NextTokenTransfer[];
    }): TransactionNext {
        const numberOfTransfers = options.tokenTransfers.length;

        if (numberOfTransfers === 0) {
            throw new ErrBadUsage("No token transfer has been provided");
        }

        if (numberOfTransfers === 1) {
            return this.createSingleESDTTransferDraft(options);
        }

        const transferArgs = this.dataArgsBuilder.buildArgsForMultiESDTNFTTransfer(
            options.receiver,
            options.tokenTransfers
        )

        const extraGasForTransfer = new BigNumber(this.config.gasLimitMultiESDTNFTTransfer).multipliedBy(new BigNumber(numberOfTransfers)).plus(new BigNumber(ADDITIONAL_GAS_FOR_ESDT_NFT_TRANSFER));

        return new TransactionNextBuilder({
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
    }): TransactionNext {
        let transferArgs: string[] = [];
        const transfer = options.tokenTransfers[0];
        let extraGasForTransfer = new BigNumber(0);
        let receiver = options.receiver;

        if (this.tokenComputer.isFungible(transfer.token)) {
            transferArgs = this.dataArgsBuilder.buildArgsForESDTTransfer(transfer);
            extraGasForTransfer = new BigNumber(this.config.gasLimitESDTTransfer).plus(
                new BigNumber(ADDITIONAL_GAS_FOR_ESDT_TRANSFER)
            );
        } else {
            transferArgs = this.dataArgsBuilder.buildArgsForSingleESDTNFTTransfer(transfer, receiver);
            extraGasForTransfer = new BigNumber(this.config.gasLimitESDTNFTTransfer).plus(
                new BigNumber(ADDITIONAL_GAS_FOR_ESDT_NFT_TRANSFER)
            );
            receiver = options.sender;
        }

        return new TransactionNextBuilder({
            config: this.config,
            sender: options.sender,
            receiver: receiver,
            dataParts: transferArgs,
            gasLimit: extraGasForTransfer,
            addDataMovementGas: true,
        }).build();
    }
}
