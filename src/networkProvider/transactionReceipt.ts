import { IAddress, IHash } from "./interface";
import { Address, Hash, TransactionValue } from "./primitives";

export class TransactionReceipt {
    value: TransactionValue = new TransactionValue("");
    sender: IAddress = new Address("");
    data: string = "";
    hash: IHash = new Hash("");

    static fromHttpResponse(response: {
        value: string,
        sender: string,
        data: string,
        txHash: string
    }): TransactionReceipt {
        let receipt = new TransactionReceipt();

        receipt.value = new TransactionValue(response.value);
        receipt.sender = new Address(response.sender);
        receipt.data = response.data;
        receipt.hash = new Hash(response.txHash);

        return receipt;
    }
}
