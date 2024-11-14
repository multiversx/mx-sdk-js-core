import { ITransaction } from "../interface";

export type CreateV1RelayTransactionInput = { nonce: bigint; innerTransaction: ITransaction };
export type CreateV2RelayTransactionInput = {
    nonce: bigint;
    innerTransaction: ITransaction;
    innerTransactionGasLimit: bigint;
};
