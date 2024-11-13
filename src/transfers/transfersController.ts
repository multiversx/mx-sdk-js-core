import { IAccount } from "../accounts/interfaces";
import { Transaction } from "../transaction";
import { TransactionComputer } from "../transactionComputer";
import { TransactionsFactoryConfig } from "../transactionsFactoryConfig";
import * as resources from "./resources";
import { TransferTransactionsFactory } from "./transferTransactionsFactory";

export class TransfersController {
    private factory: TransferTransactionsFactory;
    private txComputer: TransactionComputer;

    constructor(options: { chainID: string }) {
        this.factory = new TransferTransactionsFactory({ config: new TransactionsFactoryConfig(options) });
        this.txComputer = new TransactionComputer();
    }

    async createTransactionForNativeTokenTransfer(
        sender: IAccount,
        nonce: bigint,
        options: resources.NativeTokenTransferInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForNativeTokenTransfer(sender.address, options);

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForEsdtTokenTransfer(
        sender: IAccount,
        nonce: bigint,
        options: resources.ESDTTokenTransferInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForESDTTokenTransfer(sender.address, options);

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForTransfer(
        sender: IAccount,
        nonce: bigint,
        options: resources.CreateTransferTransactionInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForTransfer(sender.address, options);

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }
}
