import { IAccount } from "../accounts/interfaces";
import { Address } from "../core";
import { Transaction } from "../core/transaction";
import { TransactionComputer } from "../core/transactionComputer";
import { TransactionsFactoryConfig } from "../core/transactionsFactoryConfig";
import { AccountTransactionsFactory } from "./accountTransactionsFactory";
import { SaveKeyValueInput, SetGuardianInput } from "./resources";

export class AccountController {
    private factory: AccountTransactionsFactory;
    private txComputer: TransactionComputer;

    constructor(options: { chainID: string }) {
        this.factory = new AccountTransactionsFactory({
            config: new TransactionsFactoryConfig(options),
        });
        this.txComputer = new TransactionComputer();
    }

    async createTransactionForSavingKeyValue(
        sender: IAccount,
        nonce: bigint,
        options: SaveKeyValueInput,
        guardian: Address = Address.empty(),
        relayer: Address = Address.empty()
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForSavingKeyValue(sender.address, options);

        transaction.guardian = guardian;
        transaction.relayer = relayer;
        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForSettingGuardian(
        sender: IAccount,
        nonce: bigint,
        options: SetGuardianInput,
        guardian: Address = Address.empty(),
        relayer: Address = Address.empty()
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForSettingGuardian(sender.address, options);

        transaction.guardian = guardian;
        transaction.relayer = relayer;
        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForGuardingAccount(sender: IAccount, nonce: bigint,
        guardian: Address = Address.empty(),
        relayer: Address = Address.empty()): Promise<Transaction> {
        const transaction = this.factory.createTransactionForGuardingAccount(sender.address);

        transaction.guardian = guardian;
        transaction.relayer = relayer;
        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForUnguardingAccount(sender: IAccount, nonce: bigint,
        guardian: Address = Address.empty(),
        relayer: Address = Address.empty()): Promise<Transaction> {
        const transaction = this.factory.createTransactionForUnguardingAccount(sender.address);

        transaction.guardian = guardian;
        transaction.relayer = relayer;
        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }
}
