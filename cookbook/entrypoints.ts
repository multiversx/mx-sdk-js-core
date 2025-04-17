import { DevnetEntrypoint } from "../src"; // md-ignore
// md-start
(async () => {
    // ## Overview

    // This guide walks you through handling common tasks using the MultiversX Javascript SDK (v14, latest stable version).

    // ## Creating an Entrypoint

    // An Entrypoint represents a network client that simplifies access to the most common operations.
    // There is a dedicated entrypoint for each network: `MainnetEntrypoint`,  `DevnetEntrypoint`, `TestnetEntrypoint`, `LocalnetEntrypoint`.

    // For example, to create a Devnet entrypoint you have the following command:

    // ```js
    const entrypoint = new DevnetEntrypoint();
    // ```

    // #### Using a Custom API
    // If you'd like to connect to a third-party API, you can specify the url parameter:

    // ```js
    const apiEntrypoint = new DevnetEntrypoint("https://custom-multiversx-devnet-api.com");
    // ```

    // #### Using a Proxy

    // By default, the DevnetEntrypoint uses the standard API. However, you can create a custom entrypoint that interacts with a proxy by specifying the kind parameter:

    // ```js
    const customEntrypoint = new DevnetEntrypoint("https://devnet-gateway.multiversx.com", "proxy");
    // ```
})().catch((e) => {
    console.log({ e });
});
