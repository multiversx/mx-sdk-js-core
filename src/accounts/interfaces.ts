import { Address } from "../core/address";

export interface IAccount {
    readonly address: Address;

    sign(data: Uint8Array): Uint8Array;
}
