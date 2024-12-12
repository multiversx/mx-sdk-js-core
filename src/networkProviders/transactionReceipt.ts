import { Address } from "../address";

export class TransactionReceipt {
    value: string = "";
    sender: Address = Address.empty();
    data: string = "";
    hash: string = "";

    static fromHttpResponse(response: {
        value: string;
        sender: string;
        data: string;
        txHash: string;
    }): TransactionReceipt {
        let receipt = new TransactionReceipt();

        receipt.value = (response.value || 0).toString();
        receipt.sender = new Address(response.sender);
        receipt.data = response.data;
        receipt.hash = response.txHash;

        return receipt;
    }
}
