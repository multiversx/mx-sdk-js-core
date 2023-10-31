import { BigNumber } from "bignumber.js";

export class DraftTransaction {
    public sender: string;
    public receiver: string;
    public gasLimit: BigNumber.Value;
    public value: BigNumber.Value;
    public data: Uint8Array;

    public constructor(options: {
        sender: string,
        receiver: string,
        gasLimit: BigNumber.Value,
        value?: BigNumber.Value,
        data?: Uint8Array
    }) {
        this.sender = options.sender;
        this.receiver = options.receiver;
        this.gasLimit = options.gasLimit;
        this.value = options.value ?? 0;
        this.data = options.data ?? new Uint8Array();
    }
}
