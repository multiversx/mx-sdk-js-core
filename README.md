# MultiversX SDK for JavaScript and TypeScript

MultiversX SDK for JavaScript and TypeScript (written in TypeScript).

## Documentation

- [Cookbook](https://docs.multiversx.com/sdk-and-tools/sdk-js/sdk-js-cookbook/)
- [Auto-generated documentation](https://multiversx.github.io/mx-sdk-js-core/)

## Distribution

[npm](https://www.npmjs.com/package/@multiversx/sdk-core)

## Installation

`sdk-core` is delivered via **npm** and it can be installed as follows:

```
npm install @multiversx/sdk-core
```

## Requirements

- **Node.js 22.13 or later.** The package declares this in `engines`; it is tested on Node.js 22.13.0, 22, 24 and 26. For older versions of Node.js, use v16 of the package.
- **TypeScript 5.0 or later**, for projects written in TypeScript. With strict library checks (`skipLibCheck: false`), `@types/node` has to be installed as well.
- **Peer dependencies:** `bignumber.js` (`^9.0.1`) and `protobufjs` (`^7.6.5`) have to be installed alongside the package.
- **Optional dependencies:** `axios` (for the network providers) and `bip39` (for mnemonics), see [below](#optional-dependencies).

Support policy: the package supports the Node.js release lines that are maintained upstream. Dropping a release line that reached its end-of-life is not considered a breaking change, and is done in a minor release.

## Development

Feel free to skip this section if you are not a contributor.

### Prerequisites

Use the Node.js version given in `.nvmrc`, then install the dependencies:

```
npm ci
```

## Optional Dependencies

### axios

This package can make HTTP requests using `axios`, which is not bundled by default. If you plan to use the API network provider or Proxy network provider, make sure to install `axios`:

```bash
npm install axios
```

### bip39

This package provides mnemonic and seed generation functionality using `bip39`, but it is not bundled by default. If you plan to use mnemonic-related features, make sure to install this optional dependency:

```bash
npm install bip39
```

### Building the library

In order to compile the library, run the following:

```
npm install
npm run compile
npm run compile-browser
```

### Running the tests

In order to run the tests **on NodeJS**, do as follows:

```
npm run tests-unit
npm run tests-localnet
npm run tests-devnet
npm run tests-testnet
```

Before running the tests **in the browser**, make sure you have the package `http-server` installed globally.

```
npm install --global http-server
```

In order to run the tests **in the browser**, do as follows:

```
make clean && npm run browser-tests
```

For the `localnet` tests, make sure you have a _local testnet_ up & running. In order to start a _local testnet_, follow [this](https://docs.multiversx.com/developers/setup-local-testnet/).
