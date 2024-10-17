import { IAddress } from "../interface";

export interface IAccount {
    readonly address: IAddress;

    sign(data: Uint8Array): Uint8Array;
}
