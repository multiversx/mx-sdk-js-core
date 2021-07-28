import { BalanceBuilder, Egld, ErrInvalidArgument, IProvider, NetworkConfig, ProxyProvider, SystemWrapper } from ".";
import { loadAndSyncTestWallets, TestWallet } from "./testutils";

type InteractivePackage = { erdSys: SystemWrapper, Egld: BalanceBuilder, wallets: Record<string, TestWallet> };

export async function setupInteractive(providerChoice: string): Promise<InteractivePackage> {
    let provider = chooseProvider(providerChoice);
    return await setupInteractiveWithProvider(provider);
}

export async function setupInteractiveWithProvider(provider: IProvider): Promise<InteractivePackage> {
    await NetworkConfig.getDefault().sync(provider);
    let wallets = await loadAndSyncTestWallets(provider);
    let erdSys = await SystemWrapper.load(provider);
    return { erdSys, Egld, wallets };
}

export function chooseProvider(providerChoice: string): IProvider {
    switch (providerChoice) {
        case "local-testnet": return new ProxyProvider("http://localhost:7950", { timeout: 5000 });
        case "elrond-testnet": return new ProxyProvider("https://testnet-gateway.elrond.com", { timeout: 5000 });
        case "elrond-devnet": return new ProxyProvider("https://devnet-gateway.elrond.com", { timeout: 5000 });
        case "elrond-mainnet": return new ProxyProvider("https://gateway.elrond.com", { timeout: 20000 });
        default: throw new ErrInvalidArgument("providerChoice is not recognized (must be one of: \"local-testnet\", \"elrond-testnet\", \"elrond-devnet\", \"elrond-mainnet\")");
    }
}
