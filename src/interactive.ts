
import { BalanceBuilder, Egld } from "./balanceBuilder";
import { ErrInvalidArgument } from "./errors";
import { ApiNetworkProvider } from "./networkProvider";
import { SystemWrapper } from "./smartcontracts/wrapper";
import { ProxyProviderAdapter } from "./smartcontracts/wrapper/proxyProviderAdapter";
import { IProvider } from "./smartcontracts/wrapper/interface";
import { loadAndSyncTestWallets, TestWallet } from "./testutils";

type InteractivePackage = { erdSys: SystemWrapper, Egld: BalanceBuilder, wallets: Record<string, TestWallet> };

export async function setupInteractive(providerChoice: string): Promise<InteractivePackage> {
    let provider = chooseProxyProvider(providerChoice);
    return await setupInteractiveWithProvider(provider);
}

export async function setupInteractiveWithProvider(provider: IProvider): Promise<InteractivePackage> {
    let wallets = await loadAndSyncTestWallets(provider);
    let erdSys = await SystemWrapper.load(provider);
    return { erdSys, Egld, wallets };
}

export function chooseProxyProvider(providerChoice: string): IProvider {
    let providers: Record<string, IProvider> = {
        "local-testnet": new ProxyProviderAdapter("http://localhost:7950", { timeout: 5000 }),
        "elrond-testnet": new ProxyProviderAdapter("https://testnet-gateway.elrond.com", { timeout: 5000 }),
        "elrond-devnet": new ProxyProviderAdapter("https://devnet-gateway.elrond.com", { timeout: 5000 }),
        "elrond-mainnet": new ProxyProviderAdapter("https://gateway.elrond.com", { timeout: 20000 }),
    };

    let chosenProvider = providers[providerChoice];
    if (chosenProvider) {
        return chosenProvider;
    }

    throw new ErrInvalidArgument(`providerChoice is not recognized (must be one of: ${Object.keys(providers)})`);
}

export function chooseApiProvider(providerChoice: string): ApiNetworkProvider {
    let providers: Record<string, ApiNetworkProvider> = {
        "elrond-devnet": new ApiNetworkProvider("https://devnet-api.elrond.com", { timeout: 5000 }),
        "elrond-testnet": new ApiNetworkProvider("https://testnet-api.elrond.com", { timeout: 5000 }),
        "elrond-mainnet": new ApiNetworkProvider("https://api.elrond.com", { timeout: 5000 })
    };

    let chosenProvider = providers[providerChoice];
    if (chosenProvider) {
        return chosenProvider;
    }

    throw new ErrInvalidArgument(`providerChoice is not recognized (must be one of: ${Object.keys(providers)})`);
}
