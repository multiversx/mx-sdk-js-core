import { bufferToBigInt } from "../codec";
import { BaseParser } from "./baseParser";
import { IMintOutcome, ITransactionEvent } from "./interface";

export class ESDTLocalMintParser extends BaseParser<IMintOutcome> {
    protected parseSuccessfulOutcome(events: ITransactionEvent[]): IMintOutcome | null {
        for (const event of events) {
            if (event.identifier == "ESDTLocalMint") {
                return {
                    userAddress: event.address,
                    tokenIdentifier: event.topics[0].valueOf().toString(),
                    nonce: bufferToBigInt(event.topics[1].valueOf()).toNumber() || 0,
                    mintedSupply: bufferToBigInt(event.topics[2].valueOf()).toString()
                };
            }
        }

        return null;
    }
}
