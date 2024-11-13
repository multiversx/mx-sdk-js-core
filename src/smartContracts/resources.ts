import { IAddress } from "../interface";
import { TokenTransfer } from "../tokens";

export type ContractDepoyInput = {
    bytecode: Uint8Array;
    gasLimit: bigint;
    arguments: any[];
    nativeTransferAmount?: bigint;
    isUpgradeable?: boolean;
    isReadable?: boolean;
    isPayable?: boolean;
    isPayableBySmartContract?: boolean;
};

export type TransactionInput = {
    contract: IAddress;
    gasLimit: bigint;
    function: string;
    arguments?: any[];
    nativeTransferAmount?: bigint;
    tokenTransfers?: TokenTransfer[];
};

export type ContractUpgradeInput = ContractDepoyInput & { contract: IAddress };

export interface SmartContractDeployOutcome {
    returnCode: string;
    returnMessage: string;
    contracts: DeployedSmartContract[];
}

export class DeployedSmartContract {
    address: string;
    ownerAddress: string;
    codeHash: Uint8Array;

    constructor(address: string, ownerAddress: string, codeHash: Uint8Array) {
        this.address = address;
        this.ownerAddress = ownerAddress;
        this.codeHash = codeHash;
    }

    toString(): string {
        return `DeployedSmartContract(address=${this.address}, ownerAddress=${this.ownerAddress}, codeHash=${Buffer.from(this.codeHash).toString("hex")})`;
    }
}
