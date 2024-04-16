import { Address } from "../address";
import { IAddress } from "../interface";
import { Transaction } from "../transaction";
import { TransactionBuilder } from "./transactionBuilder";

interface IConfig {
    chainID: string;
    minGasLimit: bigint;
    gasLimitPerByte: bigint;
    gasLimitSaveKeyValue: bigint;
    gasLimitPersistPerByte: bigint;
    gasLimitStorePerByte: bigint;
    gasLimitSetGuardian: bigint;
    gasLimitGuardAccount: bigint;
    gasLimitUnguardAccount: bigint;
    extraGasLimitForGuardedTransaction: bigint;
}

export class AccountTransactionsFactory {
    private readonly config: IConfig;

    constructor(options: { config: IConfig }) {
        this.config = options.config;
    }

    createTransactionForSavingKeyValue(options: {
        sender: IAddress;
        keyValuePairs: Map<Uint8Array, Uint8Array>;
    }): Transaction {
        const functionName = "SaveKeyValue";
        const keyValueParts = this.computeDataPartsForSavingKeyValue(options.keyValuePairs);
        const dataParts = [functionName, ...keyValueParts];
        const extraGas = this.computeExtraGasForSavingKeyValue(options.keyValuePairs);

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.sender,
            dataParts: dataParts,
            gasLimit: extraGas,
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForSettingGuardian(options: {
        sender: IAddress;
        guardianAddress: IAddress;
        serviceID: string;
    }): Transaction {
        const dataParts = [
            "SetGuardian",
            Address.fromBech32(options.guardianAddress.bech32()).toHex(),
            Buffer.from(options.serviceID).toString("hex"),
        ];

        const gasLimit = this.config.gasLimitSetGuardian + this.config.extraGasLimitForGuardedTransaction;

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.sender,
            dataParts: dataParts,
            gasLimit: gasLimit,
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForGuardingAccount(options: { sender: IAddress }): Transaction {
        const dataParts = ["GuardAccount"];
        const gasLimit = this.config.gasLimitGuardAccount + this.config.extraGasLimitForGuardedTransaction;

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.sender,
            dataParts: dataParts,
            gasLimit: gasLimit,
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForUnguardingAccount(options: { sender: IAddress }): Transaction {
        const dataParts = ["UnGuardAccount"];
        const gasLimit = this.config.gasLimitUnguardAccount + this.config.extraGasLimitForGuardedTransaction;

        const transaction = new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.sender,
            dataParts: dataParts,
            gasLimit: gasLimit,
            addDataMovementGas: true,
        }).build();
        transaction.options = 2;

        return transaction;
    }

    private computeExtraGasForSavingKeyValue(keyValuePairs: Map<Uint8Array, Uint8Array>): bigint {
        let extraGas = 0n;

        keyValuePairs.forEach((value, key) => {
            extraGas +=
                this.config.gasLimitPersistPerByte * BigInt(key.length + value.length) +
                this.config.gasLimitStorePerByte * BigInt(value.length);
        });

        return extraGas + this.config.gasLimitSaveKeyValue;
    }

    private computeDataPartsForSavingKeyValue(keyValuePairs: Map<Uint8Array, Uint8Array>): string[] {
        let dataParts: string[] = [];

        keyValuePairs.forEach((value, key) => {
            dataParts.push(...[Buffer.from(key).toString("hex"), Buffer.from(value).toString("hex")]);
        });

        return dataParts;
    }
}
