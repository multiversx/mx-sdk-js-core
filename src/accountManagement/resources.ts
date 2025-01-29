import { Address } from "../core/address";

export type SetGuardianInput = { guardianAddress: Address; serviceID: string };
export type SaveKeyValueInput = { keyValuePairs: Map<Uint8Array, Uint8Array> };
