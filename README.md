# Elrond SDK for JavaScript

Elrond SDK for JavaScript and TypeScript (written in TypeScript).

## Documentation

 - [Cookbook](https://docs.elrond.com/sdk-and-tools/erdjs/erdjs-cookbook/)
 - [TypeDoc](https://elrondnetwork.github.io/elrond-sdk-docs/erdjs/latest)

## CHANGELOG

[CHANGELOG](CHANGELOG.md)

## Distribution

[npm](https://www.npmjs.com/package/@elrondnetwork/erdjs)

## Installation

`erdjs` is delivered via **npm** and it can be installed as follows:

```
npm install @elrondnetwork/erdjs
```

## Development

Feel free to skip this section if you are not a contributor.

### Prerequisites

`browserify` is required to compile the browser-friendly versions of `erdjs`. It can be installed as follows:

```
npm install --global browserify
```

### Building the library

In order to compile `erdjs`, run the following:

```
npm install
npm run compile
npm run compile-browser
npm run compile-browser-min
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

For the `localnet` tests, make sure you have a *local testnet* up & running. A *local testnet* can be started from the Elrond IDE or from [erdpy](https://docs.elrond.com/developers/setup-local-testnet/).
