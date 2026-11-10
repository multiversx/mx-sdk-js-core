// Compiled (never executed) by run.sh against the packed tarball, to prove that the published
// type declarations work for a consumer. Deep imports are included on purpose: they pull in
// declaration files that the root entry point does not reference.
import {
    Abi,
    Account,
    Address,
    ApiNetworkProvider,
    DevnetEntrypoint,
    Message,
    MessageComputer,
    Mnemonic,
    ProxyNetworkProvider,
    Token,
    TokenTransfer,
    Transaction,
    TransactionComputer,
    UserSecretKey,
    UserWallet,
} from "@multiversx/sdk-core";
import { cloneBuffer, prependByteToBuffer } from "@multiversx/sdk-core/out/abi/codec/utils";
import { VM_TYPE_WASM_VM } from "@multiversx/sdk-core/out/core/constants";
import { FungibleTokenOfAccountOnNetwork } from "@multiversx/sdk-core/out/networkProviders/tokens";

const address: Address = Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
const transaction = new Transaction({ sender: address, receiver: address, gasLimit: 50000n, chainID: "D" });
const bytesForSigning: Uint8Array = new TransactionComputer().computeBytesForSigning(transaction);
const signature: Uint8Array = UserSecretKey.generate().sign(bytesForSigning);
const buffer: Buffer = prependByteToBuffer(cloneBuffer(Buffer.from("aa", "hex")), 1);
const vmType: Uint8Array = VM_TYPE_WASM_VM;
const proxy = new ProxyNetworkProvider("https://devnet-gateway.multiversx.com", { clientName: "package-tests" });
const balance = new FungibleTokenOfAccountOnNetwork().balance;

console.log(
    signature,
    buffer,
    vmType,
    proxy,
    balance,
    Abi,
    Account,
    ApiNetworkProvider,
    DevnetEntrypoint,
    Message,
    MessageComputer,
    Mnemonic,
    Token,
    TokenTransfer,
    UserWallet,
);
