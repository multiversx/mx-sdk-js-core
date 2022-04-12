import { Balance } from "./balance";
import { ArgSerializer } from "./smartcontracts/argSerializer";
import { BigUIntValue, BytesValue, TypedValue } from "./smartcontracts/typesystem";
import { TransactionPayload } from "./transactionPayload";

/**
 * A builder for {@link TransactionPayload} objects, to be used for token transfers.
 */
export class ESDTTransferPayloadBuilder {
    private amount: Balance | null = null;

    setAmount(amount: Balance): ESDTTransferPayloadBuilder {
        this.amount = amount;
        return this;
    }

    /**
     * Builds the {@link TransactionPayload}.
     */
    build(): TransactionPayload {
        let args: TypedValue[] = [
            // The token identifier
            BytesValue.fromUTF8(this.amount!.token.getTokenIdentifier()),
            // The transfered amount
            new BigUIntValue(this.amount!.valueOf()),
        ];
        let { argumentsString } = new ArgSerializer().valuesToString(args);
        let data = `ESDTTransfer@${argumentsString}`;

        return new TransactionPayload(data);
    }
}
