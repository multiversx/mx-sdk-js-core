import { bufferToBigInt } from "../codec";
import { BaseParser } from "./baseParser";
import { IBurnOutcome, ITransactionEvent } from "./interface";

export class ESDTLocalBurnParser extends BaseParser<IBurnOutcome> {
    protected parseSuccessfulOutcome(events: ITransactionEvent[]): IBurnOutcome | null {
        for (const event of events) {
            if (event.identifier == "ESDTLocalBurn") {
                return {
                    userAddress: event.address.toString(),
                    tokenIdentifier: event.topics[0].valueOf().toString(),
                    nonce: bufferToBigInt(event.topics[1].valueOf()).toNumber() || 0,
                    burntSupply: bufferToBigInt(event.topics[2].valueOf()).toString()
                };
            }
        }

        return null;
    }
}
