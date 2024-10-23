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

    async createTransactionForSavingKeyValue(
        sender: IAccount,
        nonce: bigint,
        keyValuePairs: Map<Uint8Array, Uint8Array>,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForSavingKeyValue({ sender: sender.address, keyValuePairs });

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForSettingGuardian(
        sender: IAccount,
        nonce: bigint,
        guardianAddress: IAddress,
        serviceId: string,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForSettingGuardian({
            sender: sender.address,
            guardianAddress,
            serviceID: serviceId,
        });

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForGuardingAccount(sender: IAccount, nonce: bigint): Promise<Transaction> {
        const transaction = this.factory.createTransactionForGuardingAccount({ sender: sender.address });

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForUnguardingAccount(sender: IAccount, nonce: bigint): Promise<Transaction> {
        const transaction = this.factory.createTransactionForUnguardingAccount({ sender: sender.address });

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }
}
