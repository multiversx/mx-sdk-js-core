import { AxiosHeaders } from "axios";
import { UnknownClientName } from "./constants";
import { NetworkProviderConfig } from "./networkProviderConfig";

export function extendUserAgentIfBackend(userAgentPrefix: string, config: NetworkProviderConfig) {
    if (isBackend()) {
        extendUserAgent(userAgentPrefix, config);
    }
}

function extendUserAgent(userAgentPrefix: string, config: NetworkProviderConfig) {
    if (!config.headers) {
        config.headers = new AxiosHeaders({});
    }
    if (!config.clientName) {
        console.log(
            "We recommend providing the `clientName` when instantiating a NetworkProvider (e.g. ProxyNetworkProvider, ApiNetworkProvider). This information will be used for metrics collection and improving our services.",
        );
    }
    const headers = AxiosHeaders.from(config.headers as AxiosHeaders).normalize(true);
    const resolvedClientName = config.clientName || UnknownClientName;

    const currentUserAgent = headers.hasUserAgent() ? headers.getUserAgent() : "";
    const newUserAgent = currentUserAgent
        ? `${currentUserAgent} ${userAgentPrefix}/${resolvedClientName}`
        : `${userAgentPrefix}/${resolvedClientName}`;

    headers.setUserAgent(newUserAgent, true);
}

function isBackend(): boolean {
    return typeof window === "undefined";
}
