import { Address } from "../address";
import { CONTRACT_DEPLOY_ADDRESS, VM_TYPE_WASM_VM } from "../constants";
import { Err, ErrBadUsage } from "../errors";
import { IAddress } from "../interface";
import { ArgSerializer, CodeMetadata, ContractFunction, EndpointDefinition } from "../smartcontracts";
import { NativeSerializer } from "../smartcontracts/nativeSerializer";
import { NextTokenTransfer, Token } from "../tokens";
import { Transaction } from "../transaction";
import { byteArrayToHex, utf8ToHex } from "../utils.codec";
import { TokenTransfersDataBuilder } from "./tokenTransfersDataBuilder";
import { TransactionBuilder } from "./transactionBuilder";

interface Config {
    chainID: string;
    minGasLimit: bigint;
    gasLimitPerByte: bigint;
}

interface IAbi {
    constructorDefinition: EndpointDefinition;

    getEndpoint(name: string | ContractFunction): EndpointDefinition;
}

interface TokenComputer {
    isFungible(token: Token): boolean;
}

/**
 * Use this class to create transactions to deploy, call or upgrade a smart contract.
 */
export class SmartContractTransactionsFactory {
    private readonly config: Config;
    private readonly abi?: IAbi;
    private readonly tokenComputer: TokenComputer;
    private readonly dataArgsBuilder: TokenTransfersDataBuilder;

    constructor({ config, abi, tokenComputer }: { config: Config; abi?: IAbi; tokenComputer: TokenComputer }) {
        this.config = config;
        this.abi = abi;
        this.tokenComputer = tokenComputer;
        this.dataArgsBuilder = new TokenTransfersDataBuilder();
    }

    createTransactionForDeploy(options: {
        sender: IAddress;
        bytecode: Uint8Array;
        gasLimit: bigint;
        args?: any[];
        nativeTransferAmount?: bigint;
        isUpgradeable?: boolean;
        isReadable?: boolean;
        isPayable?: boolean;
        isPayableBySmartContract?: boolean;
    }): Transaction {
        const nativeTransferAmount = options.nativeTransferAmount ?? 0n;
        const isUpgradeable = options.isUpgradeable ?? true;
        const isReadable = options.isReadable ?? true;
        const isPayable = options.isPayable ?? false;
        const isPayableBySmartContract = options.isPayableBySmartContract ?? true;
        const args = options.args || [];
        const metadata = new CodeMetadata(isUpgradeable, isReadable, isPayable, isPayableBySmartContract);
        let parts = [byteArrayToHex(options.bytecode), byteArrayToHex(VM_TYPE_WASM_VM), metadata.toString()];
        const preparedArgs = this.argsToDataParts(args, this.abi?.constructorDefinition);
        parts = parts.concat(preparedArgs);

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: Address.fromBech32(CONTRACT_DEPLOY_ADDRESS),
            dataParts: parts,
            gasLimit: options.gasLimit,
            addDataMovementGas: false,
            amount: nativeTransferAmount,
        }).build();
    }

    createTransactionForExecute(options: {
        sender: IAddress;
        contract: IAddress;
        functionName: string;
        gasLimit: bigint;
        args?: any[];
        nativeTransferAmount?: bigint;
        tokenTransfers?: NextTokenTransfer[];
    }): Transaction {
        const args = options.args || [];
        const tokenTransfer = options.tokenTransfers || [];
        const nativeTransferAmount = options.nativeTransferAmount ?? 0n;
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
        dataParts = dataParts.concat(this.argsToDataParts(args, this.abi?.getEndpoint(options.functionName)));

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: receiver,
            dataParts: dataParts,
            gasLimit: options.gasLimit,
            addDataMovementGas: false,
            amount: nativeTransferAmount,
        }).build();
    }

    createTransactionForUpgrade(options: {
        sender: IAddress;
        contract: IAddress;
        bytecode: Uint8Array;
        gasLimit: bigint;
        args?: any[];
        nativeTransferAmount?: bigint;
        isUpgradeable?: boolean;
        isReadable?: boolean;
        isPayable?: boolean;
        isPayableBySmartContract?: boolean;
    }): Transaction {
        const nativeTransferAmount = options.nativeTransferAmount ?? 0n;

        const isUpgradeable = options.isUpgradeable ?? true;
        const isReadable = options.isReadable ?? true;
        const isPayable = options.isPayable ?? false;
        const isPayableBySmartContract = options.isPayableBySmartContract ?? true;

        const args = options.args || [];
        const metadata = new CodeMetadata(isUpgradeable, isReadable, isPayable, isPayableBySmartContract);

        let parts = ["upgradeContract", byteArrayToHex(options.bytecode), metadata.toString()];
        const preparedArgs = this.argsToDataParts(args, this.abi?.constructorDefinition);
        parts = parts.concat(preparedArgs);

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.contract,
            dataParts: parts,
            gasLimit: options.gasLimit,
            addDataMovementGas: false,
            amount: nativeTransferAmount,
        }).build();
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
}
