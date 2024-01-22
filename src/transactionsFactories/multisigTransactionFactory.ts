import {IAddress, ITransactionPayload} from "../interface";
import BigNumber from "bignumber.js";
import { DraftTransactionBuilder } from "./draftTransactionBuilder";
import { TokenTransfersDataBuilder } from "./tokenTransfersDataBuilder";
import {NextTokenTransfer, TokenComputer} from "../tokens";
import {addressToHex, bigIntToHex} from "../utils.codec";
import {ErrBadUsage} from "../errors";
import {DraftTransaction} from "../draftTransaction";

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

export class MultisigTransactionFactory {
    private readonly config: IConfig;
    private readonly dataArgsBuilder: TokenTransfersDataBuilder;
    private readonly tokenComputer: TokenComputer;

    constructor(config: IConfig, tokenComputer: TokenComputer) {
        this.config = config;
        this.tokenComputer = tokenComputer;
        this.dataArgsBuilder = new TokenTransfersDataBuilder();
    }

    createTransactionForProposeNativeTransfer(options: {
        sender: IAddress;
        receiver: IAddress;
        multisig: IAddress;
        nativeAmount: BigNumber.Value;
        data?: string;
    }): DraftTransaction {
        const dataParts = [
            "proposeTransferExecute",
            addressToHex(options.receiver),
            bigIntToHex(options.nativeAmount),
        ];
        if (options.data) {
            dataParts.push(options.data);
        }

        return new DraftTransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.multisig,
            dataParts: dataParts,
            gasLimit: 0,
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForProposeESDTTransfer(options: {
        sender: IAddress;
        receiver: IAddress;
        multisig: IAddress;
        tokenTransfers: NextTokenTransfer[];
    }): DraftTransaction {
        const numberOfTransfers = options.tokenTransfers.length;

        if (numberOfTransfers === 0) {
            throw new ErrBadUsage("No token transfer has been provided");
        }

        if (numberOfTransfers === 1) {
            return this.createSingleESDTTransferDraft(options);
        }

        return this.createMultiESDTTransferDraft(options);
    }

    createTransactionForProposeNFTTransfer(options: {
        sender: IAddress;
        receiver: IAddress;
        multisig: IAddress;
        tokenTransfers: NextTokenTransfer[];
    }): DraftTransaction {
        const numberOfTransfers = options.tokenTransfers.length;

        if (numberOfTransfers === 0) {
            throw new ErrBadUsage("No token transfer has been provided");
        }

        if (numberOfTransfers === 1) {
            return this.createSingleNFTTransferDraft(options);
        }

        return this.createMultiNFTTransferDraft(options);
    }

    createTransactionForProposeContractCall(options: {
        sender: IAddress;
        receiver: IAddress;
        multisig: IAddress;
        data: ITransactionPayload;
        gasLimit: BigNumber.Value,
    }): DraftTransaction {
        const dataParts = [
            "proposeAsyncCall",
            addressToHex(options.receiver),
            "",
            options.data.toString(),
        ];

        return new DraftTransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.multisig,
            dataParts: dataParts,
            gasLimit: options.gasLimit,
            addDataMovementGas: true,
        }).build();
    }

    private createSingleESDTTransferDraft(options: {
        sender: IAddress;
        receiver: IAddress;
        multisig: IAddress;
        tokenTransfers: NextTokenTransfer[];
    }): DraftTransaction {
        const transfer = options.tokenTransfers[0];

        let transferArgs = this.dataArgsBuilder.buildArgsForESDTTransfer(transfer);
        let extraGasForTransfer = new BigNumber(this.config.gasLimitESDTTransfer).plus(
            new BigNumber(ADDITIONAL_GAS_FOR_ESDT_TRANSFER)
        );

        transferArgs = [
            "proposeAsyncCall",
            addressToHex(options.receiver),
            "", // 0 value
            ...transferArgs
        ];

        return new DraftTransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.multisig,
            dataParts: transferArgs,
            gasLimit: extraGasForTransfer,
            addDataMovementGas: true,
        }).build();
    }

    private createMultiESDTTransferDraft(options: {
        sender: IAddress;
        receiver: IAddress;
        multisig: IAddress;
        tokenTransfers: NextTokenTransfer[];
    }): DraftTransaction {
        let transferArgs = this.dataArgsBuilder.buildArgsForMultiESDTNFTTransfer(
            options.receiver,
            options.tokenTransfers
        );

        transferArgs = [
            "proposeAsyncCall",
            addressToHex(options.receiver),
            "", // 0 value
            ...transferArgs
        ];

        const numberOfTransfers = options.tokenTransfers.length;
        const extraGasForTransfer = new BigNumber(this.config.gasLimitMultiESDTNFTTransfer)
            .multipliedBy(new BigNumber(numberOfTransfers))
            .plus(new BigNumber(ADDITIONAL_GAS_FOR_ESDT_NFT_TRANSFER));

        return new DraftTransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.multisig,
            dataParts: transferArgs,
            gasLimit: extraGasForTransfer,
            addDataMovementGas: true,
        }).build();
    }

    private createSingleNFTTransferDraft(options: {
        sender: IAddress;
        receiver: IAddress;
        multisig: IAddress;
        tokenTransfers: NextTokenTransfer[];
    }): DraftTransaction {
        const transfer = options.tokenTransfers[0];

        let transferArgs = this.dataArgsBuilder.buildArgsForSingleESDTNFTTransfer(transfer, options.receiver);
        let extraGasForTransfer = new BigNumber(this.config.gasLimitESDTTransfer).plus(
            new BigNumber(ADDITIONAL_GAS_FOR_ESDT_NFT_TRANSFER)
        );

        transferArgs = [
            "proposeAsyncCall",
            addressToHex(options.receiver),
            "", // 0 value
            ...transferArgs
        ];

        return new DraftTransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.multisig,
            dataParts: transferArgs,
            gasLimit: extraGasForTransfer,
            addDataMovementGas: true,
        }).build();
    }

    private createMultiNFTTransferDraft(options: {
        sender: IAddress;
        receiver: IAddress;
        multisig: IAddress;
        tokenTransfers: NextTokenTransfer[];
    }): DraftTransaction {
        let transferArgs = this.dataArgsBuilder.buildArgsForMultiESDTNFTTransfer(options.receiver, options.tokenTransfers);
        transferArgs = [
            "proposeAsyncCall",
            addressToHex(options.receiver),
            "", // 0 value
            ...transferArgs
        ];

        const numberOfTransfers = options.tokenTransfers.length;
        const extraGasForTransfer = new BigNumber(this.config.gasLimitMultiESDTNFTTransfer)
            .multipliedBy(new BigNumber(numberOfTransfers))
            .plus(new BigNumber(ADDITIONAL_GAS_FOR_ESDT_NFT_TRANSFER));

        return new DraftTransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.multisig,
            dataParts: transferArgs,
            gasLimit: extraGasForTransfer,
            addDataMovementGas: true,
        }).build();
    }
}