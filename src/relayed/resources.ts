import { ITransaction } from "../interface";

export type CreateV1RelayedTransactionInput = { nonce: bigint; innerTransaction: ITransaction };
export type CreateV2RelayedTransactionInput = {
    nonce: bigint;
    innerTransaction: ITransaction;
    innerTransactionGasLimit: bigint;
};
