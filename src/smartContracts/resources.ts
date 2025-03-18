import { Address } from "../core/address";
import { TokenTransfer } from "../core/tokens";

export type ContractDeployInput = {
    bytecode: Uint8Array;
    gasLimit: bigint;
    arguments?: any[];
    nativeTransferAmount?: bigint;
    isUpgradeable?: boolean;
    isReadable?: boolean;
    isPayable?: boolean;
    isPayableBySmartContract?: boolean;
};

export type ContractExecuteInput = {
    contract: Address;
    gasLimit: bigint;
    function: string;
    arguments?: any[];
    nativeTransferAmount?: bigint;
    tokenTransfers?: TokenTransfer[];
};

export type ContractUpgradeInput = ContractDeployInput & { contract: Address };

export interface SmartContractDeployOutcome {
    returnCode: string;
    returnMessage: string;
    contracts: DeployedSmartContract[];
}
export type ParsedSmartContractCallOutcome = {
    values: any[];
    returnCode: string;
    returnMessage: string;
};

export type DeployedSmartContract = {
    address: Address;
    ownerAddress: Address;
    codeHash: Uint8Array;
};
