import { Address } from "../address";
import { IPlainTransactionObject } from "../interface";
import { Transaction } from "../transaction";

export class TransactionsConverter {
    public transactionToPlainObject(transaction: Transaction): IPlainTransactionObject {
        const plainObject = {
            nonce: Number(transaction.nonce),
            value: transaction.value.toString(),
            receiver: transaction.receiver.bech32(),
            sender: transaction.sender.bech32(),
            senderUsername: this.toBase64OrUndefined(transaction.senderUsername),
            receiverUsername: this.toBase64OrUndefined(transaction.receiverUsername),
            gasPrice: Number(transaction.gasPrice),
            gasLimit: Number(transaction.gasLimit),
            data: this.toBase64OrUndefined(transaction.data),
            chainID: transaction.chainID.valueOf(),
            version: transaction.version,
            options: transaction.options == 0 ? undefined : transaction.options,
            guardian: transaction.guardian.isEmpty() ? undefined : transaction.guardian.bech32(),
            signature: this.toHexOrUndefined(transaction.signature),
            guardianSignature: this.toHexOrUndefined(transaction.guardianSignature),
        };

        return plainObject;
    }

    private toBase64OrUndefined(value?: string | Uint8Array) {
        return value && value.length ? Buffer.from(value).toString("base64") : undefined;
    }

    private toHexOrUndefined(value?: Uint8Array) {
        return value && value.length ? Buffer.from(value).toString("hex") : undefined;
    }

    public plainObjectToTransaction(object: IPlainTransactionObject): Transaction {
        const transaction = new Transaction({
            nonce: BigInt(object.nonce),
            value: BigInt(object.value || ""),
            receiver: Address.newFromBech32(object.receiver),
            receiverUsername: this.bufferFromBase64(object.receiverUsername).toString(),
            sender: Address.newFromBech32(object.sender),
            senderUsername: this.bufferFromBase64(object.senderUsername).toString(),
            guardian: object.guardian ? Address.newFromBech32(object.guardian) : Address.empty(),
            gasPrice: BigInt(object.gasPrice),
            gasLimit: BigInt(object.gasLimit),
            data: this.bufferFromBase64(object.data),
            chainID: String(object.chainID),
            version: Number(object.version),
            options: Number(object.options),
            signature: this.bufferFromHex(object.signature),
            guardianSignature: this.bufferFromHex(object.guardianSignature),
        });

        return transaction;
    }

    private bufferFromBase64(value?: string) {
        return Buffer.from(value || "", "base64");
    }

    private bufferFromHex(value?: string) {
        return Buffer.from(value || "", "hex");
    }
}
