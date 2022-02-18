const JSONbig = require("json-bigint");

export const TRANSACTION_OPTIONS_DEFAULT = 0;
export const TRANSACTION_OPTIONS_TX_HASH_SIGN = 1;
export const TRANSACTION_VERSION_DEFAULT = 1;
export const TRANSACTION_VERSION_TX_HASH_SIGN = 2;
export const ESDT_TRANSFER_GAS_LIMIT = 500000;
export const ESDT_TRANSFER_FUNCTION_NAME = "ESDTTransfer";
export const ESDTNFT_TRANSFER_FUNCTION_NAME = "ESDTNFTTransfer";
export const MULTI_ESDTNFT_TRANSFER_FUNCTION_NAME = "MultiESDTNFTTransfer";
export const ESDT_TRANSFER_VALUE = "0";

export const defaultConfig = {
    timeout: 1000,
    // See: https://github.com/axios/axios/issues/983 regarding transformResponse
    transformResponse: [
        function(data: any) {
            return JSONbig.parse(data);
        },
    ],
};
