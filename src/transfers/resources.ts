import { Address } from "../address";
import { TokenTransfer } from "../tokens";

export type NativeTokenTransferInput = {
    receiver: Address;
    nativeAmount?: bigint;
    data?: Uint8Array;
};

export type ESDTTokenTransferInput = {
    receiver: Address;
    tokenTransfers: TokenTransfer[];
};

export type CreateTransferTransactionInput = {
    receiver: Address;
    nativeAmount?: bigint;
    tokenTransfers?: TokenTransfer[];
    data?: Uint8Array;
};
