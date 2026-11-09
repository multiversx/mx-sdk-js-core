import { Address } from "../core/address";
import { ErrParseTransactionOutcome } from "../core/errors";
import { TransactionEvent } from "../core/transactionEvents";
import { TransactionOnNetwork } from "../core/transactionOnNetwork";
import { findEventsByIdentifier } from "../transactionsOutcomeParsers/resources";

export class DelegationTransactionsOutcomeParser {
    constructor() {}

    parseCreateNewDelegationContract(transaction: TransactionOnNetwork): { contractAddress: string }[] {
        this.ensureNoError(transaction.logs.events);

        const events = findEventsByIdentifier(transaction, "SCDeploy");

        return events.map((event) => ({ contractAddress: this.extractContractAddress(event) }));
    }

    parseClaimRewards(transaction: TransactionOnNetwork): { amount: bigint }[] {
        this.ensureNoError(transaction.logs.events);

        const events = findEventsByIdentifier(transaction, "claimRewards");

        return events.map((event) => ({ amount: this.extractAmount(event) }));
    }

    parseDelegate(transaction: TransactionOnNetwork): { amount: bigint }[] {
        this.ensureNoError(transaction.logs.events);

        const events = findEventsByIdentifier(transaction, "delegate");

        return events.map((event) => ({ amount: this.extractAmount(event) }));
    }

    parseUndelegate(transaction: TransactionOnNetwork): { amount: bigint }[] {
        this.ensureNoError(transaction.logs.events);

        const events = findEventsByIdentifier(transaction, "unDelegate");

        return events.map((event) => ({ amount: this.extractAmount(event) }));
    }

    parseRedelegateRewards(transaction: TransactionOnNetwork): { amount: bigint }[] {
        return this.parseDelegate(transaction);
    }

    private ensureNoError(transactionEvents: TransactionEvent[]) {
        for (const event of transactionEvents) {
            if (event.identifier == "signalError") {
                const data = Buffer.from(event.additionalData[0]?.toString().slice(1)).toString() || "";
                const message = this.decodeTopicAsString(event.topics[1]);

                throw new ErrParseTransactionOutcome(
                    `encountered signalError: ${message} (${Buffer.from(data, "hex").toString()})`,
                );
            }
        }
    }

    private extractContractAddress(event: TransactionEvent): string {
        if (!event.topics[0]?.length) {
            return "";
        }
        const address = Buffer.from(event.topics[0]);
        return new Address(address).toBech32();
    }

    private decodeTopicAsString(topic: Uint8Array): string {
        return Buffer.from(topic).toString();
    }

    private extractAmount(event: TransactionEvent): bigint {
        if (!event.topics[0]?.length) {
            return 0n;
        }

        const amount = Buffer.from(event.topics[0]);
        return BigInt("0x" + amount.toString("hex"));
    }
}
