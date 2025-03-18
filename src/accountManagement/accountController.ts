import { Address, BaseController, BaseControllerInput } from "../core";
import { IAccount } from "../core/interfaces";
import { Transaction } from "../core/transaction";
import { TransactionsFactoryConfig } from "../core/transactionsFactoryConfig";
import { AccountTransactionsFactory } from "./accountTransactionsFactory";
import { SaveKeyValueInput, SetGuardianInput } from "./resources";

export class AccountController extends BaseController {
    private factory: AccountTransactionsFactory;

    constructor(options: { chainID: string }) {
        super();
        this.factory = new AccountTransactionsFactory({
            config: new TransactionsFactoryConfig(options),
        });
    }

    async createTransactionForSavingKeyValue(
        sender: IAccount,
        nonce: bigint,
        options: SaveKeyValueInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForSavingKeyValue(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    async createTransactionForSettingGuardian(
        sender: IAccount,
        nonce: bigint,
        options: SetGuardianInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForSettingGuardian(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    async createTransactionForGuardingAccount(
        sender: IAccount,
        nonce: bigint,
        options: { relayer?: Address; gasPrice?: bigint; gasLimit?: bigint },
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForGuardingAccount(sender.address);
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    async createTransactionForUnguardingAccount(
        sender: IAccount,
        nonce: bigint,
        options: BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForUnguardingAccount(sender.address);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }
}
