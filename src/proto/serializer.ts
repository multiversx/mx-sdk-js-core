import BigNumber from "bignumber.js";
import { bigIntToBuffer } from "../abi/codec/utils";
import { Address } from "../address";
import { TRANSACTION_OPTIONS_DEFAULT, TRANSACTION_OPTIONS_TX_GUARDED } from "../constants";
import * as errors from "../errors";
import { ITransaction, ITransactionValue } from "../interface";
import { Transaction } from "../transaction";

/**
 * Hides away the serialization complexity, for each type of object (e.g. transactions).
 
 * The implementation is non-generic, but practical: there's a pair of `serialize` / `deserialize` method for each type of object.
 */
export class ProtoSerializer {
    /**
     * Serializes a Transaction object to a Buffer. Handles low-level conversion logic and field-mappings as well.
     */
    serializeTransaction(transaction: Transaction): Buffer {
        const proto = require("./compiled").proto;

        const protoTransaction = this.convertToProtoMessage(transaction);
        const encoded = proto.Transaction.encode(protoTransaction).finish();
        const buffer = Buffer.from(encoded);

        return buffer;
    }

    private convertToProtoMessage(transaction: ITransaction) {
        const proto = require("./compiled").proto;

        const receiverPubkey = new Address(transaction.receiver).getPublicKey();
        const senderPubkey = new Address(transaction.sender).getPublicKey();

        let protoTransaction = new proto.Transaction({
            // mx-chain-go's serializer handles nonce == 0 differently, thus we treat 0 as "undefined".
            Nonce: Number(transaction.nonce) ? Number(transaction.nonce) : undefined,
            Value: this.serializeTransactionValue(transaction.value),
            RcvAddr: receiverPubkey,
            RcvUserName: transaction.receiverUsername
                ? Buffer.from(transaction.receiverUsername).toString("base64")
                : undefined,
            SndAddr: senderPubkey,
            SndUserName: transaction.senderUsername
                ? Buffer.from(transaction.senderUsername).toString("base64")
                : undefined,
            GasPrice: Number(transaction.gasPrice),
            GasLimit: Number(transaction.gasLimit),
            Data: transaction.data.length == 0 ? null : transaction.data,
            ChainID: Buffer.from(transaction.chainID),
            Version: transaction.version,
            Signature: transaction.signature,
        });

        if (transaction.options !== TRANSACTION_OPTIONS_DEFAULT) {
            protoTransaction.Options = transaction.options;
        }

        if (this.isGuardedTransaction(transaction)) {
            protoTransaction.GuardianAddr = new Address(transaction.guardian).getPublicKey();
            protoTransaction.GuardianSignature = transaction.guardianSignature;
        }

        return protoTransaction;
    }

    /**
     * Custom serialization, compatible with mx-chain-go.
     */
    private serializeTransactionValue(transactionValue: ITransactionValue): Buffer {
        let value = new BigNumber(transactionValue.toString());
        if (value.isZero()) {
            return Buffer.from([0, 0]);
        }

        // Will retain the magnitude, as a buffer.
        let buffer = bigIntToBuffer(value);
        // We prepend the "positive" sign marker, in order to be compatible with mx-chain-go's "sign & magnitude" proto-representation (a custom one).
        buffer = Buffer.concat([Buffer.from([0x00]), buffer]);
        return buffer;
    }

    private isGuardedTransaction(transaction: ITransaction): boolean {
        const hasGuardian = transaction.guardian.length > 0;
        const hasGuardianSignature = transaction.guardianSignature.length > 0;
        return this.isWithGuardian(transaction) && hasGuardian && hasGuardianSignature;
    }

    private isWithGuardian(transaction: ITransaction): boolean {
        return (transaction.options & TRANSACTION_OPTIONS_TX_GUARDED) == TRANSACTION_OPTIONS_TX_GUARDED;
    }

    deserializeTransaction(_buffer: Buffer): Transaction {
        // Not needed (yet).
        throw new errors.ErrUnsupportedOperation("deserializeTransaction");
    }
}
