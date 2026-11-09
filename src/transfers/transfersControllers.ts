import {
    BaseController,
    BaseControllerInput,
    IAccount,
    IGasLimitEstimator,
    Transaction,
    TransactionsFactoryConfig,
} from "../core";
import * as resources from "./resources";
import { TransferTransactionsFactory } from "./transferTransactionsFactory";

export class TransfersController extends BaseController {
    private factory: TransferTransactionsFactory;

    constructor(options: { chainID: string; gasLimitEstimator?: IGasLimitEstimator }) {
        super({ gasLimitEstimator: options.gasLimitEstimator });
        this.factory = new TransferTransactionsFactory({
            config: new TransactionsFactoryConfig(options),
        });
    }

    async createTransactionForNativeTokenTransfer(
        sender: IAccount,
        nonce: bigint,
        options: resources.NativeTokenTransferInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = await this.factory.createTransactionForNativeTokenTransfer(sender.address, options);

        await this.setupAndSignTransaction(transaction, options, nonce, sender);

        return transaction;
    }

    async createTransactionForEsdtTokenTransfer(
        sender: IAccount,
        nonce: bigint,
        options: resources.CustomTokenTransferInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = await this.factory.createTransactionForESDTTokenTransfer(sender.address, options);

        await this.setupAndSignTransaction(transaction, options, nonce, sender);

        return transaction;
    }

    async createTransactionForTransfer(
        sender: IAccount,
        nonce: bigint,
        options: resources.CreateTransferTransactionInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = await this.factory.createTransactionForTransfer(sender.address, options);

        await this.setupAndSignTransaction(transaction, options, nonce, sender);

        return transaction;
    }
}
