import { Address } from "../core/address";
import { ValidatorPublicKey } from "../wallet";
import { ValidatorsSigners } from "./validatorsSigner";

export type StakingInput = { validatorsFile: ValidatorsSigners | string; amount: bigint; rewardsAddress?: Address };
export type ChangeRewardsAddressInput = { rewardsAddress: Address };
export type ToppingUpInput = { amount: bigint };
export type UnstakingTokensInput = { amount: bigint };
export type UnstakingInput = { publicKeys: ValidatorPublicKey[] };
export type RestakingInput = { publicKeys: ValidatorPublicKey[] };
export type UnboundInput = { publicKeys: ValidatorPublicKey[] };
export type UnboundTokensInput = { amount: bigint };
export type UnjailingInput = { publicKeys: ValidatorPublicKey[]; amount: bigint };
export type NewDelegationContractInput = { maxCap: bigint; fee: bigint };
export type MergeValidatorToDelegationInput = { delegationAddress: Address };
