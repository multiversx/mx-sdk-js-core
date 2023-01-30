import BigNumber from "bignumber.js";
import { Address } from "../../address";
import { bufferToBigInt } from "../codec";
import { BaseParser } from "./baseParser";
import { IFreezingOutcome, ITransactionEvent } from "./interface";

export class ESDTFreezingParser extends BaseParser<IFreezingOutcome> {
    protected parseSuccessfulOutcome(events: ITransactionEvent[]): IFreezingOutcome | null {
        for (const event of events) {
            if (event.identifier == "ESDTFreeze" || event.identifier == "ESDTUnFreeze") {
                let balance = bufferToBigInt(event.topics[2].valueOf());
                if (balance.isNaN()) {
                    balance = new BigNumber(0);
                }

                return {
                    userAddress: new Address(event.topics[3].valueOf()),
                    tokenIdentifier: event.topics[0].valueOf().toString(),
                    nonce: bufferToBigInt(event.topics[1].valueOf()).toNumber() || 0,
                    balance: balance.toString()
                };
            }
        }

        return null;
    }
}
