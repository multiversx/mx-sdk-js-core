import { Address } from "../address";
import { ErrParseTransactionOutcome } from "../errors";
import { TransactionEvent } from "../transactionEvents";
import { TransactionOnNetwork } from "../transactions";
import { findEventsByIdentifier } from "../transactionsOutcomeParsers/resources";

export class DelegationTransactionsOutcomeParser {
    constructor() {}

    parseCreateNewDelegationContract(transaction: TransactionOnNetwork): { contractAddress: string }[] {
        this.ensureNoError(transaction.logs.events);

        const events = findEventsByIdentifier(transaction, "SCDeploy");

        return events.map((event) => ({ contractAddress: this.extractContractAddress(event) }));
    }

    private ensureNoError(transactionEvents: TransactionEvent[]) {
        for (const event of transactionEvents) {
            if (event.identifier == "signalError") {
                const data = event.dataPayload.toString();
                const message = event.topics[1].toString();

                throw new ErrParseTransactionOutcome(`encountered signalError: ${message} (${data})`);
            }
        }
    }

    private extractContractAddress(event: TransactionEvent): string {
        if (!event.topics[0]?.toString().length) {
            return "";
        }
        const address = Buffer.from(event.topics[0]);
        return new Address(address).bech32();
    }
}
