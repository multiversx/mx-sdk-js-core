import { BigNumber } from "bignumber.js";
import { IAddress } from "../interface";
import { ArgSerializer, CodeMetadata, ContractFunction, EndpointDefinition } from "../smartcontracts";
import { byteArrayToHex, utf8ToHex } from "../utils.codec";
import { ARGUMENTS_SEPARATOR, CONTRACT_DEPLOY_ADDRESS, VM_TYPE_WASM_VM } from "../constants";
import { NativeSerializer } from "../smartcontracts/nativeSerializer";
import { Err, ErrBadUsage } from "../errors";
import { Address } from "../address";
import { Token, NextTokenTransfer } from "../tokens";
import { TokenTransfersDataBuilder } from "./tokenTransfersDataBuilder";
import { TransactionNext } from "../transaction";
import { TransactionPayload } from "../transactionPayload";

interface Config {
    chainID: string;
    minGasLimit: BigNumber.Value;
    gasLimitPerByte: BigNumber.Value;
}

interface Abi {
    constructorDefinition: EndpointDefinition;

    getEndpoint(name: string | ContractFunction): EndpointDefinition;
}

interface TokenComputer {
    isFungible(token: Token): boolean;
}

export class SmartContractTransactionsFactory {
    private readonly config: Config;
    private readonly abiRegistry?: Abi;
    private readonly tokenComputer: TokenComputer;
    private readonly dataArgsBuilder: TokenTransfersDataBuilder;
    private dataParts!: string[];

    constructor({ config, abi, tokenComputer }: { config: Config; abi?: Abi; tokenComputer: TokenComputer }) {
        this.config = config;
        this.abiRegistry = abi;
        this.tokenComputer = tokenComputer;
        this.dataArgsBuilder = new TokenTransfersDataBuilder();
    }

    createTransactionForDeploy(options: {
        sender: IAddress;
        bytecode: Uint8Array;
        gasLimit: BigNumber.Value;
        args?: any[];
        nativeTransferAmount?: BigNumber.Value;
        isUpgradeable?: boolean;
        isReadable?: boolean;
        isPayable?: boolean;
        isPayableBySmartContract?: boolean;
    }): TransactionNext {
        const nativeTransferAmount = options.nativeTransferAmount ?? 0;
        const isUpgradeable = options.isUpgradeable ?? true;
        const isReadable = options.isReadable ?? true;
        const isPayable = options.isPayable ?? false;
        const isPayableBySmartContract = options.isPayableBySmartContract ?? true;
        const args = options.args || [];
        const metadata = new CodeMetadata(isUpgradeable, isReadable, isPayable, isPayableBySmartContract);
        let parts = [byteArrayToHex(options.bytecode), byteArrayToHex(VM_TYPE_WASM_VM), metadata.toString()];
        const preparedArgs = this.argsToDataParts(args, this.abiRegistry?.constructorDefinition);
        this.dataParts = parts.concat(preparedArgs);
        const data = this.buildTransactionPayload();

        return new TransactionNext({
            sender: options.sender.bech32(),
            receiver: Address.fromBech32(CONTRACT_DEPLOY_ADDRESS).bech32(),
            data: data.valueOf(),
            gasLimit: options.gasLimit,
            value: nativeTransferAmount,
            chainID: this.config.chainID
        });
    }

    createTransactionForExecute(options: {
        sender: IAddress;
        contract: IAddress;
        functionName: string;
        gasLimit: BigNumber.Value;
        args?: any[];
        nativeTransferAmount?: BigNumber.Value;
        tokenTransfers?: NextTokenTransfer[];
    }): TransactionNext {
        const args = options.args || [];
        const tokenTransfer = options.tokenTransfers || [];
        const nativeTransferAmount = options.nativeTransferAmount ?? 0;
        const numberOfTokens = tokenTransfer.length;

        if (nativeTransferAmount && numberOfTokens) {
            throw new ErrBadUsage("Can't send both native tokens and custom tokens(ESDT/NFT)");
        }

        let receiver = options.contract;
        let dataParts: string[] = [];

        if (numberOfTokens === 1) {
            const transfer = tokenTransfer[0];

            if (this.tokenComputer.isFungible(transfer.token)) {
                dataParts = this.dataArgsBuilder.buildArgsForESDTTransfer(transfer);
            } else {
                dataParts = this.dataArgsBuilder.buildArgsForSingleESDTNFTTransfer(transfer, receiver);
                receiver = options.sender;
            }
        } else if (numberOfTokens > 1) {
            dataParts = this.dataArgsBuilder.buildArgsForMultiESDTNFTTransfer(receiver, tokenTransfer);
            receiver = options.sender;
        }

        dataParts.push(dataParts.length ? utf8ToHex(options.functionName) : options.functionName);
        this.dataParts = dataParts.concat(this.argsToDataParts(args, this.abiRegistry?.getEndpoint(options.functionName)));
        const data = this.buildTransactionPayload();

        return new TransactionNext({
            sender: options.sender.bech32(),
            receiver: receiver.bech32(),
            data: data.valueOf(),
            gasLimit: options.gasLimit,
            value: nativeTransferAmount,
            chainID: this.config.chainID
        });
    }

    createTransactionForUpgrade(options: {
        sender: IAddress;
        contract: IAddress;
        bytecode: Uint8Array;
        gasLimit: BigNumber.Value;
        args?: any[];
        nativeTransferAmount?: BigNumber.Value;
        isUpgradeable?: boolean;
        isReadable?: boolean;
        isPayable?: boolean;
        isPayableBySmartContract?: boolean;
    }): TransactionNext {
        const nativeTransferAmount = options.nativeTransferAmount ?? 0;

        const isUpgradeable = options.isUpgradeable ?? true;
        const isReadable = options.isReadable ?? true;
        const isPayable = options.isPayable ?? false;
        const isPayableBySmartContract = options.isPayableBySmartContract ?? true;

        const args = options.args || [];
        const metadata = new CodeMetadata(isUpgradeable, isReadable, isPayable, isPayableBySmartContract);

        let parts = ["upgradeContract", byteArrayToHex(options.bytecode), metadata.toString()];

        const preparedArgs = this.argsToDataParts(args, this.abiRegistry?.constructorDefinition);
        parts = parts.concat(preparedArgs);
        this.dataParts = parts.concat(preparedArgs);
        const data = this.buildTransactionPayload();

        return new TransactionNext({
            sender: options.sender.bech32(),
            receiver: options.contract.bech32(),
            data: data.valueOf(),
            gasLimit: options.gasLimit,
            value: nativeTransferAmount,
            chainID: this.config.chainID
        });
    }

    private argsToDataParts(args: any[], endpoint?: EndpointDefinition): string[] {
        if (endpoint) {
            const typedArgs = NativeSerializer.nativeToTypedValues(args, endpoint);
            return new ArgSerializer().valuesToStrings(typedArgs);
        }

        if (this.areArgsOfTypedValue(args)) {
            return new ArgSerializer().valuesToStrings(args);
        }

        throw new Err("Can't convert args to TypedValues");
    }

    private areArgsOfTypedValue(args: any[]): boolean {
        for (const arg of args) {
            if (!arg.belongsToTypesystem) {
                return false;
            }
        }
        return true;
    }

    private buildTransactionPayload(): TransactionPayload {
        const data = this.dataParts.join(ARGUMENTS_SEPARATOR);
        return new TransactionPayload(data);
    }
}
