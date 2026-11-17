# Testdata

## Files `transactions.mainnet.json`

Transactions were sampled from the mainnet BigQuery dataset:

```sql
DECLARE
  TIMESTAMP_START DATE DEFAULT '2024-09-01';
DECLARE
  TIMESTAMP_END DATE DEFAULT '2024-09-03';
  -- Contract execute, with success
  (
  SELECT
    `_id` `hash`,
    'execute_success' `kind`
  FROM
    `multiversx-blockchain-etl.crypto_multiversx_mainnet_eu.transactions`
  WHERE
    DATE(`timestamp`) >= TIMESTAMP_START
    AND DATE(`timestamp`) <= TIMESTAMP_END
    AND `isScCall` = TRUE
    AND ARRAY_LENGTH(`esdtValues`) = 0
    AND `status` = 'success'
    AND RAND() < 0.25
  LIMIT
    250 )
UNION ALL
  -- Contract execute, with error
  (
  SELECT
    `_id` `hash`,
    'execute_error' `kind`
  FROM
    `multiversx-blockchain-etl.crypto_multiversx_mainnet_eu.transactions`
  WHERE
    DATE(`timestamp`) >= TIMESTAMP_START
    AND DATE(`timestamp`) <= TIMESTAMP_END
    AND `isScCall` = TRUE
    AND ARRAY_LENGTH(`esdtValues`) = 0
    AND `status` = 'fail'
    AND RAND() < 0.25
  LIMIT
    250 )
UNION ALL
  -- Contract transfer & execute, with success
  (
  SELECT
    `_id` `hash`,
    'transfer_execute_success' `kind`
  FROM
    `multiversx-blockchain-etl.crypto_multiversx_mainnet_eu.transactions`
  WHERE
    DATE(`timestamp`) >= TIMESTAMP_START
    AND DATE(`timestamp`) <= TIMESTAMP_END
    AND `isScCall` = TRUE
    AND ARRAY_LENGTH(`esdtValues`) > 0
    AND `status` = 'success'
    AND RAND() < 0.25
  LIMIT
    250 )
UNION ALL
  -- Contract transfer & execute, with error
  (
  SELECT
    `_id` `hash`,
    'transfer_execute_error' `kind`
  FROM
    `multiversx-blockchain-etl.crypto_multiversx_mainnet_eu.transactions`
  WHERE
    DATE(`timestamp`) >= TIMESTAMP_START
    AND DATE(`timestamp`) <= TIMESTAMP_END
    AND `isScCall` = TRUE
    AND ARRAY_LENGTH(`esdtValues`) > 0
    AND `status` = 'fail'
    AND RAND() < 0.25
  LIMIT
    250)
UNION ALL
  -- Relayed, with success
  (
  SELECT
    `_id` `hash`,
    'relayed_success' `kind`
  FROM
    `multiversx-blockchain-etl.crypto_multiversx_mainnet_eu.transactions`
  WHERE
    DATE(`timestamp`) >= TIMESTAMP_START
    AND DATE(`timestamp`) <= TIMESTAMP_END
    AND `isRelayed` = TRUE
    AND `status` = 'success'
    AND RAND() < 0.25
  LIMIT
    50)
UNION ALL
  -- Relayed, with failure
  (
  SELECT
    `_id` `hash`,
    'relayed_error' `kind`
  FROM
    `multiversx-blockchain-etl.crypto_multiversx_mainnet_eu.transactions`
  WHERE
    DATE(`timestamp`) >= TIMESTAMP_START
    AND DATE(`timestamp`) <= TIMESTAMP_END
    AND `isRelayed` = TRUE
    AND `status` = 'fail'
    AND RAND() < 0.25
  LIMIT
    50)
UNION ALL
  -- MultiESDTNFTTransfer, with too much gas
  (
  SELECT
    `_id` `hash`,
    'multi_transfer_too_much_gas' `kind`
  FROM 
    `multiversx-blockchain-etl.crypto_multiversx_mainnet_eu.transactions`
  WHERE
    DATE(`timestamp`) >= TIMESTAMP_START
    AND DATE(`timestamp`) <= TIMESTAMP_END
    AND `operation` = 'MultiESDTNFTTransfer'
    AND `function` IS NULL
    AND `isRelayed` IS NULL
    AND `status` = 'success'
    AND `gasLimit` = `gasUsed`
    AND ARRAY_LENGTH(`tokens`) = 1
    AND `receiversShardIDs`[0] != `senderShard`
    AND RAND() < 0.25
  LIMIT
    20)
```

## Files `blsVectors.json` and `blsVectorsExtended.json`

Test vectors for the validator keys (BLS12-381, as implemented by Herumi's MCL library and used by the Node).
They are consumed by `src/wallet/validatorKeysVectors.spec.ts` and `src/wallet/validatorKeysReference.spec.ts`.
In both files, the secret keys, the public keys and the signatures are hex-encoded, in the serialization used by the Node
(little-endian `x` coordinate; the highest bit of the last byte tells whether `y` is odd).

### `blsVectors.json`

1250 vectors (610 secret keys, 5 messages), generated with the Go implementation (`mx-chain-crypto-go`).
The file is an unaltered copy of `src/testdata/blsVectors.json` from
[mx-deprecated-sdk-js-wallet#51](https://github.com/multiversx/mx-deprecated-sdk-js-wallet/pull/51)
(SHA-256: `825c88c6ad4fb4e81a3bb99d016e970091392f1a75ca446a754df5c3bcb1bbf9`).

- `message` is plain text; what gets signed is its UTF-8 encoding.
- `messageMapped` is the message, hashed and mapped to G1.
- `publicKeyAsPoint`, `messageMappedAsPoint` and `signatureAsPoint` hold the coordinates of the points (decimal).
  They can't be checked through the public API of the SDK; they are kept to help debugging an implementation.

### `blsVectorsExtended.json`

335 vectors that cover what the file above does not (it only holds 5 distinct messages):

- `edge-keys`: the smallest and the largest secret keys, powers of two etc.
- `message-lengths`: random messages of every length between 0 and 255 bytes, then up to 4096 bytes, signed with random keys.
- `structured-messages`: zeros, `0xff`, all the byte values, multi-byte UTF-8 text etc., signed with one well-known key.

Together, they take every path of the hash-and-map to G1 (field `hashToCurve`, not used by the tests):
whether the hash had to be cut twice in order to fit the field (`maskedTwice`), which of the three candidates for `x` landed
on the curve (`candidate`), and whether `y` was negated (`negated`).

Field `messageMapped` is the message, hashed and mapped to G1. It equals the signature produced by the secret key `1`,
which is how the tests check the hash-and-map step on its own.

The vectors were generated in November 2026 with `@multiversx/sdk-bls-wasm@0.3.6` (Herumi, as WebAssembly).
Each of them was also computed with an independent implementation written on top of `@noble/curves@1.9.7`
(same public key, same mapped message, same signature), and each signature was verified by both implementations.
