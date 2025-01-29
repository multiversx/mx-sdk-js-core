import { Address } from "../core/address";
import { TransactionEvent } from "../core/transactionEvents";
import { TransactionLogs } from "../core/transactionLogs";
import { TransactionOnNetwork } from "../core/transactionOnNetwork";

export class SmartContractResult {
    raw: Record<string, any>;
    sender: Address;
    receiver: Address;
    data: Uint8Array;
    logs: TransactionLogs;

    constructor(init: Partial<SmartContractResult>) {
        this.sender = Address.empty();
        this.receiver = Address.empty();
        this.data = new Uint8Array();
        this.logs = new TransactionLogs({});
        this.raw = {};

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

    for (const item of transactionOutcome.smartContractResults) {
        allEvents.push(...item.logs.events);
    }

    return allEvents;
}
