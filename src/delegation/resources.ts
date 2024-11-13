import { IAddress } from "../interface";
import { IValidatorPublicKey } from "./delegationTransactionsFactory";

export type NewDelegationContractInput = { totalDelegationCap: bigint; serviceFee: bigint; amount: bigint };
export type AddNodesInput = ManageNodesInput & { signedMessages: Uint8Array[] };
export type UnjailingNodesInput = ManageNodesInput & { amount: bigint };
export type ManageNodesInput = { delegationContract: IAddress; publicKeys: IValidatorPublicKey[] };
export type ChangeServiceFee = { delegationContract: IAddress; serviceFee: bigint };
export type ModifyDelegationCapInput = { delegationContract: IAddress; delegationCap: bigint };
export type ManageDelegationContractInput = { delegationContract: IAddress };
export type DelegateActionsInput = { delegationContract: IAddress; amount: bigint };
export type SetContractMetadataInput = {
    delegationContract: IAddress;
    name: string;
    website: string;
    identifier: string;
};
