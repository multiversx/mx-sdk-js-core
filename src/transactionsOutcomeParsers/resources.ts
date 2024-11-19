import { TransactionEvent } from "../transactionEvents";
import { TransactionLogs } from "../transactionLogs";
import { TransactionOnNetwork } from "../transactions";

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
    transactionOutcome: TransactionOnNetwork,
    predicate: (event: TransactionEvent) => boolean,
): TransactionEvent[] {
    return gatherAllEvents(transactionOutcome).filter(predicate);
}

export function findEventsByIdentifier(
    transactionOutcome: TransactionOnNetwork,
    identifier: string,
): TransactionEvent[] {
    return findEventsByPredicate(transactionOutcome, (event) => event.identifier == identifier);
}

export function findEventsByFirstTopic(transactionOutcome: TransactionOnNetwork, topic: string): TransactionEvent[] {
    return findEventsByPredicate(transactionOutcome, (event) => event.topics[0]?.toString() == topic);
}

export function gatherAllEvents(transactionOutcome: TransactionOnNetwork): TransactionEvent[] {
    const allEvents = [];

    allEvents.push(...transactionOutcome.logs.events);

    for (const item of transactionOutcome.contractResults.items) {
        allEvents.push(...item.logs.events);
    }

    return allEvents;
}
