import { IAddress } from "../interface";
import { IValidatorPublicKey } from "./delegationTransactionsFactory";

export type NewDelegationContractInput = {
    nonce: bigint;
    totalDelegationCap: bigint;
    serviceFee: bigint;
    amount: bigint;
};
export type AddNodesInput = ManageNodesInput & { signedMessages: Uint8Array[] };
export type UnjailingNodesInput = ManageNodesInput & { amount: bigint };
export type ManageNodesInput = { nonce: bigint; delegationContract: IAddress; publicKeys: IValidatorPublicKey[] };
export type ChangeServiceFee = { nonce: bigint; delegationContract: IAddress; serviceFee: bigint };
export type ModifyDelegationCapInput = { nonce: bigint; delegationContract: IAddress; delegationCap: bigint };
export type ManageDelegationContractInput = { nonce: bigint; delegationContract: IAddress };
export type DelegateActionsInput = { nonce: bigint; delegationContract: IAddress; amount: bigint };
export type SetContractMetadataInput = {
    nonce: bigint;
    delegationContract: IAddress;
    name: string;
    website: string;
    identifier: string;
};
