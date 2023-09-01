import { BigNumber } from "bignumber.js";

export class TransactionIntent {
    public sender: string;
    public receiver: string;
    public gasLimit: BigNumber.Value;
    public value?: BigNumber.Value;
    public data?: Uint8Array;

    public constructor(sender: string, receiver: string, gasLimit: BigNumber.Value, value?: BigNumber.Value, data?: Uint8Array) {
        this.sender = sender;
        this.receiver = receiver;
        this.gasLimit = gasLimit;
        this.value = value;
        this.data = data;
    }
}
