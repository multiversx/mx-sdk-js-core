import BigNumber from "bignumber.js";
import path from "path";
import { ContractWrapper } from "./contractWrapper";
import { ContractLogger } from "./contractLogger";
import { SendContext  } from "./sendContext";
import { AddressType, EndpointParameterDefinition } from "../typesystem";
import { Address } from "../../address";
import { Balance } from "../../balance";
import { Egld, BalanceBuilder, createBalanceBuilder } from "../../balanceBuilder";
import { IProvider } from "../../interface";
import { Token } from "../../token";
import { EsdtHelpers } from "../../esdtHelpers";
import { MockProvider, TestWallet } from "../../testutils";
import { NativeSerializer, NativeTypes } from "../nativeSerializer";
import { ArgumentErrorContext } from "../argumentErrorContext";
import { ChainSendContext } from "./chainSendContext";

export namespace SystemConstants {
    export let SYSTEM_ABI_PATH = path.join(path.dirname(__filename), "../../abi");
    export let ESDT_CONTRACT_ADDRESS = new Address("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u");

    export let MIN_TRANSACTION_GAS = 50_000;
    export let ESDT_ISSUE_GAS_LIMIT = 60_000_000;
    export let ESDT_TRANSFER_GAS_LIMIT = 500_000;
    export let ESDT_NFT_TRANSFER_GAS_LIMIT = 1_000_000;
    export let ESDT_BASE_GAS_LIMIT = 6_000_000;
}

export class SystemWrapper extends ChainSendContext {
    private readonly provider: IProvider;
    private readonly builtinFunctions: ContractWrapper;
    readonly esdtSystemContract: ContractWrapper;
    readonly issueCost: Balance;
    private readonly sendWrapper: ContractWrapper;

    private constructor(provider: IProvider, context: SendContext, sendContract: ContractWrapper, esdtSystemContract: ContractWrapper, issueCost: Balance, builtinFunctions: ContractWrapper) {
        super(context);
        this.provider = provider;
        this.sendWrapper = sendContract;
        this.esdtSystemContract = esdtSystemContract;
        this.issueCost = issueCost;
        this.builtinFunctions = builtinFunctions;
    }

    async loadWrapper(projectPath: string, filenameHint?: string, context?: SendContext): Promise<ContractWrapper> {
        return await ContractWrapper.loadProject(this.provider, this.builtinFunctions, projectPath, filenameHint, context);
    }

    static async getEsdtContractConfig(esdtSystemContract: ContractWrapper): Promise<EsdtContractConfig> {
        let [ownerAddress, baseIssuingCost, minTokenNameLength, maxTokenNameLength] = await esdtSystemContract.query.getContractConfig();
        return { ownerAddress, baseIssuingCost: Egld.raw(baseIssuingCost), minTokenNameLength, maxTokenNameLength };
    }

    static async load(provider: IProvider): Promise<SystemWrapper> {
        let context = new SendContext(provider).logger(new ContractLogger());
        let builtinFunctions = await ContractWrapper.loadProject(provider, null, SystemConstants.SYSTEM_ABI_PATH, "builtinFunctions", context);
        let sendWrapper = await ContractWrapper.loadProject(provider, builtinFunctions, SystemConstants.SYSTEM_ABI_PATH, "sendWrapper", context);
        let esdtSystemContract = await ContractWrapper.loadProject(provider, builtinFunctions, SystemConstants.SYSTEM_ABI_PATH, "esdtSystemContract", context);
        esdtSystemContract.address(SystemConstants.ESDT_CONTRACT_ADDRESS);
        let issueCost: Balance;
        if (provider instanceof MockProvider) {
            issueCost = Balance.Zero();
        } else {
            let contractConfig = await this.getEsdtContractConfig(esdtSystemContract);
            issueCost = contractConfig.baseIssuingCost;
        }
        return new SystemWrapper(provider, context, sendWrapper, esdtSystemContract, issueCost, builtinFunctions);
    }

    async send(receiver: string | Buffer | Address | TestWallet): Promise<void> {
        let address = NativeSerializer.convertNativeToAddress(receiver, new ArgumentErrorContext("send", "0", new EndpointParameterDefinition("receiver", "", new AddressType())));
        await this.sendWrapper.address(address).autoGas(0).call[""]();
    }

