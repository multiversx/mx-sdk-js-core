import { Address } from "../core/address";
import { Transaction } from "../core/transaction";
import { TransactionBuilder } from "../core/transactionBuilder";
import { SaveKeyValueInput, SetGuardianInput } from "./resources";

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
}

export class AccountTransactionsFactory {
    private readonly config: IConfig;

    constructor(options: { config: IConfig }) {
        this.config = options.config;
    }

    createTransactionForSavingKeyValue(sender: Address, options: SaveKeyValueInput): Transaction {
        const functionName = "SaveKeyValue";
        const keyValueParts = this.computeDataPartsForSavingKeyValue(options.keyValuePairs);
        const dataParts = [functionName, ...keyValueParts];
        const extraGas = this.computeExtraGasForSavingKeyValue(options.keyValuePairs);

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: sender,
            dataParts: dataParts,
            gasLimit: extraGas,
            addDataMovementGas: true,
        }).build();
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
        const dataParts: string[] = [];

        keyValuePairs.forEach((value, key) => {
            dataParts.push(...[Buffer.from(key).toString("hex"), Buffer.from(value).toString("hex")]);
        });

        return dataParts;
    }

    createTransactionForSettingGuardian(sender: Address, options: SetGuardianInput): Transaction {
        const dataParts = [
            "SetGuardian",
            options.guardianAddress.toHex(),
            Buffer.from(options.serviceID).toString("hex"),
        ];

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: sender,
            dataParts: dataParts,
            gasLimit: this.config.gasLimitSetGuardian,
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForGuardingAccount(sender: Address): Transaction {
        const dataParts = ["GuardAccount"];

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: sender,
            dataParts: dataParts,
            gasLimit: this.config.gasLimitGuardAccount,
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForUnguardingAccount(sender: Address): Transaction {
        const dataParts = ["UnGuardAccount"];

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: sender,
            dataParts: dataParts,
            gasLimit: this.config.gasLimitUnguardAccount,
            addDataMovementGas: true,
        }).build();
    }
}
