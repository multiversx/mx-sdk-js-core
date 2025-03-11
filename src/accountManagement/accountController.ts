import { IAccount } from "../accounts/interfaces";
import { Address, BaseController } from "../core";
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
        options: SaveKeyValueInput & { guardian?: Address; relayer?: Address },
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForSavingKeyValue(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.addExtraGasLimitIfRequired(transaction);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    async createTransactionForSettingGuardian(
        sender: IAccount,
        nonce: bigint,
        options: SetGuardianInput & { guardian?: Address; relayer?: Address },
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForSettingGuardian(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.addExtraGasLimitIfRequired(transaction);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    async createTransactionForGuardingAccount(
        sender: IAccount,
        nonce: bigint,
        options: { relayer?: Address },
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForGuardingAccount(sender.address);
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.addExtraGasLimitIfRequired(transaction);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    async createTransactionForUnguardingAccount(
        sender: IAccount,
        nonce: bigint,
        options: { guardian: Address; relayer?: Address },
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForUnguardingAccount(sender.address);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.addExtraGasLimitIfRequired(transaction);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }
}
