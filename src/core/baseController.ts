import { Transaction } from "../core/transaction";
import { EXTRA_GAS_LIMIT_FOR_GUARDED_TRANSACTIONS, EXTRA_GAS_LIMIT_FOR_RELAYED_TRANSACTIONS } from "./constants";

export class BaseController {
    addExtraGasLimitIfRequired(transaction: Transaction): void {
        if (transaction.guardian && !transaction.guardian.isEmpty()) {
            transaction.gasLimit += BigInt(EXTRA_GAS_LIMIT_FOR_GUARDED_TRANSACTIONS);
        }

        if (transaction.relayer && !transaction.relayer.isEmpty()) {
            transaction.gasLimit += BigInt(EXTRA_GAS_LIMIT_FOR_RELAYED_TRANSACTIONS);
        }
    }
}
