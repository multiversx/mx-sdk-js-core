import { IBech32Address, IHash } from "./interface";
import { Bech32Address, Hash } from "./primitives";

export class TransactionReceipt {
    value: string = "";
    sender: IBech32Address = new Bech32Address("");
    data: string = "";
    hash: IHash = new Hash("");

    static fromHttpResponse(response: {
        value: string,
        sender: string,
        data: string,
        txHash: string
    }): TransactionReceipt {
        let receipt = new TransactionReceipt();

        receipt.value = (response.value || 0).toString();
        receipt.sender = new Bech32Address(response.sender);
        receipt.data = response.data;
        receipt.hash = new Hash(response.txHash);

        return receipt;
    }
}
