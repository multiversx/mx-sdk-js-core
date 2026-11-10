import { AxiosHeaders } from "axios";
import { assert } from "chai";
import { ApiNetworkProvider } from "./apiNetworkProvider";
import { NetworkProviderConfig } from "./networkProviderConfig";
import { ProxyNetworkProvider } from "./proxyNetworkProvider";

describe("test user agent of network providers", function () {
    before(function () {
        // Browsers do not allow setting the "User-Agent" header, so the providers only set it on the backend.
        if (typeof window !== "undefined") {
            this.skip();
        }
    });

    function createProxyProvider(config?: NetworkProviderConfig): any {
        return new ProxyNetworkProvider("https://localhost", config);
    }

    function createApiProvider(config?: NetworkProviderConfig): any {
        return new ApiNetworkProvider("https://localhost", config);
    }

    it("should set the user agent when no config is provided", function () {
        const proxy = createProxyProvider();
        const api = createApiProvider();

        assert.equal(proxy.config.headers.getUserAgent(), "multiversx-sdk/proxy/unknown");
        assert.equal(api.config.headers.getUserAgent(), "multiversx-sdk/api/unknown");
    });

    it("should set the user agent on the proxy provider that backs the API provider when no config is provided", function () {
        const api = createApiProvider();

        assert.equal(api.backingProxyNetworkProvider.config.headers.getUserAgent(), "multiversx-sdk/proxy/unknown");
    });

    it("should set the user agent when the config is empty", function () {
        const proxy = createProxyProvider({});
        const api = createApiProvider({});

        assert.equal(proxy.config.headers.getUserAgent(), "multiversx-sdk/proxy/unknown");
        assert.equal(api.config.headers.getUserAgent(), "multiversx-sdk/api/unknown");
    });

    it("should set the user agent when no headers are provided", function () {
        const proxy = createProxyProvider({ clientName: "test" });
        const api = createApiProvider({ clientName: "test" });

        assert.equal(proxy.config.headers.getUserAgent(), "multiversx-sdk/proxy/test");
        assert.equal(api.config.headers.getUserAgent(), "multiversx-sdk/api/test");
    });

    it("should use 'unknown' when headers are provided, but no client name", function () {
        const proxy = createProxyProvider({ headers: { "X-Api-Key": "key" } });
        const api = createApiProvider({ headers: { "X-Api-Key": "key" } });

        assert.equal(proxy.config.headers.getUserAgent(), "multiversx-sdk/proxy/unknown");
        assert.equal(api.config.headers.getUserAgent(), "multiversx-sdk/api/unknown");
    });

    it("should set the user agent when headers are provided as a plain object", function () {
        const proxy = createProxyProvider({ clientName: "test", headers: { "X-Api-Key": "key" } });
        const api = createApiProvider({ clientName: "test", headers: { "X-Api-Key": "key" } });

        assert.equal(proxy.config.headers.getUserAgent(), "multiversx-sdk/proxy/test");
        assert.equal(proxy.config.headers.get("X-Api-Key"), "key");
        assert.equal(api.config.headers.getUserAgent(), "multiversx-sdk/api/test");
        assert.equal(api.config.headers.get("X-Api-Key"), "key");
    });

    it("should set the user agent when headers are provided as AxiosHeaders", function () {
        const proxy = createProxyProvider({ clientName: "test", headers: new AxiosHeaders({ "X-Api-Key": "key" }) });
        const api = createApiProvider({ clientName: "test", headers: new AxiosHeaders({ "X-Api-Key": "key" }) });

        assert.equal(proxy.config.headers.getUserAgent(), "multiversx-sdk/proxy/test");
        assert.equal(proxy.config.headers.get("X-Api-Key"), "key");
        assert.equal(api.config.headers.getUserAgent(), "multiversx-sdk/api/test");
        assert.equal(api.config.headers.get("X-Api-Key"), "key");
    });

    it("should append to a user agent provided in a plain object", function () {
        const proxy = createProxyProvider({ clientName: "test", headers: { "User-Agent": "my-app/1.0" } });
        const api = createApiProvider({ clientName: "test", headers: { "User-Agent": "my-app/1.0" } });

        assert.equal(proxy.config.headers.getUserAgent(), "my-app/1.0 multiversx-sdk/proxy/test");
        assert.equal(api.config.headers.getUserAgent(), "my-app/1.0 multiversx-sdk/api/test");
    });

    it("should append to a user agent provided in AxiosHeaders", function () {
        const proxy = createProxyProvider({
            clientName: "test",
            headers: new AxiosHeaders({ "User-Agent": "my-app/1.0" }),
        });
        const api = createApiProvider({
            clientName: "test",
            headers: new AxiosHeaders({ "User-Agent": "my-app/1.0" }),
        });

        assert.equal(proxy.config.headers.getUserAgent(), "my-app/1.0 multiversx-sdk/proxy/test");
        assert.equal(api.config.headers.getUserAgent(), "my-app/1.0 multiversx-sdk/api/test");
    });

    it("should append to a user agent provided with a lowercase header name", function () {
        const proxy = createProxyProvider({ clientName: "test", headers: { "user-agent": "my-app/1.0" } });

        assert.equal(proxy.config.headers.getUserAgent(), "my-app/1.0 multiversx-sdk/proxy/test");
        assert.deepEqual(Object.keys(proxy.config.headers.toJSON()), ["User-Agent"]);
    });

    it("should set the user agent on the proxy provider that backs the API provider", function () {
        const api = createApiProvider({ clientName: "test", headers: { "X-Api-Key": "key" } });
        const backingProxy = api.backingProxyNetworkProvider;

        assert.equal(backingProxy.config.headers.getUserAgent(), "multiversx-sdk/proxy/test");
        assert.equal(backingProxy.config.headers.get("X-Api-Key"), "key");
    });

    it("should not alter the headers provided by the caller", function () {
        const plainHeaders = { "X-Api-Key": "key" };
        const axiosHeaders = new AxiosHeaders({ "X-Api-Key": "key" });

        createProxyProvider({ clientName: "test", headers: plainHeaders });
        createProxyProvider({ clientName: "test", headers: axiosHeaders });

        assert.deepEqual(plainHeaders, { "X-Api-Key": "key" });
        assert.deepEqual(axiosHeaders.toJSON(), { "X-Api-Key": "key" });
    });

    it("should not accumulate user agents when a config is used for several providers", function () {
        const config = { clientName: "test", headers: new AxiosHeaders({ "User-Agent": "my-app/1.0" }) };

        const proxy = createProxyProvider(config);
        const api = createApiProvider(config);
        const secondProxy = createProxyProvider(config);

        assert.equal(proxy.config.headers.getUserAgent(), "my-app/1.0 multiversx-sdk/proxy/test");
        assert.equal(api.config.headers.getUserAgent(), "my-app/1.0 multiversx-sdk/api/test");
        assert.equal(secondProxy.config.headers.getUserAgent(), "my-app/1.0 multiversx-sdk/proxy/test");
    });
});
