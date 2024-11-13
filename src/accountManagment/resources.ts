import { IAddress } from "../interface";

export type SetGuardianInput = { guardianAddress: IAddress; serviceID: string };
export type SaveKeyValueInput = { keyValuePairs: Map<Uint8Array, Uint8Array> };
