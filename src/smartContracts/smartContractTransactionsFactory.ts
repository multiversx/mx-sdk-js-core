import { ArgSerializer, ContractFunction, EndpointDefinition, isTyped, NativeSerializer } from "../abi";
import { Address, CodeMetadata } from "../core";
import {
    CONTRACT_DEPLOY_ADDRESS_HEX,
    EGLD_IDENTIFIER_FOR_MULTI_ESDTNFT_TRANSFER,
    VM_TYPE_WASM_VM,
} from "../core/constants";
import { Err } from "../core/errors";
import { Logger } from "../core/logger";
import { TokenComputer, TokenTransfer } from "../core/tokens";
import { TokenTransfersDataBuilder } from "../core/tokenTransfersDataBuilder";
import { Transaction } from "../core/transaction";
import { TransactionBuilder } from "../core/transactionBuilder";
import { byteArrayToHex, utf8ToHex } from "../core/utils.codec";
import * as resources from "./resources";

interface IConfig {
    chainID: string;
    addressHrp: string;
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
    private readonly contractDeployAddress: Address;

    constructor(options: { config: IConfig; abi?: IAbi }) {
        this.config = options.config;
        this.abi = options.abi;
        this.tokenComputer = new TokenComputer();
        this.dataArgsBuilder = new TokenTransfersDataBuilder();
        this.contractDeployAddress = Address.newFromHex(CONTRACT_DEPLOY_ADDRESS_HEX, this.config.addressHrp);
    }

    createTransactionForDeploy(sender: Address, options: resources.ContractDeployInput): Transaction {
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
            sender: sender,
            receiver: this.contractDeployAddress,
            dataParts: dataParts,
            gasLimit: options.gasLimit,
            addDataMovementGas: false,
            amount: nativeTransferAmount,
        }).build();
    }

    createTransactionForExecute(sender: Address, options: resources.ContractExecuteInput): Transaction {
        const args = options.arguments || [];
        let tokenTransfers = options.tokenTransfers ? [...options.tokenTransfers] : [];
        let nativeTransferAmount = options.nativeTransferAmount ?? 0n;
        let numberOfTokens = tokenTransfers.length;

        if (nativeTransferAmount && numberOfTokens) {
            tokenTransfers.push(TokenTransfer.newFromNativeAmount(nativeTransferAmount));
            nativeTransferAmount = 0n;
            numberOfTokens++;
        }

        let receiver = options.contract;
        let dataParts: string[] = [];

        if (numberOfTokens === 1) {
            const transfer = tokenTransfers[0];

            if (transfer.token.identifier === EGLD_IDENTIFIER_FOR_MULTI_ESDTNFT_TRANSFER) {
                dataParts = this.dataArgsBuilder.buildDataPartsForMultiESDTNFTTransfer(receiver, tokenTransfers);
                receiver = sender;
            } else if (this.tokenComputer.isFungible(transfer.token)) {
                dataParts = this.dataArgsBuilder.buildDataPartsForESDTTransfer(transfer);
            } else {
                dataParts = this.dataArgsBuilder.buildDataPartsForSingleESDTNFTTransfer(transfer, receiver);
                receiver = sender;
            }
        } else if (numberOfTokens > 1) {
            dataParts = this.dataArgsBuilder.buildDataPartsForMultiESDTNFTTransfer(receiver, tokenTransfers);
            receiver = sender;
        }

        dataParts.push(dataParts.length ? utf8ToHex(options.function) : options.function);

        const endpoint = this.abi?.getEndpoint(options.function);

        const preparedArgs = this.argsToDataParts(args, endpoint);
        dataParts.push(...preparedArgs);

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: receiver,
            dataParts: dataParts,
            gasLimit: options.gasLimit,
            addDataMovementGas: false,
            amount: nativeTransferAmount,
        }).build();
    }

    createTransactionForUpgrade(sender: Address, options: resources.ContractUpgradeInput): Transaction {
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
            sender: sender,
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

    createTransactionForClaimingDeveloperRewards(options: { sender: Address; contract: Address }): Transaction {
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
        sender: Address;
        contract: Address;
        newOwner: Address;
    }): Transaction {
        const dataParts = ["ChangeOwnerAddress", options.newOwner.toHex()];

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
        return args.every((arg) => isTyped(arg));
    }
}
