import { Abi, ArgSerializer, EndpointDefinition, isTyped, NativeSerializer } from "../abi";
import { Address, CodeMetadata, IGasLimitEstimator } from "../core";
import { BaseFactory } from "../core/baseFactory";
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
import { byteArrayToHex, utf8ToHex, zeroPadStringIfOddLength } from "../core/utils.codec";
import * as resources from "./resources";

interface IConfig {
    chainID: string;
    addressHrp: string;
    minGasLimit: bigint;
    gasLimitPerByte: bigint;
    gasLimitClaimDeveloperRewards: bigint;
    gasLimitChangeOwnerAddress: bigint;
}

/**
 * Use this class to create transactions to deploy, call or upgrade a smart contract.
 */
export class SmartContractTransactionsFactory extends BaseFactory {
    private readonly config: IConfig;
    private readonly abi?: Abi;
    private readonly tokenComputer: TokenComputer;
    private readonly dataArgsBuilder: TokenTransfersDataBuilder;
    private readonly contractDeployAddress: Address;

    constructor(options: { config: IConfig; abi?: Abi; gasLimitEstimator?: IGasLimitEstimator }) {
        super({ config: options.config, gasLimitEstimator: options.gasLimitEstimator });
        this.config = options.config;
        this.abi = options.abi;
        this.tokenComputer = new TokenComputer();
        this.dataArgsBuilder = new TokenTransfersDataBuilder();
        this.contractDeployAddress = Address.newFromHex(CONTRACT_DEPLOY_ADDRESS_HEX, this.config.addressHrp);
    }

    async createTransactionForDeploy(sender: Address, options: resources.ContractDeployInput): Promise<Transaction> {
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

        const transaction = new Transaction({
            sender,
            receiver: this.contractDeployAddress,
            value: nativeTransferAmount,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, options.gasLimit);

        return transaction;
    }

    async createTransactionForExecute(sender: Address, options: resources.ContractExecuteInput): Promise<Transaction> {
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

        const transaction = new Transaction({
            sender,
            receiver,
            value: nativeTransferAmount,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, options.gasLimit);

        return transaction;
    }

    async createTransactionForUpgrade(sender: Address, options: resources.ContractUpgradeInput): Promise<Transaction> {
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

        const transaction = new Transaction({
            sender,
            receiver: options.contract,
            value: nativeTransferAmount,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, options.gasLimit);

        return transaction;
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

    async createTransactionForClaimingDeveloperRewards(options: {
        sender: Address;
        contract: Address;
        gasLimit?: bigint;
    }): Promise<Transaction> {
        const dataParts = ["ClaimDeveloperRewards"];

        const transaction = new Transaction({
            sender: options.sender,
            receiver: options.contract,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, options.gasLimit, this.config.gasLimitClaimDeveloperRewards);

        return transaction;
    }

    async createTransactionForChangingOwnerAddress(options: {
        sender: Address;
        contract: Address;
        newOwner: Address;
        gasLimit?: bigint;
    }): Promise<Transaction> {
        const dataParts = ["ChangeOwnerAddress", options.newOwner.toHex()];

        const transaction = new Transaction({
            sender: options.sender,
            receiver: options.contract,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, options.gasLimit, this.config.gasLimitChangeOwnerAddress);

        return transaction;
    }

    protected argsToDataParts(args: any[], endpoint?: EndpointDefinition): string[] {
        if (endpoint) {
            const typedArgs = NativeSerializer.nativeToTypedValues(args, endpoint);
            return new ArgSerializer().valuesToStrings(typedArgs);
        }

        if (this.areArgsOfTypedValue(args)) {
            return new ArgSerializer().valuesToStrings(args);
        }

        if (this.areArgsBuffers(args)) {
            return args.map((arg) => zeroPadStringIfOddLength(Buffer.from(arg).toString("hex")));
        }

        throw new Err("Can't convert args to TypedValues");
    }

    private areArgsBuffers(args: any[]): boolean {
        for (const arg of args) {
            if (!ArrayBuffer.isView(arg)) {
                return false;
            }
        }

        return true;
    }

    private areArgsOfTypedValue(args: any[]): boolean {
        return args.every((arg) => isTyped(arg));
    }
}
