export const TRANSACTION_MIN_GAS_PRICE = 1000000000;
export const TRANSACTION_OPTIONS_DEFAULT = 0;
export const TRANSACTION_OPTIONS_TX_HASH_SIGN = 0b0001;
export const TRANSACTION_OPTIONS_TX_GUARDED = 0b0010;
export const TRANSACTION_VERSION_DEFAULT = 2;
export const MIN_TRANSACTION_VERSION_THAT_SUPPORTS_OPTIONS = 2;
export const ESDT_TRANSFER_GAS_LIMIT = 500000;
export const ESDT_TRANSFER_FUNCTION_NAME = "ESDTTransfer";
export const ESDTNFT_TRANSFER_FUNCTION_NAME = "ESDTNFTTransfer";
export const MULTI_ESDTNFT_TRANSFER_FUNCTION_NAME = "MultiESDTNFTTransfer";
export const ESDT_TRANSFER_VALUE = "0";
export const ARGUMENTS_SEPARATOR = "@";
export const VM_TYPE_WASM_VM = new Uint8Array([0x05, 0x00]);
export const CONTRACT_DEPLOY_ADDRESS = "erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu";
export const DELEGATION_MANAGER_SC_ADDRESS = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqylllslmq6y6";
export const DEFAULT_HRP = "erd";
export const ESDT_CONTRACT_ADDRESS = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u";
export const DEFAULT_MESSAGE_VERSION = 1;
export const MESSAGE_PREFIX = "\x17Elrond Signed Message:\n";
export const HEX_TRANSACTION_HASH_LENGTH = 64;
export const BECH32_ADDRESS_LENGTH = 62;
export const CURRENT_NUMBER_OF_SHARDS_WITHOUT_META = 3;
export const WasmVirtualMachine = "0500";
export const METACHAIN_ID = 4294967295;
export const SDK_JS_SIGNER = "sdk-js";
export const UNKNOWN_SIGNER = "unknown";
