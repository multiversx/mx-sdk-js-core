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
    `_id`,
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
    `_id`,
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
    `_id`,
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
    `_id`,
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
    `_id`,
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
    `_id`,
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
```
