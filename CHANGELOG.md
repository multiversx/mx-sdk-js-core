# Change Log

All notable changes will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

## [7.0.1]
- [Bugfix for Safari - removed negative lookbehind regex #67](https://github.com/ElrondNetwork/elrond-sdk-erdjs/pull/67)
- [Bugfix on WalletConnect signTransactions single Tx case #69](https://github.com/ElrondNetwork/elrond-sdk-erdjs/pull/69)

## [7.0.0]
- [Contract wrapper](https://github.com/ElrondNetwork/elrond-sdk-erdjs/pull/9)
    - Added `ContractWrapper`, `SystemWrapper` - for more details check the pull request.
    - Added support for constructors in ABIs
    - Added ABIs:
      - builtin functions
      - ESDT system smart contract
    - Added `BalanceBuilder` interface
    - Added `NativeSerializer`

    - ### Breaking changes:
      - Changed how a provider is obtained:
        - Removed `getDevnetProvider`, `getTestnetProvider`, `getMainnetProvider`
        - Use added `chooseProvider`
      - Renamed `ESDTToken` to `Token`
      - Changed how test wallets (alice, bob, carol etc.) are obtained, added all 12 test wallets:
        - Removed `TestWallets`
        - Use added function `loadTestWallets` (or `loadInteractive`)

- [Fixed Ledger login](https://github.com/ElrondNetwork/elrond-sdk-erdjs/pull/48)
   - Fixed Ledger login by also setting the index to the device.
  
   - ### Breaking changes:
     - Removed `addressIndex` from constructor
     - Use `addressIndex` from `options` object of `login` function

- [Added Extension Provider for dapp integration #59](https://github.com/ElrondNetwork/elrond-sdk-erdjs/pull/59)

- [Refactored WalletProvider #60](https://github.com/ElrondNetwork/elrond-sdk-erdjs/pull/60)
   - Refactored wallet provider to be compatible with all browsers
   - Added `signTransactions` so users can sign transaction batches
   - Added `getTransactionsFromWalletUrl` endpoint so users can retrieve the decoded `Transaction` object from the `callbackUrl`
  
   - ### Breaking changes:
     - The WalletProvider no longer communicates with the ElrondWallet through an iframe
     - The above means that we no longer have a way to get some info - so `getAddress` will throw `ErrNotImplemented`
     - Removed `customId` from constructor

- [Added signTransactions to the WalletConnectProvider #62](https://github.com/ElrondNetwork/elrond-sdk-erdjs/pull/62)

- [Added signTransactions to the HWProvider #64](https://github.com/ElrondNetwork/elrond-sdk-erdjs/pull/64)

## [6.6.2]
-   [Quickfix - added custom id to iframe creation #55](https://github.com/ElrondNetwork/elrond-sdk-erdjs/pull/55)

## [6.6.1]
-   [Bugfixed WalletProvider by adding possibility to match iframe by id #53](https://github.com/ElrondNetwork/elrond-sdk-erdjs/pull/53)

## [6.6.0]
-   [Added signature to walletConnectProvider to handle Token Login #49](https://github.com/ElrondNetwork/elrond-sdk-erdjs/pull/49)

## [6.5.2]
-   [Bugfix - corrected compute hash for transaction with options #44](https://github.com/ElrondNetwork/elrond-sdk-erdjs/pull/44)

## [6.5.1]
-   [Adapted message signing for ledger #42](https://github.com/ElrondNetwork/elrond-sdk-erdjs/pull/42)

## [6.5.0]
-   [Extended SignableMessage to allow export to JSON #40](https://github.com/ElrondNetwork/elrond-sdk-erdjs/pull/40)
-   [Bugfix: fixed option decoder #39](https://github.com/ElrondNetwork/elrond-sdk-erdjs/pull/39)

## [6.4.1]
-   [Keep WalletConnect session alive if still connected on init() #37](https://github.com/ElrondNetwork/elrond-sdk-erdjs/pull/37)

## [6.4.0]
-   [Added web wallet token option for login hook #33](https://github.com/ElrondNetwork/elrond-sdk-erdjs/pull/33)

## [6.3.1]
-   [Bugfix - Exported UserVerifier #31](https://github.com/ElrondNetwork/elrond-sdk-erdjs/pull/31)

## [6.3.0]
-   [Added message signing component #28](https://github.com/ElrondNetwork/elrond-sdk-erdjs/pull/28)

## [6.2.1]
-   [Bugfix for number of accounts returned by getAccounts #26](https://github.com/ElrondNetwork/elrond-sdk-erdjs/pull/26)

## [6.2.0]
-   [Added custom message to the walletconnect provider #23](https://github.com/ElrondNetwork/elrond-sdk-erdjs/pull/23)

## [6.1.1]

-   [Updated ESDTToken fields to match new API response #20](https://github.com/ElrondNetwork/elrond-sdk-erdjs/pull/20)
    -   `token` is now `identifier`

## [6.1.0]

-   [Added simple signing function for dapp providers #17](https://github.com/ElrondNetwork/elrond-sdk-erdjs/pull/17)

## [6.0.0]

-   [Added encryption component #11](https://github.com/ElrondNetwork/elrond-sdk-erdjs/pull/11)
-   [Added option to config the axios requests #10](https://github.com/ElrondNetwork/elrond-sdk-erdjs/pull/10)
    -   Breaking changes:
        1. `new ProxyProvider(url: string, timeout?: number)` becomes `new ProxyProvider(url: string, config?: AxiosRequestConfig)` -
           note that `timeout` can still be passed in the `config` object

## [5.0.1] - 07.06.2021

-   [Feat/nft token #3](https://github.com/ElrondNetwork/elrond-sdk-erdjs/pull/3)

## [5.0.0] - 19.05.2021

-   [Remove event target and add callback #310](https://github.com/ElrondNetwork/elrond-sdk/pull/310)
-   [FIx abi registry for struct type #309](https://github.com/ElrondNetwork/elrond-sdk/pull/309)
-   [added helpers functions for esdt and sc arguments parser #301](https://github.com/ElrondNetwork/elrond-sdk/pull/301)
-   Update packages #298, #299, #302, #303, #304, #305

## [4.2.2] - 06.05.2021

-   [Fix infinite loop on wallet connect logout #294](https://github.com/ElrondNetwork/elrond-sdk/pull/294)

## [4.2.1] - 05.05.2021

-   [Fix get transaction endpoint #290](https://github.com/ElrondNetwork/elrond-sdk/pull/290)

## [4.2.0] - 05.05.2021

-   [Add wallet connect provider #286](https://github.com/ElrondNetwork/elrond-sdk/pull/286)

## [4.1.0] - 29.04.2021

-   [Add decode string and decode bignumber #282](https://github.com/ElrondNetwork/elrond-sdk/pull/282)
-   [Add generic methods for GET and POST #280](https://github.com/ElrondNetwork/elrond-sdk/pull/280)
-   [Fix Dapp callback URL #278](https://github.com/ElrondNetwork/elrond-sdk/pull/278)
-   [Add esdtTokens endpoints #272](https://github.com/ElrondNetwork/elrond-sdk/pull/272)
-   [Add TupleType #268](https://github.com/ElrondNetwork/elrond-sdk/pull/268)
-   Other minor fixes #281 #279 #277 #276 #265 #260 #259

## [4.0.3] - 02.04.2021

-   [ABI-based contract interaction. Redesigned typing system #107](https://github.com/ElrondNetwork/elrond-sdk/pull/107)
-   [Add `variadic` type for typeMapper #257](https://github.com/ElrondNetwork/elrond-sdk/pull/257)

## [3.1.3] - 26.03.2021

-   [Fixed ledger signing using hash fields #245](https://github.com/ElrondNetwork/elrond-sdk/pull/245)

## [3.1.2] - 24.03.2021

-   [Fixed ledger login feature #240](https://github.com/ElrondNetwork/elrond-sdk/pull/240)
-   [Fixed asBool value for contract query response #241](https://github.com/ElrondNetwork/elrond-sdk/pull/241)

## [3.1.1] - 22.03.2021

-   [Fixed a bug on account query regarding usernames #235](https://github.com/ElrondNetwork/elrond-sdk/pull/235)

## [3.1.0] - 03.03.2021

-   [Added network status endpoint #229](https://github.com/ElrondNetwork/elrond-sdk/pull/229)
-   [Sign tx with hash functionality #217](https://github.com/ElrondNetwork/elrond-sdk/pull/217)

## [3.0.0] - 03.03.2021

-   [Switched from native BigInt to bignumber.js #218](https://github.com/ElrondNetwork/elrond-sdk/pull/218)

## [2.3.0] - 16.02.2021

-   [Minor bugfixes and new getNetworkStats function #203](https://github.com/ElrondNetwork/elrond-sdk/pull/203)

## [2.2.2] - 11.02.2021

-   [Walletcore minor fixes on Uint8Array casting before Buffers are passet to tweetnacl #198](https://github.com/ElrondNetwork/elrond-sdk/pull/198)

## [2.2.1] - 10.02.2021

-   [Walletcore improvements - minor fixes on PEM parsing, added tests #195](https://github.com/ElrondNetwork/elrond-sdk/pull/195)

## [2.2.0] - 09.02.2021

-   [Add api provider and userName to getAccount #191](https://github.com/ElrondNetwork/elrond-sdk/pull/191)

## [2.1.0] - 05.02.2021

-   [Add logout on dapp #183](https://github.com/ElrondNetwork/elrond-sdk/pull/183)

## [2.0.0] - 03.02.2021

-   [Fix query http request #178](https://github.com/ElrondNetwork/elrond-sdk/pull/178)

## [1.1.9] - 03.02.2021

-   [Add handling for null on Contract return data #160](https://github.com/ElrondNetwork/elrond-sdk/pull/160)

## [1.1.8] - 15.01.2021

-   Publish erdjs via Github Actions #151.
-   Minor fixes for dApps (wallet integration) #153.

## [1.1.7] - 15.01.2021

-   Bring core-js into erdjs (user wallets & signing, validator signing).
-   Run all tests (unit and integration) in browser, as well.
-   Separate builds: erdjs with / without wallet components.

## [1.1.5] - 06.01.2021

-   Updated axios library due to security vulnerabilities.

## [1.1.4] - 10.12.2020

-   Add some utility functions for ABI (needed for some interaction examples among SC templates).

## [1.1.3] - 03.12.2020

Pull requests:

-   [New type system (with generics), codecs (elrond-wasm alike) and ABI prototype.](https://github.com/ElrondNetwork/elrond-sdk/pull/87)
-   [Compute TX hash off-line](https://github.com/ElrondNetwork/elrond-sdk/pull/93)

In more detail:

-   New typing system to better match elrond-wasm's typing system (our standard typing system for smart contracts). Generics (simple or nested) included.
-   ABI prototype (functions, structures).
-   Codec utilities
-   Optional arguments supported as well.
-   Compute TX hash in an off-line fashion (not relying on the Node / Proxy).

Breaking changes:

-   Members of `Argument` class have been renamed.
-   Members of `Balance` class have been renamed.

## [1.1.2] - 17.11.2020

-   Removed useless check and add the current Ledger selection as sender.

## [1.1.1] - 17.11.2020

-   Corrected transaction object sent to the wallet provider.

## [1.1.0] - 13.11.2020

-   Add elrond-wallet and hardware wallet support.

## [1.0.8] - 03.11.2020

-   Export `backendSigner` as well (for `NodeJS` version).
-   Fix (update) the example `backend-dispatcher`.

## [1.0.7] - 02.11.2020

-   Moved release `1.0.7` out of beta.

## [1.0.7-beta1] - 30.10.2020

-   Added comments & documentation.
-   Implemented utilities for contract queries.
-   Made `erdjs` smaller, for loading in browsers.
-   Applied several steps of refactoring.
-   Improved reporting of HTTP-related errors.
-   Fixed parsing of big integers in `axios` responses.
-   Implemented a simple logger component.
-   Improved tests (added more unit tests and integration tests).
-   Fixed implementation of `length()` for `TransactionPayload`.
