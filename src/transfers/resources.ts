import { IAddress } from "../interface";
import { TokenTransfer } from "../tokens";

export type NativeTokenTransferInput = {
    nonce: bigint;
    receiver: IAddress;
    nativeAmount?: bigint;
    data?: Uint8Array;
};

export type ESDTTokenTransferInput = {
    nonce: bigint;
    receiver: IAddress;
    tokenTransfers: TokenTransfer[];
};

export type CreateTransferTransactionInput = {
    nonce: bigint;
    receiver: IAddress;
    nativeTransferAmount?: bigint;
    tokenTransfers?: TokenTransfer[];
    data?: Uint8Array;
};
