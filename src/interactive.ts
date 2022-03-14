
import { ApiProvider } from "./apiProvider";
import { BalanceBuilder, Egld } from "./balanceBuilder";
import { ErrInvalidArgument } from "./errors";
import { IApiProvider, IProvider } from "./interface";
import { NetworkConfig } from "./networkConfig";
import { ProxyProvider } from "./proxyProvider";
import { SystemWrapper } from "./smartcontracts/wrapper";
import { loadAndSyncTestWallets, TestWallet } from "./testutils";

type InteractivePackage = { erdSys: SystemWrapper, Egld: BalanceBuilder, wallets: Record<string, TestWallet> };

export async function setupInteractive(providerChoice: string): Promise<InteractivePackage> {
    let provider = chooseProxyProvider(providerChoice);
    return await setupInteractiveWithProvider(provider);
}

export async function setupInteractiveWithProvider(provider: IProvider): Promise<InteractivePackage> {
    await NetworkConfig.getDefault().sync(provider);
    let wallets = await loadAndSyncTestWallets(provider);
    let erdSys = await SystemWrapper.load(provider);
    return { erdSys, Egld, wallets };
}

export function chooseProxyProvider(providerChoice: string): IProvider {
    let providers: Record<string, IProvider> = {
        "local-testnet": new ProxyProvider("http://localhost:7950", { timeout: 5000 }),
        "elrond-testnet": new ProxyProvider("https://testnet-gateway.elrond.com", { timeout: 5000 }),
        "elrond-devnet": new ProxyProvider("https://devnet-gateway.elrond.com", { timeout: 5000 }),
        "elrond-mainnet": new ProxyProvider("https://gateway.elrond.com", { timeout: 20000 }),
    };

    let chosenProvider = providers[providerChoice];
    if (chosenProvider) {
        return chosenProvider;
    }

    throw new ErrInvalidArgument(`providerChoice is not recognized (must be one of: ${Object.keys(providers)})`);
}

export function chooseApiProvider(providerChoice: string): IApiProvider {
    let providers: Record<string, IApiProvider> = {
        "elrond-devnet": new ApiProvider("https://devnet-api.elrond.com", { timeout: 5000 }),
        "elrond-testnet": new ApiProvider("https://testnet-api.elrond.com", { timeout: 5000 }),
        "elrond-mainnet": new ApiProvider("https://api.elrond.com", { timeout: 5000 })
    };

    let chosenProvider = providers[providerChoice];
    if (chosenProvider) {
        return chosenProvider;
    }

    throw new ErrInvalidArgument(`providerChoice is not recognized (must be one of: ${Object.keys(providers)})`);
}
