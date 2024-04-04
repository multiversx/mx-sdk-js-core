export class TransactionEvent {
    address: string;
    identifier: string;
    topics: Uint8Array[];
    dataItems: Uint8Array[];

    constructor(init: Partial<TransactionEvent>) {
        this.address = "";
        this.identifier = "";
        this.topics = [];
        this.dataItems = [];

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
    directSmartContractCallOutcome: SmartContractCallOutcome;
    smartContractResults: SmartContractResult[];
    logs: TransactionLogs;

    constructor(init: Partial<TransactionOutcome>) {
        this.directSmartContractCallOutcome = new SmartContractCallOutcome({});
        this.smartContractResults = [];
        this.logs = new TransactionLogs({});

        Object.assign(this, init);
    }
}

export class SmartContractCallOutcome {
    function: string;
    returnDataParts: Uint8Array[];
    returnMessage: string;
    returnCode: string;

    constructor(init: Partial<SmartContractCallOutcome>) {
        this.function = "";
        this.returnDataParts = [];
        this.returnMessage = "";
        this.returnCode = "";

        Object.assign(this, init);
    }
}

export function findEventsByPredicate(
    transactionOutcome: TransactionOutcome,
    predicate: (event: TransactionEvent) => boolean,
): TransactionEvent[] {
    return gatherAllEvents(transactionOutcome).filter(predicate);
}

export function findEventsByIdentifier(transactionOutcome: TransactionOutcome, identifier: string): TransactionEvent[] {
    return findEventsByPredicate(transactionOutcome, (event) => event.identifier == identifier);
}

export function findEventsByFirstTopic(transactionOutcome: TransactionOutcome, topic: string): TransactionEvent[] {
    return findEventsByPredicate(transactionOutcome, (event) => event.topics[0]?.toString() == topic);
}

export function gatherAllEvents(transactionOutcome: TransactionOutcome): TransactionEvent[] {
    const allEvents = [];

    allEvents.push(...transactionOutcome.logs.events);

    for (const item of transactionOutcome.smartContractResults) {
        allEvents.push(...item.logs.events);
    }

    return allEvents;
}
