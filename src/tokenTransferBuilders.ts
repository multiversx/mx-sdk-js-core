import { Address } from "./address";
import { IAddress } from "./interface";
import { ArgSerializer } from "./smartcontracts/argSerializer";
import { AddressValue, BigUIntValue, BytesValue, TypedValue, U16Value, U64Value } from "./smartcontracts/typesystem";
import { TokenPayment } from "./tokenPayment";
import { TransactionPayload } from "./transactionPayload";

export class ESDTTransferPayloadBuilder {
    payment = TokenPayment.fungibleFromAmount("", "0", 0);

    setPayment(payment: TokenPayment): ESDTTransferPayloadBuilder {
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

export class ESDTNFTTransferPayloadBuilder {
    payment: TokenPayment = TokenPayment.nonFungible("", 0);
    destination: IAddress = new Address("");

    setPayment(payment: TokenPayment): ESDTNFTTransferPayloadBuilder {
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
            // The transfered quantity
            new BigUIntValue(this.payment.valueOf()),
            // The destination address
            new AddressValue(this.destination)
        ];

        let { argumentsString } = new ArgSerializer().valuesToString(args);
        let data = `ESDTNFTTransfer@${argumentsString}`;
        return new TransactionPayload(data);
    }
}

export class MultiESDTNFTTransferPayloadBuilder {
    payments: TokenPayment[] = [];
    destination: IAddress = new Address("");

    setPayments(payments: TokenPayment[]): MultiESDTNFTTransferPayloadBuilder {
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
