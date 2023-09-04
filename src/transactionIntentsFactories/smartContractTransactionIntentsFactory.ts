import { BigNumber } from "bignumber.js";
import { IAddress } from "../interface";
import { TransactionIntent } from "../transactionIntent";
import { AbiRegistry, ArgSerializer, CodeMetadata, EndpointDefinition, TypedValue } from "../smartcontracts";
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

export class SmartContractTransactionIntentsFactory {
    private config: Config;
    private abiRegistry?: AbiRegistry;

    constructor(config: Config, abi?: AbiRegistry) {
        this.config = config;
        this.abiRegistry = abi;
    }

    createTransactionIntentForDeploy(
        sender: IAddress,
        bytecode: Uint8Array,
        gasLimit: BigNumber.Value,
        args: any[],
        isUpgradeable = true,
        isReadable = true,
        isPayable = false,
        isPayableBySmartContract = true
    ): TransactionIntent {
        const metadata = new CodeMetadata(isUpgradeable, isReadable, isPayable, isPayableBySmartContract);
        let parts = [
            byteArrayToHex(bytecode),
            byteArrayToHex(VM_TYPE_WASM_VM),
            metadata.toString()
        ];

        let preparedArgs: string[];
        if (this.abiRegistry) {
            preparedArgs = this.argsToStrings(args, this.abiRegistry.constructorDefinition)
        }
        else {
            preparedArgs = this.argsToStrings(args)
        }
        parts = parts.concat(preparedArgs);

        return new TransactionIntentBuilder(
            this.config,
            sender,
            Address.fromBech32(CONTRACT_DEPLOY_ADDRESS),
            parts,
            gasLimit
        ).build();
    }

    createTransactionIntentForExecute(
        sender: IAddress,
        contractAddress: IAddress,
        func: string,
        gasLimit: BigNumber.Value,
        args: any[] = []
    ): TransactionIntent {
        let parts: string[] = [func];

        let preparedArgs: string[];
        if (this.abiRegistry) {
            preparedArgs = this.argsToStrings(args, this.abiRegistry.getEndpoint(func));
        }
        else {
            preparedArgs = this.argsToStrings(args);
        }
        parts = parts.concat(preparedArgs);

        return new TransactionIntentBuilder(
            this.config,
            sender,
            contractAddress,
            parts,
            gasLimit
        ).build();
    }

    createTransactionIntentForUpgrade(
        sender: IAddress,
        contract: IAddress,
        bytecode: Uint8Array,
        gasLimit: BigNumber.Value,
        args: any[],
        isUpgradeable = true,
        isReadable = true,
        isPayable = false,
        isPayableBySmartContract = true
    ): TransactionIntent {
        const metadata = new CodeMetadata(isUpgradeable, isReadable, isPayable, isPayableBySmartContract);

        let parts = [
            "upgradeContract",
            byteArrayToHex(bytecode),
            metadata.toString()
        ];

        let preparedArgs: string[];
        if (this.abiRegistry) {
            preparedArgs = this.argsToStrings(args, this.abiRegistry.constructorDefinition)
        }
        else {
            preparedArgs = this.argsToStrings(args)
        }
        parts = parts.concat(preparedArgs);

        return new TransactionIntentBuilder(
            this.config,
            sender,
            contract,
            parts,
            gasLimit
        ).build();
    }

    private argsToStrings(args: any[], endpoint?: EndpointDefinition): string[] {
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
            if (!(arg instanceof TypedValue)) {
                return false;
            }
        }
        return true;
    }
}
