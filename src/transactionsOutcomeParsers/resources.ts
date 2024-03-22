import { ErrParseTransactionOutcome } from "../errors";

export class TransactionEvent {
    address: string;
    identifier: string;
    topics: Uint8Array[];
    data: Uint8Array;

    constructor(init: Partial<TransactionEvent>) {
        this.address = "";
        this.identifier = "";
        this.topics = [];
        this.data = new Uint8Array();

        Object.assign(this, init);
    }
}

export class TransactionLogs {
    address: string;
    events: TransactionEvent[];

    constructor(init: Partial<TransactionLogs>) {
        this.address = "";
        this.events = [];

        Object.assign(this, init);
    }
}

export class SmartContractResult {
    sender: string;
    receiver: string;
    data: Uint8Array;
    logs: TransactionLogs;

    constructor(init: Partial<SmartContractResult>) {
        this.sender = "";
        this.receiver = "";
        this.data = new Uint8Array();
        this.logs = new TransactionLogs({});

        Object.assign(this, init);
    }
}

export class TransactionOutcome {
    smartContractResults: SmartContractResult[];
    transactionLogs: TransactionLogs;

    constructor(init: Partial<TransactionOutcome>) {
        this.smartContractResults = [];
        this.transactionLogs = new TransactionLogs({});

        Object.assign(this, init);
    }
}

export function findEventsByIdentifier(transactionOutcome: TransactionOutcome, identifier: string): TransactionEvent[] {
    const events = gatherAllEvents(transactionOutcome).filter((event) => event.identifier == identifier);

    if (events.length == 0) {
        throw new ErrParseTransactionOutcome(`cannot find event of type ${identifier}`);
    }

    return events;
}

export function gatherAllEvents(transactionOutcome: TransactionOutcome): TransactionEvent[] {
    const allEvents = [];

    allEvents.push(...transactionOutcome.transactionLogs.events);

    for (const item of transactionOutcome.smartContractResults) {
        allEvents.push(...item.logs.events);
    }

    return allEvents;
}
