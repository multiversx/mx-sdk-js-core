import { Address } from "../core/address";
import { ValidatorPublicKey } from "../wallet";
import { ValidatorsSigners } from "./validatorsSigner";

export type StakingInput = { validatorsFile: ValidatorsSigners | string; amount: bigint; rewardsAddress?: Address };
export type ChangingRewardsAddressInput = { rewardsAddress: Address };
export type ToppingUpInput = { amount: bigint };
export type UnstakingTokensInput = { amount: bigint };
export type UnstakingInput = { publicKeys: ValidatorPublicKey[] };
export type RestakingInput = { publicKeys: ValidatorPublicKey[] };
export type UnbondingInput = { publicKeys: ValidatorPublicKey[] };
export type UnbondingTokensInput = { amount: bigint };
export type UnjailingInput = { publicKeys: ValidatorPublicKey[]; amount: bigint };
export type NewDelegationContractInput = { maxCap: bigint; fee: bigint };
export type MergeValidatorToDelegationInput = { delegationAddress: Address };
