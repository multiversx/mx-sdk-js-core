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
