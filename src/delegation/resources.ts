import { Address } from "../address";
import { IValidatorPublicKey } from "./delegationTransactionsFactory";

export type NewDelegationContractInput = { totalDelegationCap: bigint; serviceFee: bigint; amount: bigint };
export type AddNodesInput = ManageNodesInput & { signedMessages: Uint8Array[] };
export type UnjailingNodesInput = ManageNodesInput & { amount: bigint };
export type ManageNodesInput = { delegationContract: Address; publicKeys: IValidatorPublicKey[] };
export type ChangeServiceFee = { delegationContract: Address; serviceFee: bigint };
export type ModifyDelegationCapInput = { delegationContract: Address; delegationCap: bigint };
export type ManageDelegationContractInput = { delegationContract: Address };
export type DelegateActionsInput = { delegationContract: Address; amount: bigint };
export type SetContractMetadataInput = {
    delegationContract: Address;
    name: string;
    website: string;
    identifier: string;
};
