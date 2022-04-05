import { Address } from "../address";
import { Balance } from "../balance";
import { TransactionHash } from "../transaction";

export class Receipt {
    value: Balance = Balance.Zero();
    sender: Address = new Address();
    data: string = "";
    hash: TransactionHash = TransactionHash.empty();

    static fromHttpResponse(response: {
        value: string,
        sender: string,
        data: string,
        txHash: string
    }): Receipt {
        let receipt = new Receipt();

        receipt.value = Balance.fromString(response.value);
        receipt.sender = new Address(response.sender);
        receipt.data = response.data;
        receipt.hash = new TransactionHash(response.txHash);

        return receipt;
    }
}
