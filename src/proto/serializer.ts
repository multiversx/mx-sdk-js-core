import BigNumber from "bignumber.js";
import { Address } from "../address";
import { TRANSACTION_OPTIONS_DEFAULT } from "../constants";
import * as errors from "../errors";
import { ITransactionValue } from "../interface";
import { bigIntToBuffer } from "../smartcontracts/codec/utils";
import { Transaction } from "../transaction";
import { proto } from "./compiled";

/**
 * Hides away the serialization complexity, for each type of object (e.g. transactions).
 
 * The implementation is non-generic, but practical: there's a pair of `serialize` / `deserialize` method for each type of object.
 */
export class ProtoSerializer {
    /**
     * Serializes a Transaction object to a Buffer. Handles low-level conversion logic and field-mappings as well.
     */
    serializeTransaction(transaction: Transaction): Buffer {
        let receiverPubkey = new Address(transaction.getReceiver().bech32()).pubkey();
        let senderPubkey = new Address(transaction.getSender().bech32()).pubkey();

        let protoTransaction = new proto.Transaction({
            // mx-chain-go's serializer handles nonce == 0 differently, thus we treat 0 as "undefined".
            Nonce: transaction.getNonce().valueOf() ? transaction.getNonce().valueOf() : undefined,
            Value: this.serializeTransactionValue(transaction.getValue()),
            RcvAddr: receiverPubkey,
            RcvUserName: null,
            SndAddr: senderPubkey,
            SndUserName: null,
            GasPrice: transaction.getGasPrice().valueOf(),
            GasLimit: transaction.getGasLimit().valueOf(),
            Data: transaction.getData().length() == 0 ? null : transaction.getData().valueOf(),
            ChainID: Buffer.from(transaction.getChainID().valueOf()),
            Version: transaction.getVersion().valueOf(),
            Signature: Buffer.from(transaction.getSignature().hex(), "hex")
        });

        if (transaction.getOptions().valueOf() !== TRANSACTION_OPTIONS_DEFAULT) {
            protoTransaction.Options = transaction.getOptions().valueOf();
        }

        let encoded = proto.Transaction.encode(protoTransaction).finish();
        let buffer = Buffer.from(encoded);
        return buffer;
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

    deserializeTransaction(_buffer: Buffer): Transaction {
        // Not needed (yet).
        throw new errors.ErrUnsupportedOperation("deserializeTransaction");
    }
}
