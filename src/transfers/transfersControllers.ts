import { IAccount } from "../accounts/interfaces";
import { Address, BaseController } from "../core";
import { Transaction } from "../core/transaction";
import { TransactionComputer } from "../core/transactionComputer";
import { TransactionsFactoryConfig } from "../core/transactionsFactoryConfig";
import * as resources from "./resources";
import { TransferTransactionsFactory } from "./transferTransactionsFactory";

export class TransfersController extends BaseController {
    private factory: TransferTransactionsFactory;
    private txComputer: TransactionComputer;

    constructor(options: { chainID: string }) {
        super();
        this.factory = new TransferTransactionsFactory({ config: new TransactionsFactoryConfig(options) });
        this.txComputer = new TransactionComputer();
    }

    async createTransactionForNativeTokenTransfer(
        sender: IAccount,
        nonce: bigint,
        options: resources.NativeTokenTransferInput & { guardian?: Address; relayer?: Address },
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForNativeTokenTransfer(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.addExtraGasLimitIfRequired(transaction);
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForEsdtTokenTransfer(
        sender: IAccount,
        nonce: bigint,
        options: resources.CustomTokenTransferInput & { guardian?: Address; relayer?: Address },
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForESDTTokenTransfer(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.addExtraGasLimitIfRequired(transaction);
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForTransfer(
        sender: IAccount,
        nonce: bigint,
        options: resources.CreateTransferTransactionInput & { guardian?: Address; relayer?: Address },
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForTransfer(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.addExtraGasLimitIfRequired(transaction);
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }
}
