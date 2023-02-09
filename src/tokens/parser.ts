import { Err } from "../errors";
import { IContractResults, ITransactionEvent, ITransactionLogs } from "../interfaceOfNetwork";
import { OutcomeBundle } from "./parsers/outcomeBundle";

interface ITransactionOnNetwork {
    contractResults: IContractResults;
    logs: ITransactionLogs;
}

export interface IOutcomeBundle<TOutcome> {
    outcome?: TOutcome;
    error?: IOutcomeError;

    isSuccess(): boolean;
    raiseOnError(): void;
}

export interface IOutcomeError {
    event: string;
    data: string;
    message: string;
}

export interface IESDTIssueOutcome {
    tokenIdentifier: string;
}

export class TokenTransactionsOutcomeParser {
    parseIssueFungible(transaction: ITransactionOnNetwork) {
        const events = transaction.logs.events;

        const error = this.parseErrors(events);
        if (error) {
            return new OutcomeBundle({ error: error });
        }

        const issueEvent = transaction.logs.findFirstOrNoneEvent("issue");
        if (issueEvent) {
            return {
                tokenIdentifier: issueEvent.topics[0].valueOf().toString()
            };
        }


        // The "console.error" below is by intent (useful for reporting issues).
        console.error("Events:")
        console.error(JSON.stringify(events, null, 4));
        throw new Err("Cannot parse outcome");
    }

    private parseErrors(events: ITransactionEvent[]): IOutcomeError | null {
        for (const event of events) {
            if (event.identifier == "signalError") {
                const data = Buffer.from(event.data.substring(1), "hex").toString();

                return {
                    event: event.identifier,
                    data: data,
                    message: event.topics[1]?.valueOf().toString()
                }
            }
        }

        return null;
    }
}
