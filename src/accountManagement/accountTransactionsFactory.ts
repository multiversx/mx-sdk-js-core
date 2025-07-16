import { IGasLimitEstimator } from "../core";
import { Address } from "../core/address";
import { BaseFactory } from "../core/baseFactory";
import { Transaction } from "../core/transaction";
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

export class AccountTransactionsFactory extends BaseFactory {
    private readonly config: IConfig;

    constructor(options: { config: IConfig; gasLimitEstimator?: IGasLimitEstimator }) {
        super({ config: options.config, gasLimitEstimator: options.gasLimitEstimator });
        this.config = options.config;
    }

    createTransactionForSavingKeyValue(sender: Address, options: SaveKeyValueInput): Transaction {
        const functionName = "SaveKeyValue";
        const keyValueParts = this.computeDataPartsForSavingKeyValue(options.keyValuePairs);
        const dataParts = [functionName, ...keyValueParts];
        const extraGas = this.computeExtraGasForSavingKeyValue(options.keyValuePairs);

        const transaction = new Transaction({
            sender,
            receiver: sender,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        this.setGasLimit(transaction, undefined, extraGas);

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

        const transaction = new Transaction({
            sender,
            receiver: sender,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        this.setGasLimit(transaction, undefined, this.config.gasLimitSetGuardian);

        return transaction;
    }

    createTransactionForGuardingAccount(sender: Address): Transaction {
        const dataParts = ["GuardAccount"];

        const transaction = new Transaction({
            sender,
            receiver: sender,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        this.setGasLimit(transaction, undefined, this.config.gasLimitGuardAccount);

        return transaction;
    }

    createTransactionForUnguardingAccount(sender: Address): Transaction {
        const dataParts = ["UnGuardAccount"];

        const transaction = new Transaction({
            sender,
            receiver: sender,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        this.setGasLimit(transaction, undefined, this.config.gasLimitUnguardAccount);

        return transaction;
    }
}
