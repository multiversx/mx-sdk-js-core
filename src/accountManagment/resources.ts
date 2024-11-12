import { IAddress } from "../interface";

export type SetGuardianInput = { nonce: bigint; guardianAddress: IAddress; serviceID: string };
export type SaveKeyValueInput = { nonce: bigint; keyValuePairs: Map<Uint8Array, Uint8Array> };
export type GuardianInteractionInput = { nonce: bigint };
