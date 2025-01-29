import { Transaction } from "../core/transaction";

export type RelayedV1TransactionInput = { innerTransaction: Transaction };
export type RelayedV2TransactionInput = {
    innerTransaction: Transaction;
    innerTransactionGasLimit: bigint;
};
