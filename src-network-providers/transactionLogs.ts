import { ErrUnexpectedCondition } from "./errors";
import { IBech32Address } from "./interface";
import { Bech32Address } from "./primitives";
import { TransactionEvent } from "./transactionEvents";

export class TransactionLogs {
    readonly address: IBech32Address;
    readonly events: TransactionEvent[];

    constructor(address: IBech32Address, events: TransactionEvent[]) {
        this.address = address;
        this.events = events;
    }

    static empty(): TransactionLogs {
        return new TransactionLogs(new Bech32Address(""), []);
    }

    static fromHttpResponse(logs: any): TransactionLogs {
        let address = new Bech32Address(logs.address);
        let events = (logs.events || []).map((event: any) => TransactionEvent.fromHttpResponse(event));
        return new TransactionLogs(address, events);
    }

    findSingleOrNoneEvent(identifier: string, predicate?: (event: TransactionEvent) => boolean): TransactionEvent | undefined {
        let events = this.findEvents(identifier, predicate);

        if (events.length > 1) {
            throw new ErrUnexpectedCondition(`more than one event of type ${identifier}`);
        }

        return events[0];
    }

    findFirstOrNoneEvent(identifier: string, predicate?: (event: TransactionEvent) => boolean): TransactionEvent | undefined {
        return this.findEvents(identifier, predicate)[0];
    }

    findEvents(identifier: string, predicate?: (event: TransactionEvent) => boolean): TransactionEvent[] {
        let events = this.events.filter(event => event.identifier == identifier);

        if (predicate) {
            events = events.filter(event => predicate(event));
        }

        return events;
    }
}
