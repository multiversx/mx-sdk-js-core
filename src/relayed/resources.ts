import { ITransaction } from "../interface";

export type RelayedV1TransactionInput = { innerTransaction: ITransaction };
export type RelayedV2TransactionInput = {
    innerTransaction: ITransaction;
    innerTransactionGasLimit: bigint;
};
