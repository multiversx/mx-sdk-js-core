import { IAccount } from "../accounts/interfaces";
import { IAddress } from "../interface";
import { TokenTransfer } from "../tokens";
import { Transaction } from "../transaction";
import { TransactionComputer } from "../transactionComputer";
import { TransactionsFactoryConfig, TransferTransactionsFactory } from "../transactionsFactories";

export class TransfersController {
    private factory: TransferTransactionsFactory;
    private txComputer: TransactionComputer;

    constructor(options: { chainID: string }) {
        this.factory = new TransferTransactionsFactory({ config: new TransactionsFactoryConfig(options) });
        this.txComputer = new TransactionComputer();
    }

    async createTransactionForNativeTokenTransfer(
        sender: IAccount,
        options: NativeTokenTransferInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForNativeTokenTransfer({
            ...options,
            sender: sender.address,
        });

        transaction.nonce = options.nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForEsdtTokenTransfer(
        sender: IAccount,
        options: ESDTTokenTransferInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForESDTTokenTransfer({ ...options, sender: sender.address });

        transaction.nonce = options.nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForTransfer(
        sender: IAccount,
        options: CreateTransferTransactionInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForTransfer({ ...options, sender: sender.address });

        transaction.nonce = options.nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }
}

type NativeTokenTransferInput = {
    nonce: bigint;
    receiver: IAddress;
    nativeAmount?: bigint;
    data?: Uint8Array;
};

type ESDTTokenTransferInput = {
    nonce: bigint;
    receiver: IAddress;
    tokenTransfers: TokenTransfer[];
};

type CreateTransferTransactionInput = {
    nonce: bigint;
    receiver: IAddress;
    nativeTransferAmount?: bigint;
    tokenTransfers?: TokenTransfer[];
    data?: Uint8Array;
};
