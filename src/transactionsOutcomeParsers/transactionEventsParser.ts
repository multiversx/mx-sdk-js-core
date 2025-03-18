import { Abi, ArgSerializer } from "../abi";
import { TransactionEvent } from "../core/transactionEvents";

export class TransactionEventsParser {
    private readonly abi: Abi;
    private readonly firstTopicIsIdentifier: boolean;

    constructor(options: { abi: Abi; firstTopicIsIdentifier?: boolean }) {
        this.abi = options.abi;

        // By default, we consider that the first topic is the event identifier.
        // This is true for log entries emitted by smart contracts:
        // https://github.com/multiversx/mx-chain-vm-go/blob/v1.5.27/vmhost/contexts/output.go#L270
        // https://github.com/multiversx/mx-chain-vm-go/blob/v1.5.27/vmhost/contexts/output.go#L283
        this.firstTopicIsIdentifier = options.firstTopicIsIdentifier ?? true;
    }

    parseEvents(options: { events: TransactionEvent[] }): any[] {
        const results = [];

        for (const event of options.events) {
            const parsedEvent = this.parseEvent({ event });
            results.push(parsedEvent);
        }

        return results;
    }

    parseEvent(options: { event: TransactionEvent }): any {
        const topics = options.event.topics.map((topic) => Buffer.from(topic));
        const abiIdentifier = this.firstTopicIsIdentifier ? topics[0]?.toString() : options.event.identifier;

        if (this.firstTopicIsIdentifier) {
            topics.shift();
        }

        const dataItems = options.event.additionalData.map((dataItem) => Buffer.from(dataItem));
        const eventDefinition = this.abi.getEvent(abiIdentifier);

        const result: any = {};
        const argsSerializer = new ArgSerializer();

        // "Indexed" ABI "event.inputs" correspond to "event.topics[1:]":
        const indexedInputs = eventDefinition.inputs.filter((input: { indexed: any }) => input.indexed);
        const decodedTopics = argsSerializer.buffersToValues(topics, indexedInputs);
        for (let i = 0; i < indexedInputs.length; i++) {
            result[indexedInputs[i].name] = decodedTopics[i].valueOf();
        }

        // "Non-indexed" ABI "event.inputs" correspond to "event.data":
        const nonIndexedInputs = eventDefinition.inputs.filter((input: { indexed: any }) => !input.indexed);
        const decodedDataParts = argsSerializer.buffersToValues(dataItems, nonIndexedInputs);
        for (let i = 0; i < nonIndexedInputs.length; i++) {
            result[nonIndexedInputs[i].name] = decodedDataParts[i]?.valueOf();
        }

        return result;
    }
}
