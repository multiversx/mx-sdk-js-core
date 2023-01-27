import { BaseParser } from "./baseParser";
import { IEmptyOutcome, ITransactionEvent } from "./interface";

export class ESDTPausingParser extends BaseParser<IEmptyOutcome> {
    protected parseSuccessfulOutcome(_events: ITransactionEvent[]): IEmptyOutcome | null {
        return {};
    }
}
