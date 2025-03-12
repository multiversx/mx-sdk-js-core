import { Address } from "./address";
import { EXTRA_GAS_LIMIT_FOR_GUARDED_TRANSACTIONS, EXTRA_GAS_LIMIT_FOR_RELAYED_TRANSACTIONS } from "./constants";
import { Transaction } from "./transaction";

export type BaseControllerInput = {
    guardian?: Address;
    relayer?: Address;
    gasPrice?: bigint;
    gasLimit?: bigint;
};

export class BaseController {
    protected setTransactionGasOptions(transaction: Transaction, options: { gasLimit?: bigint; gasPrice?: bigint }) {
        if (options.gasLimit) {
            transaction.gasLimit = options.gasLimit;
        } else {
            this.addExtraGasLimitIfRequired(transaction);
        }
        if (options.gasPrice) {
            transaction.gasPrice = options.gasPrice;
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
}
