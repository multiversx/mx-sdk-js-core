import BigNumber from "bignumber.js";
import { TokenTransfersDataBuilder } from "./tokenTransfersDataBuilder";
import { IAddress, ITransactionPayload } from "../interface";
import { NextTokenTransfer, Token } from "../tokens";
import { ErrBadUsage } from "../errors";
import { TransactionNext } from "../transaction";
import { TransactionPayload } from "../transactionPayload";
import { ARGUMENTS_SEPARATOR } from "../constants";

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
    private dataParts!: string[];
    private addDataMovementGas!: boolean;
    private providedGasLimit!: BigNumber;

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
        const d = options.data || "";
        this.dataParts = [d];
        const data = this.buildTransactionPayload();
        this.addDataMovementGas = true;
        this.providedGasLimit = new BigNumber(0);
        const gasLimit = this.computeGasLimit(data);


        return new TransactionNext({
            sender: options.sender.bech32(),
            receiver: options.receiver.bech32(),
            data: data.valueOf(),
            gasLimit: gasLimit,
            value: options.nativeAmount,
            chainID: this.config.chainID
        });
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
            return this.createSingleESDTTransferNext(options);
        }

        this.dataParts = this.dataArgsBuilder.buildArgsForMultiESDTNFTTransfer(
            options.receiver,
            options.tokenTransfers
        );
        const data = this.buildTransactionPayload();

        this.providedGasLimit = new BigNumber(this.config.gasLimitMultiESDTNFTTransfer)
            .multipliedBy(new BigNumber(numberOfTransfers))
            .plus(new BigNumber(ADDITIONAL_GAS_FOR_ESDT_NFT_TRANSFER));
        this.addDataMovementGas = true;
        const gasLimit = this.computeGasLimit(data);

        return new TransactionNext({
            sender: options.sender.bech32(),
            receiver: options.sender.bech32(),
            data: data.valueOf(),
            gasLimit: gasLimit,
            chainID: this.config.chainID
        });
    }

    private createSingleESDTTransferNext(options: {
        sender: IAddress;
        receiver: IAddress;
        tokenTransfers: NextTokenTransfer[];
    }): TransactionNext {
        let transferArgs: string[] = [];
        const transfer = options.tokenTransfers[0];
        let receiver = options.receiver;

        if (this.tokenComputer.isFungible(transfer.token)) {
            transferArgs = this.dataArgsBuilder.buildArgsForESDTTransfer(transfer);
            this.providedGasLimit = new BigNumber(this.config.gasLimitESDTTransfer).plus(
                new BigNumber(ADDITIONAL_GAS_FOR_ESDT_TRANSFER)
            );
        } else {
            transferArgs = this.dataArgsBuilder.buildArgsForSingleESDTNFTTransfer(transfer, receiver);
            this.providedGasLimit = new BigNumber(this.config.gasLimitESDTNFTTransfer).plus(
                new BigNumber(ADDITIONAL_GAS_FOR_ESDT_NFT_TRANSFER)
            );
            receiver = options.sender;
        }

        this.dataParts = transferArgs;
        const data = this.buildTransactionPayload();
        this.addDataMovementGas = true;
        const gasLimit = this.computeGasLimit(data);

        return new TransactionNext({
            sender: options.sender.bech32(),
            receiver: receiver.bech32(),
            data: data.valueOf(),
            gasLimit: gasLimit,
            chainID: this.config.chainID
        });
    }

    private buildTransactionPayload(): TransactionPayload {
        const data = this.dataParts.join(ARGUMENTS_SEPARATOR);
        return new TransactionPayload(data);
    }

    private computeGasLimit(payload: ITransactionPayload): BigNumber.Value {
        if (!this.addDataMovementGas) {
            return this.providedGasLimit;
        }

        const dataMovementGas = new BigNumber(this.config.minGasLimit).plus(new BigNumber(this.config.gasLimitPerByte).multipliedBy(payload.length()));
        const gasLimit = dataMovementGas.plus(this.providedGasLimit);
        return gasLimit;
    }
}
