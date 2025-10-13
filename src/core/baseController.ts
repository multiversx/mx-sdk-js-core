import { Address } from "./address";
import { EXTRA_GAS_LIMIT_FOR_GUARDED_TRANSACTIONS, EXTRA_GAS_LIMIT_FOR_RELAYED_TRANSACTIONS } from "./constants";
import { IAccount, IGasLimitEstimator } from "./interfaces";
import { Transaction } from "./transaction";
import { TransactionComputer } from "./transactionComputer";

export type BaseControllerInput = {
    guardian?: Address;
    relayer?: Address;
    gasPrice?: bigint;
    gasLimit?: bigint;
};

export class BaseController {
    private gasLimitEstimator?: IGasLimitEstimator;
    constructor(options?: { gasLimitEstimator?: IGasLimitEstimator }) {
        this.gasLimitEstimator = options?.gasLimitEstimator;
    }

    protected async setTransactionGasOptions(
        transaction: Transaction,
        options: { gasLimit?: bigint; gasPrice?: bigint },
    ) {
        if (options.gasPrice) {
            transaction.gasPrice = options.gasPrice;
        }

        if (options.gasLimit) {
            transaction.gasLimit = options.gasLimit;
            return;
        } else {
            this.addExtraGasLimitIfRequired(transaction);
        }

        if (this.gasLimitEstimator) {
            transaction.gasLimit = await this.gasLimitEstimator.estimateGasLimit({ transaction });
        }
    }

    protected addExtraGasLimitIfRequired(transaction: Transaction): void {
        if (transaction.guardian && !transaction.guardian.isEmpty()) {
            transaction.gasLimit += BigInt(EXTRA_GAS_LIMIT_FOR_GUARDED_TRANSACTIONS);
        }

        if (transaction.relayer && !transaction.relayer.isEmpty()) {
            transaction.gasLimit += BigInt(EXTRA_GAS_LIMIT_FOR_RELAYED_TRANSACTIONS);
        }
    }

    protected setVersionAndOptionsForGuardian(transaction: Transaction): void {
        if (transaction.guardian && !transaction.guardian.isEmpty()) {
            const txComputer = new TransactionComputer();
            txComputer.applyGuardian(transaction, transaction.guardian);
        }
    }

    protected async setupAndSignTransaction(
        transaction: Transaction,
        options: BaseControllerInput,
        nonce: bigint,
        sender: IAccount,
    ) {
        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setVersionAndOptionsForGuardian(transaction);
        await this.setTransactionGasOptions(transaction, options);
        transaction.signature = await sender.signTransaction(transaction);
    }
}
