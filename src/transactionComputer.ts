import { INetworkConfig } from "./interfaceOfNetwork";
import * as errors from "./errors";
import BigNumber from "bignumber.js";
import { ITransaction } from "./interface";
import { ProtoSerializer } from "./proto";
import { Transaction } from "./transaction";
import { BECH32_ADDRESS_LENGTH, TRANSACTION_OPTIONS_TX_GUARDED, TRANSACTION_OPTIONS_TX_HASH_SIGN } from "./constants";

const createTransactionHasher = require("blake2b");
const createKeccakHash = require("keccak");
const TRANSACTION_HASH_LENGTH = 32;

/**
 * An utilitary class meant to work together with the {@link Transaction} class.
 */
export class TransactionComputer {
    constructor() {}

    computeTransactionFee(
        transaction: { gasPrice: bigint; gasLimit: bigint; data: Uint8Array },
        networkConfig: INetworkConfig,
    ): bigint {
        const moveBalanceGas = BigInt(
            networkConfig.MinGasLimit + transaction.data.length * networkConfig.GasPerDataByte,
        );
        if (moveBalanceGas > transaction.gasLimit) {
            throw new errors.ErrNotEnoughGas(parseInt(transaction.gasLimit.toString(), 10));
        }

        const gasPrice = transaction.gasPrice;
        const feeForMove = moveBalanceGas * gasPrice;
        if (moveBalanceGas === transaction.gasLimit) {
            return feeForMove;
        }

        const diff = transaction.gasLimit - moveBalanceGas;
        const modifiedGasPrice = BigInt(
            new BigNumber(gasPrice.toString()).multipliedBy(new BigNumber(networkConfig.GasPriceModifier)).toFixed(0),
        );
        const processingFee = diff * modifiedGasPrice;

        return feeForMove + processingFee;
    }

    computeBytesForSigning(transaction: ITransaction): Uint8Array {
        this.ensureFields(transaction);

        if (transaction.version >= 2 && this.hasOptionsSetForHashSigning(transaction)) {
            return this.computeHashForSigning(transaction);
        }

        const plainTransaction = this.toPlainObjectForSigning(transaction);
        const serialized = JSON.stringify(plainTransaction);
        return new Uint8Array(Buffer.from(serialized));
    }

    computeHashForSigning(transaction: ITransaction): Uint8Array {
        const plainTransaction = this.toPlainObjectForSigning(transaction);
        const signable = Buffer.from(JSON.stringify(plainTransaction));
        return createKeccakHash("keccak256").update(signable).digest();
    }

    computeTransactionHash(transaction: ITransaction): Uint8Array {
        const serializer = new ProtoSerializer();
        const buffer = serializer.serializeTransaction(new Transaction(transaction));
        const hash = createTransactionHasher(TRANSACTION_HASH_LENGTH).update(buffer).digest("hex");

        return Buffer.from(hash, "hex");
    }

    hasOptionsSetForGuardedTransaction(transaction: ITransaction): boolean {
        return (transaction.options & TRANSACTION_OPTIONS_TX_GUARDED) == TRANSACTION_OPTIONS_TX_GUARDED;
    }

    hasOptionsSetForHashSigning(transaction: ITransaction): boolean {
        return (transaction.options & TRANSACTION_OPTIONS_TX_HASH_SIGN) == TRANSACTION_OPTIONS_TX_HASH_SIGN;
    }

    applyGuardian(transaction: ITransaction, guardian: string) {
        transaction.version = 2;
        transaction.options = transaction.options | TRANSACTION_OPTIONS_TX_GUARDED;
        transaction.guardian = guardian;
    }

    private toPlainObjectForSigning(transaction: ITransaction) {
        return {
            nonce: Number(transaction.nonce),
            value: transaction.value.toString(),
            receiver: transaction.receiver,
            sender: transaction.sender,
            senderUsername: this.toBase64OrUndefined(transaction.senderUsername),
            receiverUsername: this.toBase64OrUndefined(transaction.receiverUsername),
            gasPrice: Number(transaction.gasPrice),
            gasLimit: Number(transaction.gasLimit),
            data: this.toBase64OrUndefined(transaction.data),
            chainID: transaction.chainID,
            version: transaction.version,
            options: transaction.options ? transaction.options : undefined,
            guardian: transaction.guardian ? transaction.guardian : undefined,
        };
    }

    private toBase64OrUndefined(value?: string | Uint8Array) {
        return value && value.length ? Buffer.from(value).toString("base64") : undefined;
    }

    private ensureFields(transaction: ITransaction) {
        if (transaction.sender.length !== BECH32_ADDRESS_LENGTH) {
            throw new errors.ErrBadUsage("The `sender` field is not set");
        }

        if (transaction.receiver.length !== BECH32_ADDRESS_LENGTH) {
            throw new errors.ErrBadUsage("The `receiver` field is not set");
        }

        if (!transaction.chainID.length) {
            throw new errors.ErrBadUsage("The `chainID` field is not set");
        }
    }
}