    async issueFungible(...args: any[]): Promise<BalanceBuilder> {
        let { resultingCalls: [issueResult] } = await this.esdtSystemContract
            .gas(SystemConstants.ESDT_ISSUE_GAS_LIMIT)
            .value(this.issueCost)
            .results.issue(...args);
        let { tokenIdentifier } = EsdtHelpers.extractFieldsFromEsdtTransferDataField(issueResult.data);
        tokenIdentifier = Buffer.from(tokenIdentifier, "hex").toString();
        return this.recallToken(tokenIdentifier);
    }

    async issueSemiFungible(...args: any[]): Promise<BalanceBuilder> {
        let tokenIdentifier = (await this.esdtSystemContract
            .gas(SystemConstants.ESDT_ISSUE_GAS_LIMIT)
            .value(this.issueCost)
            .call.issueSemiFungible(...args)
        ).toString();
        return this.recallToken(tokenIdentifier);
    }

    async issueNonFungible(...args: any[]): Promise<BalanceBuilder> {
        let tokenIdentifier = (await this.esdtSystemContract
            .gas(SystemConstants.ESDT_ISSUE_GAS_LIMIT)
            .value(this.issueCost)
            .call.issueNonFungible(...args)
        ).toString();
        return this.recallToken(tokenIdentifier);
    }

    async esdtNftCreate(balanceBuilder: BalanceBuilder, ...args: any[]): Promise<BalanceBuilder> {
        let nonce = await this.builtinFunctions
            .address(this.context.getSender())
            .gas(SystemConstants.ESDT_BASE_GAS_LIMIT)
            .call
            .ESDTNFTCreate(balanceBuilder, ...args);
        return balanceBuilder.nonce(nonce);
    }

    async recallToken(tokenIdentifier: string): Promise<BalanceBuilder> {
        let tokenProperties = await this.esdtSystemContract.query.getTokenProperties(tokenIdentifier);
        let token = Token.fromTokenProperties(tokenIdentifier, tokenProperties);
        return createBalanceBuilder(token);
    }

    async getBalance(address: NativeTypes.NativeAddress, balanceBuilder: BalanceBuilder): Promise<Balance> {
        let typedAddress = NativeSerializer.convertNativeToAddress(address, new ArgumentErrorContext("getBalance", "0", new EndpointParameterDefinition("account", "", new AddressType())));
        if (balanceBuilder.getToken().isEgld()) {
            return await this.provider.getAccount(typedAddress).then((account) => account.balance);
        }
        let tokenData = await this.getTokenData(typedAddress, balanceBuilder);
        return balanceBuilder.raw(tokenData.balance);
    }

    async getBalanceList(address: NativeTypes.NativeAddress, balanceBuilder: BalanceBuilder) {
        let typedAddress = NativeSerializer.convertNativeToAddress(address, new ArgumentErrorContext("getBalanceList", "0", new EndpointParameterDefinition("account", "", new AddressType())));
        if (balanceBuilder.getToken().isNft() && balanceBuilder.hasNonce()) {
            return [await this.getBalance(typedAddress, balanceBuilder)];
        }

        return await this.provider.getAddressEsdtList(typedAddress).then((esdtList) => {
            let tokenBalances: Balance[] = [];
            let filterIdentifier = balanceBuilder.getTokenIdentifier() + '-';
            for (let [identifier, details] of Object.entries<any>(esdtList)) {
                if (identifier.startsWith(filterIdentifier)) {
                    tokenBalances.push(balanceBuilder.nonce(details.nonce).raw(details.balance));
                }
            }
            return tokenBalances;
        });
    }

    async getTokenData(address: Address, balanceBuilder: BalanceBuilder): Promise<any> {
        let tokenIdentifier = balanceBuilder.getTokenIdentifier();
        if (balanceBuilder.getToken().isFungible()) {
            return await this.provider.getAddressEsdt(address, tokenIdentifier);
        } else {
            return await this.provider.getAddressNft(address, tokenIdentifier, balanceBuilder.getNonce());
        }
    }

    async currentNonce(): Promise<number> {
        let networkStatus = await this.provider.getNetworkStatus();
        return networkStatus.Nonce;
    }

}

export type EsdtContractConfig = {
    ownerAddress: Address;
    baseIssuingCost: Balance;
    minTokenNameLength: BigNumber;
    maxTokenNameLength: BigNumber;
};

export function getGasFromValue(baseGas: number, value: Balance | null): number {
    if (!value || value.isEgld()) {
        return Math.max(baseGas, SystemConstants.MIN_TRANSACTION_GAS);
    }
    if (value.token.isFungible()) {
        return baseGas + SystemConstants.ESDT_TRANSFER_GAS_LIMIT;
    } else {
        return baseGas + SystemConstants.ESDT_NFT_TRANSFER_GAS_LIMIT;
    }
}
