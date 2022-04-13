# Elrond SDK for JavaScript

Elrond SDK for JavaScript and TypeScript (written in TypeScript).

## Documentation

[Cookbook](https://docs.elrond.com/sdk-and-tools/erdjs/erdjs-cookbook/)
[TypeDoc](https://elrondnetwork.github.io/elrond-sdk-docs/erdjs/latest)

## CHANGELOG

[CHANGELOG](CHANGELOG.md)

## Distribution

[npm](https://www.npmjs.com/package/@elrondnetwork/erdjs)

### Creating Smart Contract transactions

```
let contract = new SmartContract({ address: new Address("erd1qqqqqqqqqqqqqpgq3ytm9m8dpeud35v3us20vsafp77smqghd8ss4jtm0q") });
let addressOfCarol = new Address("erd1k2s324ww2g0yj38qn2ch2jwctdy8mnfxep94q9arncc6xecg3xaq6mjse8");

let tx = contract.call({
    func: new ContractFunction("transferToken"),
    gasLimit: new GasLimit(5000000),
    args: [new AddressValue(addressOfCarol), new U64Value(1000)]
});

tx.setNonce(alice.nonce);
await signer.sign(tx);
await provider.sendTransaction(tx);
```

### Querying Smart Contracts

```
let contract = new SmartContract({ address: new Address("erd1qqqqqqqqqqqqqpgqxwakt2g7u9atsnr03gqcgmhcv38pt7mkd94q6shuwt") });
let addressOfAlice = new Address("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");

let response = await contract.runQuery(provider, {
    func: new ContractFunction("getClaimableRewards"),
    args: [new AddressValue(addressOfAlice)]
});

console.log(response.isSuccess());
console.log(response.returnData);
```

### Waiting for transactions to be processed

```
await provider.sendTransaction(tx1);
await provider.sendTransaction(tx2);
await provider.sendTransaction(tx3);

let watcher = new TransactionWatcher(provider);
await Promise.all([watcher.awaitCompleted(tx1), watcher.awaitCompleted(tx2), watcher.awaitCompleted(tx3)]);
```

### Managing the sender nonce locally

```

await provider.sendTransaction(txA);
await provider.sendTransaction(txB);

let watcher = new TransactionWatcher(provider);

await watcher.awaitCompleted(txA);
await watcher.awaitCompleted(txB);
```

## Installation

`erdjs` is delivered via [npm](https://www.npmjs.com/package/@elrondnetwork/erdjs), therefore it can be installed as follows:

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

#### On NodeJS

In order to run the tests **on NodeJS**, do as follows:

```
npm run tests-unit
npm run tests-localnet
npm run tests-devnet
npm run tests-testnet
npm run tests-mainnet
```

#### In the browser

Make sure you have the package `http-server` installed globally.

```
npm install --global http-server
```

In order to run the tests **in the browser**, do as follows:

```
make clean && npm run browser-tests
```

#### Notes

For the `localnet` tests, make sure you have a *local testnet* up & running. A *local testnet* can be started from the Elrond IDE or from [erdpy](https://docs.elrond.com/developers/setup-local-testnet/).
