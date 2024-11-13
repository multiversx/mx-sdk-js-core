import { IAddress } from "../interface";
import { TokenTransfer } from "../tokens";

export type NativeTokenTransferInput = {
    receiver: IAddress;
    nativeAmount?: bigint;
    data?: Uint8Array;
};

export type ESDTTokenTransferInput = {
    receiver: IAddress;
    tokenTransfers: TokenTransfer[];
};

export type CreateTransferTransactionInput = {
    receiver: IAddress;
    nativeAmount?: bigint;
    tokenTransfers?: TokenTransfer[];
    data?: Uint8Array;
};
