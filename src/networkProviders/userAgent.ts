import { getAxios } from "../core/utils";
import { UnknownClientName } from "./constants";
import { NetworkProviderConfig } from "./networkProviderConfig";

export function extendUserAgentIfBackend(userAgentPrefix: string, config: NetworkProviderConfig) {
    if (isBackend()) {
        extendUserAgent(userAgentPrefix, config);
    }
}

function extendUserAgent(userAgentPrefix: string, config: NetworkProviderConfig) {
    // axios is an optional dependency, so it is loaded on first use and never at module load.
    // The annotation is type-only and is erased from the compiled output.
    const { AxiosHeaders }: typeof import("axios") = getAxios();

    if (!config.clientName) {
        console.log(
            "We recommend providing the `clientName` when instantiating a NetworkProvider (e.g. ProxyNetworkProvider, ApiNetworkProvider). This information will be used for metrics collection and improving our services.",
        );
    }

    // The headers are copied, extended, then assigned back to the config.
    // Extending them in place is not an option: the caller may pass a plain object (in which case there
    // is no AxiosHeaders instance to extend), or reuse one headers object for several providers
    // (in which case the user agent would accumulate, and the caller's object would be altered).
    const headers = new AxiosHeaders(config.headers as InstanceType<typeof AxiosHeaders>).normalize(true);
    const resolvedClientName = config.clientName || UnknownClientName;

    const currentUserAgent = headers.hasUserAgent() ? headers.getUserAgent() : "";
    const newUserAgent = currentUserAgent
        ? `${currentUserAgent} ${userAgentPrefix}/${resolvedClientName}`
        : `${userAgentPrefix}/${resolvedClientName}`;

    headers.setUserAgent(newUserAgent, true);
    config.headers = headers;
}

function isBackend(): boolean {
    return typeof window === "undefined";
}
