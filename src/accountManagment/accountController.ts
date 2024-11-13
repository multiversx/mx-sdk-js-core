import { IAccount } from "../accounts/interfaces";
import { Transaction } from "../transaction";
import { TransactionComputer } from "../transactionComputer";
import { TransactionsFactoryConfig } from "../transactionsFactoryConfig";
import { AccountTransactionsFactory } from "./accountTransactionsFactory";
import { GuardianInteractionInput, SaveKeyValueInput, SetGuardianInput } from "./resources";

export class AccountController {
    private factory: AccountTransactionsFactory;
    private txComputer: TransactionComputer;

    constructor(options: { chainID: string }) {
        this.factory = new AccountTransactionsFactory({
            config: new TransactionsFactoryConfig(options),
        });
        this.txComputer = new TransactionComputer();
    }

    async createTransactionForSavingKeyValue(sender: IAccount, options: SaveKeyValueInput): Promise<Transaction> {
        const transaction = this.factory.createTransactionForSavingKeyValue({
            sender: sender.address,
            keyValuePairs: options.keyValuePairs,
        });

        transaction.nonce = options.nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForSettingGuardian(sender: IAccount, options: SetGuardianInput): Promise<Transaction> {
        const transaction = this.factory.createTransactionForSettingGuardian({ ...options, sender: sender.address });

        transaction.nonce = options.nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForGuardingAccount(
        sender: IAccount,
        options: GuardianInteractionInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForGuardingAccount({ sender: sender.address });

        transaction.nonce = options.nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForUnguardingAccount(
        sender: IAccount,
        options: GuardianInteractionInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForUnguardingAccount({ sender: sender.address });

        transaction.nonce = options.nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }
}
