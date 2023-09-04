import { BigNumber } from "bignumber.js";
import { IAddress } from "../interface";
import { TransactionIntent } from "../transactionIntent";
import { AbiRegistry, ArgSerializer, CodeMetadata, TypedValue } from "../smartcontracts";
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
        isUpgradeable: boolean = true,
        isReadable: boolean = true,
        isPayable: boolean = false,
        isPayableBySmartContract: boolean = true
    ): TransactionIntent {
        const metadata = new CodeMetadata(isUpgradeable, isReadable, isPayable, isPayableBySmartContract);
        let parts = [
            byteArrayToHex(bytecode),
            byteArrayToHex(VM_TYPE_WASM_VM),
            metadata.toString()
        ];

        parts = parts.concat(this.argsToStrings(args));

        return new TransactionIntentBuilder(
            this.config,
            sender,
            Address.fromBech32(CONTRACT_DEPLOY_ADDRESS),
            parts,
            gasLimit
        ).build()
    }

    private argsToStrings(args: any[]): string[] {
        if (this.abiRegistry !== undefined) {
            const constructorDefinition = this.abiRegistry.constructorDefinition
            const typedArgs = NativeSerializer.nativeToTypedValues(args, constructorDefinition)
            return new ArgSerializer().valuesToStrings(args);
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
