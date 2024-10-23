import { IAddress } from "../interface";
import { TokenTransfer } from "../tokens";
import { Transaction } from "../transaction";
import { TransactionComputer } from "../transactionComputer";
import { TransactionsFactoryConfig, TransferTransactionsFactory } from "../transactionsFactories";
import { IAccount } from "./interfaces";

export class TransfersController {
    private factory: TransferTransactionsFactory;
    private txComputer: TransactionComputer;

    constructor(chainId: string) {
        this.factory = new TransferTransactionsFactory({ config: new TransactionsFactoryConfig({ chainID: chainId }) });
        this.txComputer = new TransactionComputer();
    }

    async createTransactionForNativeTokenTransfer(
        sender: IAccount,
        nonce: bigint,
        receiver: IAddress,
        nativeTransferAmount: bigint = BigInt(0),
        data?: Uint8Array,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForNativeTokenTransfer({
            sender: sender.address,
            receiver,
            nativeAmount: nativeTransferAmount,
            data,
        });

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForEsdtTokenTransfer(
        sender: IAccount,
        nonce: bigint,
        receiver: IAddress,
        tokenTransfers: TokenTransfer[],
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForESDTTokenTransfer({
            sender: sender.address,
            receiver,
            tokenTransfers,
        });

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForTransfer(
        sender: IAccount,
        nonce: bigint,
        receiver: IAddress,
        nativeTransferAmount?: bigint,
        tokenTransfers?: TokenTransfer[],
        data?: Uint8Array,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForTransfer({
            sender: sender.address,
            receiver,
            nativeAmount: nativeTransferAmount,
            tokenTransfers,
            data,
        });

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }
}
