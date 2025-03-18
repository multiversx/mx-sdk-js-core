import { Address } from "../core/address";
import { TokenTransfer } from "../core/tokens";

export type NativeTokenTransferInput = {
    receiver: Address;
    nativeAmount?: bigint;
    data?: Uint8Array;
};

export type CustomTokenTransferInput = {
    receiver: Address;
    tokenTransfers: TokenTransfer[];
};

export type CreateTransferTransactionInput = {
    receiver: Address;
    nativeAmount?: bigint;
    tokenTransfers?: TokenTransfer[];
    data?: Uint8Array;
};
