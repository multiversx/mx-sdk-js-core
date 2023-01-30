import { BaseParser } from "./baseParser";
import { ISetSpecialRoleOutcome, ITransactionEvent } from "./interface";

export class ESDTSetSpecialRoleParser extends BaseParser<ISetSpecialRoleOutcome> {
    protected parseSuccessfulOutcome(events: ITransactionEvent[]): ISetSpecialRoleOutcome | null {
        for (const event of events) {
            if (event.identifier == "ESDTSetRole") {
                return {
                    userAddress: event.address,
                    tokenIdentifier: event.topics[0].valueOf().toString(),
                    roles: event.topics.slice(3).map(topic => topic.valueOf().toString())
                };
            }
        }

        return null;
    }
}
