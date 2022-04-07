
import { BalanceBuilder, Egld } from "./balanceBuilder";
import { ErrInvalidArgument } from "./errors";
import { ApiNetworkProvider } from "./networkProvider";
import { SystemWrapper } from "./smartcontracts/wrapper";
import { DeprecatedProxyProvider } from "./smartcontracts/wrapper/deprecatedProxyProvider";
import { IDeprecatedProvider } from "./smartcontracts/wrapper/interface";
import { loadAndSyncTestWallets, TestWallet } from "./testutils";

type InteractivePackage = { erdSys: SystemWrapper, Egld: BalanceBuilder, wallets: Record<string, TestWallet> };

export async function setupInteractive(providerChoice: string): Promise<InteractivePackage> {
    let provider = chooseProxyProvider(providerChoice);
    return await setupInteractiveWithProvider(provider);
}

export async function setupInteractiveWithProvider(provider: IDeprecatedProvider): Promise<InteractivePackage> {
    let wallets = await loadAndSyncTestWallets(provider);
    let erdSys = await SystemWrapper.load(provider);
    return { erdSys, Egld, wallets };
}

export function chooseProxyProvider(providerChoice: string): IDeprecatedProvider {
    let providers: Record<string, IDeprecatedProvider> = {
        "local-testnet": new DeprecatedProxyProvider("http://localhost:7950", { timeout: 5000 }),
        "elrond-testnet": new DeprecatedProxyProvider("https://testnet-gateway.elrond.com", { timeout: 5000 }),
        "elrond-devnet": new DeprecatedProxyProvider("https://devnet-gateway.elrond.com", { timeout: 5000 }),
        "elrond-mainnet": new DeprecatedProxyProvider("https://gateway.elrond.com", { timeout: 20000 }),
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
