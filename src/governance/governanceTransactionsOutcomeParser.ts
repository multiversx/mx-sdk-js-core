import { AddressType, ArgSerializer, BigUIntType, StringType } from "../abi";
import { Address, ErrParseTransactionOutcome, LibraryConfig, TransactionEvent, TransactionOnNetwork } from "../core";
import { findEventsByIdentifier } from "../transactionsOutcomeParsers";
import { CloseProposalOutcome, DelegateVoteOutcome, NewProposalOutcome, VoteOutcome } from "./resources";

export class GovernanceTransactionsOutcomeParser {
    private addressHrp: string;
    private serializer: ArgSerializer;

    constructor(options: { addressHrp?: string }) {
        this.addressHrp = options.addressHrp ?? LibraryConfig.DefaultAddressHrp;
        this.serializer = new ArgSerializer();
    }

    parseNewProposal(transactionOnNetwork: TransactionOnNetwork): NewProposalOutcome[] {
        this.ensureNoError(transactionOnNetwork.logs.events);

        const events = findEventsByIdentifier(transactionOnNetwork, "proposal");

        const proposalNonce = { type: new BigUIntType() };
        const commitHash = { type: new StringType() };
        const startVoteEpoch = { type: new BigUIntType() };
        const endVoteEpoch = { type: new BigUIntType() };

        const outcome: NewProposalOutcome[] = [];
        for (const event of events) {
            const data = this.serializer.buffersToValues(
                event.topics.map((topic) => Buffer.from(topic)),
                [proposalNonce, commitHash, startVoteEpoch, endVoteEpoch],
            );

            outcome.push({
                proposalNonce: data[0].valueOf(),
                commitHash: data[1].valueOf(),
                startVoteEpoch: data[2].valueOf(),
                endVoteEpoch: data[3].valueOf(),
            });
        }

        return outcome;
    }

    parseVote(transactionOnNetwork: TransactionOnNetwork): VoteOutcome[] {
        this.ensureNoError(transactionOnNetwork.logs.events);

        const events = findEventsByIdentifier(transactionOnNetwork, "vote");

        const proposalToVote = { type: new BigUIntType() };
        const vote = { type: new StringType() };
        const totalStake = { type: new BigUIntType() };
        const votingPower = { type: new BigUIntType() };

        const outcome: VoteOutcome[] = [];
        for (const event of events) {
            const data = this.serializer.buffersToValues(
                event.topics.map((topic) => Buffer.from(topic)),
                [proposalToVote, vote, totalStake, votingPower],
            );

            outcome.push({
                proposalNonce: Number(data[0].toString()),
                vote: data[1].valueOf(),
                totalStake: BigInt(data[2].valueOf().toFixed()),
                votingPower: BigInt(data[3].valueOf().toFixed()),
            });
        }

        return outcome;
    }

    parseDelegateVote(transactionOnNetwork: TransactionOnNetwork): DelegateVoteOutcome[] {
        this.ensureNoError(transactionOnNetwork.logs.events);

        const events = findEventsByIdentifier(transactionOnNetwork, "delegateVote");

        const proposalToVote = { type: new BigUIntType() };
        const vote = { type: new StringType() };
        const voter = { type: new AddressType() };
        const userStake = { type: new BigUIntType() };
        const votingPower = { type: new BigUIntType() };

        const outcome: DelegateVoteOutcome[] = [];
        for (const event of events) {
            const data = this.serializer.buffersToValues(
                event.topics.map((topic) => Buffer.from(topic)),
                [proposalToVote, vote, voter, userStake, votingPower],
            );

            outcome.push({
                proposalNonce: Number(data[0].toString()),
                vote: data[1].valueOf(),
                voter: new Address(data[2].valueOf().getPublicKey(), this.addressHrp),
                userStake: BigInt(data[3].valueOf().toFixed()),
                votingPower: BigInt(data[4].valueOf().toFixed()),
            });
        }

        return outcome;
    }

    parseCloseProposal(transactionOnNetwork: TransactionOnNetwork): CloseProposalOutcome[] {
        this.ensureNoError(transactionOnNetwork.logs.events);

        const events = findEventsByIdentifier(transactionOnNetwork, "closeProposal");

        const outcome: CloseProposalOutcome[] = [];
        for (const event of events) {
            const commitHash = Buffer.from(event.topics[0]).toString();
            const passed = Buffer.from(event.topics[1]).toString() === "true";

            outcome.push({
                commitHash: commitHash,
                passed: passed,
            });
        }

        return outcome;
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

    private decodeTopicAsString(topic: Uint8Array): string {
        return Buffer.from(topic).toString();
    }
}
