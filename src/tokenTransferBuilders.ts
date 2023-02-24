import { Address } from "./address";
import { IAddress, ITokenPayment } from "./interface";
import { ArgSerializer } from "./smartcontracts/argSerializer";
import { AddressValue, BigUIntValue, BytesValue, TypedValue, U16Value, U64Value } from "./smartcontracts/typesystem";
import { TokenPayment } from "./tokenPayment";
import { TransactionPayload } from "./transactionPayload";

/**
 * @deprecated Use {@link TransfersFactory} instead.
 */
export class ESDTTransferPayloadBuilder {
    payment: ITokenPayment = TokenPayment.fungibleFromAmount("", "0", 0);

    setPayment(payment: ITokenPayment): ESDTTransferPayloadBuilder {
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
 * @deprecated Use {@link TransfersFactory} instead.
 */
export class ESDTNFTTransferPayloadBuilder {
    payment: ITokenPayment = TokenPayment.nonFungible("", 0);
    destination: IAddress = new Address("");

    setPayment(payment: ITokenPayment): ESDTNFTTransferPayloadBuilder {
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
            new AddressValue(this.destination)
        ];

        let { argumentsString } = new ArgSerializer().valuesToString(args);
        let data = `ESDTNFTTransfer@${argumentsString}`;
        return new TransactionPayload(data);
    }
}

/**
 * @deprecated Use {@link TransfersFactory} instead.
 */
export class MultiESDTNFTTransferPayloadBuilder {
    payments: ITokenPayment[] = [];
    destination: IAddress = new Address("");

    setPayments(payments: ITokenPayment[]): MultiESDTNFTTransferPayloadBuilder {
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
            new U16Value(this.payments.length)
        ];

        for (const payment of this.payments) {
            args.push(...[
                // The token identifier
                BytesValue.fromUTF8(payment.tokenIdentifier),
                // The nonce of the token
                new U64Value(payment.nonce),
                // The transfered quantity
                new BigUIntValue(payment.valueOf())
            ]);
        }

        let { argumentsString } = new ArgSerializer().valuesToString(args);
        let data = `MultiESDTNFTTransfer@${argumentsString}`;
        return new TransactionPayload(data);
    }
}
