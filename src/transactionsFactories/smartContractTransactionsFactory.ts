import { Address } from "../address";
import { CONTRACT_DEPLOY_ADDRESS, VM_TYPE_WASM_VM } from "../constants";
import { Err, ErrBadUsage } from "../errors";
import { IAddress } from "../interface";
import { Logger } from "../logger";
import { ArgSerializer, CodeMetadata, ContractFunction, EndpointDefinition } from "../smartcontracts";
import { NativeSerializer } from "../smartcontracts/nativeSerializer";
import { TokenComputer, TokenTransfer } from "../tokens";
import { Transaction } from "../transaction";
import { byteArrayToHex, utf8ToHex } from "../utils.codec";
import { TokenTransfersDataBuilder } from "./tokenTransfersDataBuilder";
import { TransactionBuilder } from "./transactionBuilder";

interface IConfig {
    chainID: string;
    minGasLimit: bigint;
    gasLimitPerByte: bigint;
    gasLimitClaimDeveloperRewards: bigint;
    gasLimitChangeOwnerAddress: bigint;
}

interface IAbi {
    constructorDefinition: EndpointDefinition;
    upgradeConstructorDefinition?: EndpointDefinition;

    getEndpoint(name: string | ContractFunction): EndpointDefinition;
}

/**
 * Use this class to create transactions to deploy, call or upgrade a smart contract.
 */
export class SmartContractTransactionsFactory {
    private readonly config: IConfig;
    private readonly abi?: IAbi;
    private readonly tokenComputer: TokenComputer;
    private readonly dataArgsBuilder: TokenTransfersDataBuilder;

    constructor(options: { config: IConfig; abi?: IAbi }) {
        this.config = options.config;
        this.abi = options.abi;
        this.tokenComputer = new TokenComputer();
        this.dataArgsBuilder = new TokenTransfersDataBuilder();
    }

    createTransactionForDeploy(options: {
        sender: IAddress;
        bytecode: Uint8Array;
        gasLimit: bigint;
        arguments?: any[];
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
        const args = options.arguments || [];
        const metadata = new CodeMetadata(isUpgradeable, isReadable, isPayable, isPayableBySmartContract);

        const dataParts = [byteArrayToHex(options.bytecode), byteArrayToHex(VM_TYPE_WASM_VM), metadata.toString()];
        const endpoint = this.abi?.constructorDefinition;
        const preparedArgs = this.argsToDataParts(args, endpoint);
        dataParts.push(...preparedArgs);

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: Address.fromBech32(CONTRACT_DEPLOY_ADDRESS),
            dataParts: dataParts,
            gasLimit: options.gasLimit,
            addDataMovementGas: false,
            amount: nativeTransferAmount,
        }).build();
    }

    createTransactionForExecute(options: {
        sender: IAddress;
        contract: IAddress;
        function: string;
        gasLimit: bigint;
        arguments?: any[];
        nativeTransferAmount?: bigint;
        tokenTransfers?: TokenTransfer[];
    }): Transaction {
        const args = options.arguments || [];
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
                dataParts = this.dataArgsBuilder.buildDataPartsForESDTTransfer(transfer);
            } else {
                dataParts = this.dataArgsBuilder.buildDataPartsForSingleESDTNFTTransfer(transfer, receiver);
                receiver = options.sender;
            }
        } else if (numberOfTokens > 1) {
            dataParts = this.dataArgsBuilder.buildDataPartsForMultiESDTNFTTransfer(receiver, tokenTransfer);
            receiver = options.sender;
        }

        dataParts.push(dataParts.length ? utf8ToHex(options.function) : options.function);

        const endpoint = this.abi?.getEndpoint(options.function);
        const preparedArgs = this.argsToDataParts(args, endpoint);
        dataParts.push(...preparedArgs);

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
        arguments?: any[];
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

        const args = options.arguments || [];
        const metadata = new CodeMetadata(isUpgradeable, isReadable, isPayable, isPayableBySmartContract);

        const dataParts = ["upgradeContract", byteArrayToHex(options.bytecode), metadata.toString()];
        const endpoint = this.getEndpointForUpgrade();
        const preparedArgs = this.argsToDataParts(args, endpoint);
        dataParts.push(...preparedArgs);

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.contract,
            dataParts: dataParts,
            gasLimit: options.gasLimit,
            addDataMovementGas: false,
            amount: nativeTransferAmount,
        }).build();
    }

    private getEndpointForUpgrade(): EndpointDefinition | undefined {
        if (!this.abi) {
            return undefined;
        }

        if (this.abi.upgradeConstructorDefinition) {
            return this.abi.upgradeConstructorDefinition;
        }

        try {
            return this.abi.getEndpoint("upgrade");
        } catch (error) {
            // Contracts written using an old Rust framework and deployed prior Sirius might not describe the 'upgrade' endpoint in the ABI.

            Logger.warn(
                "In the ABI, cannot find the 'upgrade' endpoint definition. Will use the constructor definition (fallback).",
            );

            return this.abi.constructorDefinition;
        }
    }

    createTransactionForClaimingDeveloperRewards(options: { sender: IAddress; contract: IAddress }): Transaction {
        const dataParts = ["ClaimDeveloperRewards"];

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.contract,
            dataParts: dataParts,
            gasLimit: this.config.gasLimitClaimDeveloperRewards,
            addDataMovementGas: false,
        }).build();
    }

    createTransactionForChangingOwnerAddress(options: {
        sender: IAddress;
        contract: IAddress;
        newOwner: IAddress;
    }): Transaction {
        const dataParts = ["ChangeOwnerAddress", Address.fromBech32(options.newOwner.bech32()).toHex()];

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.contract,
            dataParts: dataParts,
            gasLimit: this.config.gasLimitChangeOwnerAddress,
            addDataMovementGas: false,
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
