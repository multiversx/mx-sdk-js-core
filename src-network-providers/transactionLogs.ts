import { ErrUnexpectedCondition } from "./errors";
import { IAddress } from "./interface";
import { Address } from "./primitives";
import { TransactionEvent } from "./transactionEvents";

export class TransactionLogs {
    readonly address: IAddress;
    readonly events: TransactionEvent[];

    constructor(address: IAddress, events: TransactionEvent[]) {
        this.address = address;
        this.events = events;
    }

    static empty(): TransactionLogs {
        return new TransactionLogs(new Address(""), []);
    }

    static fromHttpResponse(logs: any): TransactionLogs {
        let address = new Address(logs.address);
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
