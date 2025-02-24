import { IAccount } from "../accounts/interfaces";
import { Address } from "../core";
import { Transaction } from "../core/transaction";
import { TransactionComputer } from "../core/transactionComputer";
import { TransactionsFactoryConfig } from "../core/transactionsFactoryConfig";
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
        guardian: Address = Address.empty(),
        relayer: Address = Address.empty()
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForNativeTokenTransfer(sender.address, options);

        transaction.guardian = guardian;
        transaction.relayer = relayer;
        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForEsdtTokenTransfer(
        sender: IAccount,
        nonce: bigint,
        options: resources.CustomTokenTransferInput,
        guardian: Address = Address.empty(),
        relayer: Address = Address.empty()
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForESDTTokenTransfer(sender.address, options);

        transaction.guardian = guardian;
        transaction.relayer = relayer;
        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForTransfer(
        sender: IAccount,
        nonce: bigint,
        options: resources.CreateTransferTransactionInput,
        guardian: Address = Address.empty(),
        relayer: Address = Address.empty()
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForTransfer(sender.address, options);

        transaction.guardian = guardian;
        transaction.relayer = relayer;
        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }
}
