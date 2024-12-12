import { Address } from "../address";

export type SetGuardianInput = { guardianAddress: Address; serviceID: string };
export type SaveKeyValueInput = { keyValuePairs: Map<Uint8Array, Uint8Array> };
