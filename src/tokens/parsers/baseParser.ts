import { Err } from "../../errors";
import { IOutcomeBundle, IOutcomeError, ITransactionEvent } from "./interface";
import { OutcomeBundle } from "./outcomeBundle";
import { TransactionEvent } from "./transactionEvent";

export abstract class BaseParser<TOutcome> {
    parseOutcomeAny(events: any[]) {
        const typedEvents = events.map(event => TransactionEvent.fromAny(event));
        const bundle = this.parseOutcome(typedEvents);
        return bundle;
    }

    parseOutcome(events: ITransactionEvent[]): IOutcomeBundle<TOutcome> {
        const error = this.parseErrors(events);
        if (error) {
            return new OutcomeBundle({ error: error });
        }

        const outcome = this.parseSuccessfulOutcome(events);
        if (outcome) {
            return new OutcomeBundle({ outcome: outcome });
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

    protected abstract parseSuccessfulOutcome(events: ITransactionEvent[]): TOutcome | null;
}

