import { IAccount } from "../accounts/interfaces";
import { Address, BaseController, BaseControllerInput } from "../core";
import { Transaction } from "../core/transaction";
import { TransactionsFactoryConfig } from "../core/transactionsFactoryConfig";
import * as resources from "./resources";
import { TransferTransactionsFactory } from "./transferTransactionsFactory";

export class TransfersController extends BaseController {
    private factory: TransferTransactionsFactory;

    constructor(options: { chainID: string }) {
        super();
        this.factory = new TransferTransactionsFactory({ config: new TransactionsFactoryConfig(options) });
    }

    async createTransactionForNativeTokenTransfer(
        sender: IAccount,
        nonce: bigint,
        options: resources.NativeTokenTransferInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForNativeTokenTransfer(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    async createTransactionForEsdtTokenTransfer(
        sender: IAccount,
        nonce: bigint,
        options: resources.CustomTokenTransferInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForESDTTokenTransfer(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    async createTransactionForTransfer(
        sender: IAccount,
        nonce: bigint,
        options: resources.CreateTransferTransactionInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForTransfer(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }
}
