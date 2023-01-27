import { BaseParser } from "./baseParser";
import { IESDTIssueOutcome, ITransactionEvent } from "./interface";

export class ESDTIssueParser extends BaseParser<IESDTIssueOutcome> {
    protected parseSuccessfulOutcome(events: ITransactionEvent[]): IESDTIssueOutcome | null {
        for (const event of events) {
            if (event.identifier == "issue") {
                return {
                    tokenIdentifier: event.topics[0].valueOf().toString()
                };
            }
        }

        return null;
    }
}
