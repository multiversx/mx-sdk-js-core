import { Address } from "../address";

export interface IAccount {
    readonly address: Address;

    sign(data: Uint8Array): Uint8Array;
}
