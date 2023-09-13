import { BigNumber } from "bignumber.js";
import { IAddress } from "../interface";
import { TransactionIntent } from "../transactionIntent";
import { AbiRegistry, ArgSerializer, CodeMetadata, ContractFunction, EndpointDefinition } from "../smartcontracts";
import { byteArrayToHex } from "../utils.codec";
import { CONTRACT_DEPLOY_ADDRESS, VM_TYPE_WASM_VM } from "../constants";
import { NativeSerializer } from "../smartcontracts/nativeSerializer";
import { Err } from "../errors";
import { Address } from "../address";
import { TransactionIntentBuilder } from "./transactionIntentBuilder";

interface Config {
    chainID: string;
    minGasLimit: BigNumber.Value;
    gasLimitPerByte: BigNumber.Value;
}

interface Abi {
    constructorDefinition: EndpointDefinition;

    getEndpoint(name: string | ContractFunction): EndpointDefinition;
}


export class SmartContractTransactionIntentsFactory {
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

    createTransactionIntentForDeploy(options: {
        sender: IAddress,
        bytecode: Uint8Array,
        gasLimit: BigNumber.Value,
        args?: any[],
        isUpgradeable?: boolean,
        isReadable?: boolean,
        isPayable?: boolean,
        isPayableBySmartContract?: boolean
    }): TransactionIntent {
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

        return new TransactionIntentBuilder({
            config: this.config,
            sender: options.sender,
            receiver: Address.fromBech32(CONTRACT_DEPLOY_ADDRESS),
            dataParts: parts,
            executionGasLimit: options.gasLimit
        }).build();
    }

    createTransactionIntentForExecute(options: {
        sender: IAddress,
        contractAddress: IAddress,
        functionName: string,
        gasLimit: BigNumber.Value,
        args?: any[]
    }
    ): TransactionIntent {
        const args = options.args || [];
        let parts: string[] = [options.functionName];

        const preparedArgs = this.argsToDataParts(args, this.abiRegistry?.getEndpoint(options.functionName));
        parts = parts.concat(preparedArgs);

        return new TransactionIntentBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.contractAddress,
            dataParts: parts,
            executionGasLimit: options.gasLimit
        }).build();
    }

    createTransactionIntentForUpgrade(options: {
        sender: IAddress,
        contract: IAddress,
        bytecode: Uint8Array,
        gasLimit: BigNumber.Value,
        args?: any[],
        isUpgradeable?: boolean,
        isReadable?: boolean,
        isPayable?: boolean,
        isPayableBySmartContract?: boolean
    }
    ): TransactionIntent {
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

        return new TransactionIntentBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.contract,
            dataParts: parts,
            executionGasLimit: options.gasLimit
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
