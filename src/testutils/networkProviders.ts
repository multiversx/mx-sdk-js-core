import { ProxyNetworkProvider } from "../networkProvider";

export function createLocalnetProvider(): ProxyNetworkProvider {
    return new ProxyNetworkProvider("http://localhost:7950", { timeout: 5000 });
}
