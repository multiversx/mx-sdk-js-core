import { BigNumber } from "bignumber.js";
import { IAddress } from "../interface";
import { DraftTransaction } from "../draftTransaction";
import { ArgSerializer, CodeMetadata, ContractFunction, EndpointDefinition } from "../smartcontracts";
import { byteArrayToHex, utf8ToHex } from "../utils.codec";
import { CONTRACT_DEPLOY_ADDRESS, VM_TYPE_WASM_VM } from "../constants";
import { NativeSerializer } from "../smartcontracts/nativeSerializer";
import { Err, ErrBadUsage } from "../errors";
import { Address } from "../address";
import { DraftTransactionBuilder } from "./draftTransactionBuilder";
import { TokenComputer, TokenTransfer } from "../tokens";
import { TokenTransfersDataBuilder } from "./tokenTransfersDataBuilder";

interface Config {
    chainID: string;
    minGasLimit: BigNumber.Value;
    gasLimitPerByte: BigNumber.Value;
}

interface Abi {
    constructorDefinition: EndpointDefinition;

    getEndpoint(name: string | ContractFunction): EndpointDefinition;
}


export class SmartContractTransactionsFactory {
    private readonly config: Config;
    private readonly abiRegistry?: Abi;
    private readonly dataArgsBuilder: TokenTransfersDataBuilder;

    constructor({
        config,
        abi
    }: {
        config: Config;
        abi?: Abi;
    }) {
        this.config = config;
        this.abiRegistry = abi;
        this.dataArgsBuilder = new TokenTransfersDataBuilder();
    }

    createTransactionForDeploy(options: {
        sender: IAddress,
        bytecode: Uint8Array,
        gasLimit: BigNumber.Value,
        args?: any[],
        nativeTransferAmount?: BigNumber.Value,
        isUpgradeable?: boolean,
        isReadable?: boolean,
        isPayable?: boolean,
        isPayableBySmartContract?: boolean
    }): DraftTransaction {
        const nativeTransferAmount = options.nativeTransferAmount ?? 0;

        const isUpgradeable = options.isUpgradeable ?? true;
        const isReadable = options.isReadable ?? true;
        const isPayable = options.isPayable ?? false;
        const isPayableBySmartContract = options.isPayableBySmartContract ?? true;

        const args = options.args || [];

        const metadata = new CodeMetadata(isUpgradeable, isReadable, isPayable, isPayableBySmartContract);
        let parts = [
            byteArrayToHex(options.bytecode),
            byteArrayToHex(VM_TYPE_WASM_VM),
            metadata.toString()
        ];

        const preparedArgs = this.argsToDataParts(args, this.abiRegistry?.constructorDefinition)
        parts = parts.concat(preparedArgs);

        return new DraftTransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: Address.fromBech32(CONTRACT_DEPLOY_ADDRESS),
            dataParts: parts,
            gasLimit: options.gasLimit,
            addDataMovementGas: false,
            amount: nativeTransferAmount
        }).build();
    }

    createTransactionForExecute(options: {
        sender: IAddress,
        contract: IAddress,
        functionName: string,
        gasLimit: BigNumber.Value,
        args?: any[],
        nativeTransferAmount?: BigNumber.Value,
        tokenTransfers?: TokenTransfer[]
    }): DraftTransaction {
        const args = options.args || [];
        const tokenTransfer = options.tokenTransfers || [];
        const nativeTransferAmount = options.nativeTransferAmount ?? 0;
        const numberOfTokens = tokenTransfer.length;

        if (nativeTransferAmount && numberOfTokens) {
            throw new ErrBadUsage("Can't send both native token and custom tokens(ESDT/NFT)");
        }

        let receiver = options.contract;
        const tokenComputer = new TokenComputer();
        let transferArgs: string[] = [];

        if (numberOfTokens === 1) {
            const transfer = tokenTransfer[0];

            if (tokenComputer.isFungible(transfer.token)) {
                transferArgs = this.dataArgsBuilder.buildArgsForESDTTransfer(transfer);
            }
            else {
                transferArgs = this.dataArgsBuilder.buildArgsForSingleESDTNFTTransfer(transfer, receiver);
                receiver = options.sender;
            }
        }
        else if (numberOfTokens > 1) {
            transferArgs = this.dataArgsBuilder.buildArgsForMultiESDTNFTTransfer(receiver, tokenTransfer)
            receiver = options.sender;
        }

        transferArgs.push(transferArgs.length ? utf8ToHex(options.functionName) : options.functionName);
        transferArgs = transferArgs.concat(this.argsToDataParts(args, this.abiRegistry?.getEndpoint(options.functionName)));

        return new DraftTransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: receiver,
            dataParts: transferArgs,
            gasLimit: options.gasLimit,
            addDataMovementGas: false,
            amount: nativeTransferAmount
        }).build();
    }

    createTransactionForUpgrade(options: {
        sender: IAddress,
        contract: IAddress,
        bytecode: Uint8Array,
        gasLimit: BigNumber.Value,
        args?: any[],
        nativeTransferAmount?: BigNumber.Value,
        isUpgradeable?: boolean,
        isReadable?: boolean,
        isPayable?: boolean,
        isPayableBySmartContract?: boolean
    }): DraftTransaction {
        const nativeTransferAmount = options.nativeTransferAmount ?? 0;

        const isUpgradeable = options.isUpgradeable ?? true;
        const isReadable = options.isReadable ?? true;
        const isPayable = options.isPayable ?? false;
        const isPayableBySmartContract = options.isPayableBySmartContract ?? true;

        const args = options.args || [];
        const metadata = new CodeMetadata(isUpgradeable, isReadable, isPayable, isPayableBySmartContract);

        let parts = [
            "upgradeContract",
            byteArrayToHex(options.bytecode),
            metadata.toString()
        ];

        const preparedArgs = this.argsToDataParts(args, this.abiRegistry?.constructorDefinition)
        parts = parts.concat(preparedArgs);

        return new DraftTransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.contract,
            dataParts: parts,
            gasLimit: options.gasLimit,
            addDataMovementGas: false,
            amount: nativeTransferAmount
        }).build();
    }

    private argsToDataParts(args: any[], endpoint?: EndpointDefinition): string[] {
        if (endpoint) {
            const typedArgs = NativeSerializer.nativeToTypedValues(args, endpoint)
            return new ArgSerializer().valuesToStrings(typedArgs);
        }

        if (this.areArgsOfTypedValue(args)) {
            return new ArgSerializer().valuesToStrings(args);
        }

        throw new Err("Can't convert args to TypedValues");
    }

    private areArgsOfTypedValue(args: any[]): boolean {
        for (const arg of args) {
            if (!(arg.belongsToTypesystem)) {
                return false;
            }
        }
        return true;
    }
}
