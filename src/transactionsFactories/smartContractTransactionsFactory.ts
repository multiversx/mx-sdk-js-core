import { BigNumber } from "bignumber.js";
import { IAddress } from "../interface";
import { DraftTransaction } from "../draftTransaction";
import { ArgSerializer, CodeMetadata, ContractFunction, EndpointDefinition } from "../smartcontracts";
import { byteArrayToHex } from "../utils.codec";
import { CONTRACT_DEPLOY_ADDRESS, VM_TYPE_WASM_VM } from "../constants";
import { NativeSerializer } from "../smartcontracts/nativeSerializer";
import { Err, ErrBadUsage } from "../errors";
import { Address } from "../address";
import { DraftTransactionBuilder } from "./draftTransactionBuilder";
import { TokenTransfer } from "../tokenTransfer";

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

    constructor({
        config,
        abi
    }: {
        config: Config;
        abi?: Abi;
    }) {
        this.config = config;
        this.abiRegistry = abi;
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
        contractAddress: IAddress,
        functionName: string,
        gasLimit: BigNumber.Value,
        args?: any[],
        nativeTokenTransfer?: BigNumber.Value,
        tokenTransfers?: TokenTransfer[]
    }): DraftTransaction {
        if (options.nativeTokenTransfer && options.tokenTransfers?.length) {
            throw new ErrBadUsage("Can't send both native token and ESDT/NFT tokens");
        }

        const args = options.args || [];
        let parts: string[] = [options.functionName];

        const preparedArgs = this.argsToDataParts(args, this.abiRegistry?.getEndpoint(options.functionName));
        parts = parts.concat(preparedArgs);

        return new DraftTransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.contractAddress,
            dataParts: parts,
            gasLimit: options.gasLimit,
            addDataMovementGas: false
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
