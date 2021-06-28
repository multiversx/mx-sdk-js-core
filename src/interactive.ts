import { BalanceBuilder, Egld, ErrInvalidArgument, IProvider, NetworkConfig, ProxyProvider, SystemWrapper } from ".";
import { loadAndSyncTestWallets, TestWallet } from "./testutils";

type InteractivePackage = { erdSys: SystemWrapper, Egld: BalanceBuilder, wallets: Record<string, TestWallet> };

export async function setupInteractive(providerChoice?: string | IProvider): Promise<InteractivePackage> {
    let provider = chooseProvider(providerChoice);
    await NetworkConfig.getDefault().sync(provider);
    let wallets = await loadAndSyncTestWallets(provider);
    let erdSys = await SystemWrapper.load(provider);
    return { erdSys, Egld, wallets };
}

export function chooseProvider(providerChoice?: string | IProvider): IProvider {
    providerChoice = providerChoice || "local-testnet";
    if (typeof providerChoice != "string") {
        return providerChoice;
    }
    switch (providerChoice) {
        case "local-testnet": return new ProxyProvider("http://localhost:7950", 5000);
        case "elrond-testnet": return new ProxyProvider("https://testnet-gateway.elrond.com", 5000);
        case "elrond-devnet": return new ProxyProvider("https://devnet-gateway.elrond.com", 5000);
        case "elrond-mainnet": return new ProxyProvider("https://gateway.elrond.com", 20000);
    }
    throw new ErrInvalidArgument("providerChoice is not recognized (must be one of: \"local-testnet\", \"elrond-testnet\", \"elrond-devnet\", \"elrond-mainnet\")");
}
