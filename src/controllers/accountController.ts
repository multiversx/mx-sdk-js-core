import { IAddress } from "../interface";
import { Transaction } from "../transaction";
import { TransactionComputer } from "../transactionComputer";
import { AccountTransactionsFactory, TransactionsFactoryConfig } from "../transactionsFactories";
import { IAccount } from "./interfaces";

export class AccountController {
    private factory: AccountTransactionsFactory;
    private txComputer: TransactionComputer;

    constructor(chainId: string) {
        this.factory = new AccountTransactionsFactory({ config: new TransactionsFactoryConfig({ chainID: chainId }) });
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

type SetGuardianInput = { nonce: bigint; guardianAddress: IAddress; serviceID: string };
type SaveKeyValueInput = { nonce: bigint; keyValuePairs: Map<Uint8Array, Uint8Array> };
type GuardianInteractionInput = { nonce: bigint };
