import BigNumber from "bignumber.js";
import { TokenTransfersDataBuilder } from "./tokenTransfersDataBuilder";
import { IAddress } from "../interface";
import { DraftTransaction } from "../draftTransaction";
import { DraftTransactionBuilder } from "./draftTransactionBuilder";
import { TokenComputer, NextTokenTransfer } from "../tokens";
import { ErrBadUsage } from "../errors";

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

export class TransferTransactionsFactory {
    private readonly config: IConfig;
    private readonly dataArgsBuilder: TokenTransfersDataBuilder;

    constructor(config: IConfig) {
        this.config = config;
        this.dataArgsBuilder = new TokenTransfersDataBuilder();
    }

    createTransactionForNativeTokenTransfer(options: {
        sender: IAddress;
        receiver: IAddress;
        nativeAmount: BigNumber.Value;
        data?: string;
    }): DraftTransaction {
        const data = options.data || "";
        return new DraftTransactionBuilder({
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
    }): DraftTransaction {
        const numberOfTransfers = options.tokenTransfers.length;
        let receiver = options.receiver;

        let transferArgs: string[] = [];
        let extraGasForTransfer = new BigNumber(0);
        const tokenComputer = new TokenComputer();

        if (numberOfTransfers === 0) {
            throw new ErrBadUsage("No token transfer has been provided");
        }

        if (numberOfTransfers === 1) {
            const transfer = options.tokenTransfers[0];

            if (tokenComputer.isFungible(transfer.token)) {
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
        } else {
            transferArgs = this.dataArgsBuilder.buildArgsForMultiESDTNFTTransfer(receiver, options.tokenTransfers);
            extraGasForTransfer = new BigNumber(this.config.gasLimitMultiESDTNFTTransfer)
                .multipliedBy(new BigNumber(numberOfTransfers))
                .plus(new BigNumber(ADDITIONAL_GAS_FOR_ESDT_NFT_TRANSFER));
            receiver = options.sender;
        }

        return new DraftTransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: receiver,
            dataParts: transferArgs,
            gasLimit: extraGasForTransfer,
            addDataMovementGas: true,
        }).build();
    }
}
