import { Address } from "./address";
import { IAddress, ITokenTransfer } from "./interface";
import { ArgSerializer } from "./smartcontracts/argSerializer";
import { AddressValue, BigUIntValue, BytesValue, TypedValue, U16Value, U64Value } from "./smartcontracts/typesystem";
import { TokenTransfer } from "./tokens";
import { TransactionPayload } from "./transactionPayload";

/**
 * @deprecated Use {@link TransferTransactionsFactory} instead.
 */
export class ESDTTransferPayloadBuilder {
    payment: ITokenTransfer = TokenTransfer.fungibleFromAmount("", "0", 0);

    setPayment(payment: ITokenTransfer): ESDTTransferPayloadBuilder {
        this.payment = payment;
        return this;
    }

    build(): TransactionPayload {
        let args: TypedValue[] = [
            // The token identifier
            BytesValue.fromUTF8(this.payment.tokenIdentifier),
            // The transfered amount
            new BigUIntValue(this.payment.valueOf()),
        ];

        let { argumentsString } = new ArgSerializer().valuesToString(args);
        let data = `ESDTTransfer@${argumentsString}`;
        return new TransactionPayload(data);
    }
}

/**
 * @deprecated Use {@link TransferTransactionsFactory} instead.
 */
export class ESDTNFTTransferPayloadBuilder {
    payment: ITokenTransfer = TokenTransfer.nonFungible("", 0);
    destination: IAddress = Address.empty();

    setPayment(payment: ITokenTransfer): ESDTNFTTransferPayloadBuilder {
        this.payment = payment;
        return this;
    }

    setDestination(destination: IAddress): ESDTNFTTransferPayloadBuilder {
        this.destination = destination;
        return this;
    }

    build(): TransactionPayload {
        let args: TypedValue[] = [
            // The token identifier
            BytesValue.fromUTF8(this.payment.tokenIdentifier),
            // The nonce of the token
            new U64Value(this.payment.nonce),
            // The transferred quantity
            new BigUIntValue(this.payment.valueOf()),
            // The destination address
            new AddressValue(this.destination),
        ];

        let { argumentsString } = new ArgSerializer().valuesToString(args);
        let data = `ESDTNFTTransfer@${argumentsString}`;
        return new TransactionPayload(data);
    }
}

/**
 * @deprecated Use {@link TransferTransactionsFactory} instead.
 */
export class MultiESDTNFTTransferPayloadBuilder {
    payments: ITokenTransfer[] = [];
    destination: IAddress = Address.empty();

    setPayments(payments: ITokenTransfer[]): MultiESDTNFTTransferPayloadBuilder {
        this.payments = payments;
        return this;
    }

    setDestination(destination: IAddress): MultiESDTNFTTransferPayloadBuilder {
        this.destination = destination;
        return this;
    }

    build(): TransactionPayload {
        let args: TypedValue[] = [
            // The destination address
            new AddressValue(this.destination),
            // Number of tokens
            new U16Value(this.payments.length),
        ];

        for (const payment of this.payments) {
            args.push(
                ...[
                    // The token identifier
                    BytesValue.fromUTF8(payment.tokenIdentifier),
                    // The nonce of the token
                    new U64Value(payment.nonce),
                    // The transfered quantity
                    new BigUIntValue(payment.valueOf()),
                ],
            );
        }

        let { argumentsString } = new ArgSerializer().valuesToString(args);
        let data = `MultiESDTNFTTransfer@${argumentsString}`;
        return new TransactionPayload(data);
    }
}
