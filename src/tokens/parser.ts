import { ErrCannotParseTransactionOutcome } from "../errors";
import { IAddress } from "../interface";
import { bufferToBigInt } from "./codec";


interface ITransactionOnNetwork {
    hash: string;
    contractResults: IContractResults;
    logs: ITransactionLogs;
}

interface IContractResults {
    items: IContractResultItem[];
}

export interface IContractResultItem {
    logs: ITransactionLogs;
}

interface ITransactionLogs {
    events: ITransactionEvent[];
}

export interface ITransactionEvent {
    readonly address: IAddress;
    readonly identifier: string;
    readonly topics: ITransactionEventTopic[];
    readonly data: string;
}

export interface ITransactionEventTopic {
    valueOf(): any;
}

export interface IESDTIssueOutcome {
    tokenIdentifier: string;
}

export interface ISetSpecialRoleOutcome {
    userAddress: string;
    tokenIdentifier: string;
    roles: string[];
}

export interface INFTCreateOutcome {
    tokenIdentifier: string;
    nonce: number;
    initialQuantity: number;
}

// export interface IMintOutcome {
//     userAddress: IAddress;
//     tokenIdentifier: string;
//     nonce: INonce;
//     mintedSupply: string;
// }

// export interface IBurnOutcome {
//     userAddress: IAddress;
//     tokenIdentifier: string;
//     nonce: INonce;
//     burntSupply: string;
// }

// export interface IPausingOutcome {
//     tokenIdentifier: string;
//     paused: boolean;
// }

// export interface IFreezingOutcome {
//     userAddress: IAddress;
//     tokenIdentifier: string;
//     nonce: INonce;
//     balance: string;
// }

// export interface IEmptyOutcome {
// }

export class TokenTransactionsOutcomeParser {
    parseIssueFungible(transaction: ITransactionOnNetwork): IESDTIssueOutcome {
        this.ensureNoError(transaction);

        const event = this.findSingleEventByIdentifier(transaction, "issue");
        const tokenIdentifier = event.topics[0]?.valueOf().toString();
        return { tokenIdentifier: tokenIdentifier };
    }

    parseIssueNonFungible(transaction: ITransactionOnNetwork): IESDTIssueOutcome {
        this.ensureNoError(transaction);

        const event = this.findSingleEventByIdentifier(transaction, "issueNonFungible");
        const tokenIdentifier = event.topics[0]?.valueOf().toString();
        return { tokenIdentifier: tokenIdentifier };
    }

    parseIssueSemiFungible(transaction: ITransactionOnNetwork): IESDTIssueOutcome {
        this.ensureNoError(transaction);

        const event = this.findSingleEventByIdentifier(transaction, "issueSemiFungible");
        const tokenIdentifier = event.topics[0]?.valueOf().toString();
        return { tokenIdentifier: tokenIdentifier };
    }

    parseSetSpecialRole(transaction: ITransactionOnNetwork): ISetSpecialRoleOutcome {
        this.ensureNoError(transaction);

        const event = this.findSingleEventByIdentifier(transaction, "ESDTSetRole");
        const userAddress = event.address.toString();
        const tokenIdentifier = event.topics[0]?.valueOf().toString();
        const roles = event.topics.slice(3).map(topic => topic.valueOf().toString());
        return { userAddress, tokenIdentifier, roles };
    }

    parseNFTCreate(transaction: ITransactionOnNetwork): INFTCreateOutcome {
        this.ensureNoError(transaction);

        const event = this.findSingleEventByIdentifier(transaction, "ESDTNFTCreate");
        const tokenIdentifier = event.topics[0]?.valueOf().toString();
        const nonce = bufferToBigInt(event.topics[1]?.valueOf()).toNumber();
        const initialQuantity = bufferToBigInt(event.topics[2]?.valueOf()).toNumber();
        return { tokenIdentifier, nonce, initialQuantity };
    }

    // export class ESDTSetSpecialRoleParser extends BaseParser<ISetSpecialRoleOutcome> {
    //     protected parseSuccessfulOutcome(events: ITransactionEvent[]): ISetSpecialRoleOutcome | null {
    //         for (const event of events) {
    //             if (event.identifier == "ESDTSetRole") {
    //                 return {
    //                     userAddress: event.address,
    //                     tokenIdentifier: event.topics[0].valueOf().toString(),
    //                     roles: event.topics.slice(3).map(topic => topic.valueOf().toString())
    //                 };
    //             }
    //         }

    //         return null;
    //     }
    // }

    private ensureNoError(transaction: ITransactionOnNetwork) {
        for (const event of transaction.logs.events) {
            if (event.identifier == "signalError") {
                const data = Buffer.from(event.data.substring(1), "hex").toString();
                const message = event.topics[1]?.valueOf().toString();

                throw new ErrCannotParseTransactionOutcome(transaction.hash, `encountered error: ${message} (${data})`);
            }
        }
    }

    private findSingleEventByIdentifier(transaction: ITransactionOnNetwork, identifier: string): ITransactionEvent {
        const events = this.gatherAllEvents(transaction).filter(event => event.identifier == identifier);

        if (events.length == 0) {
            throw new ErrCannotParseTransactionOutcome(transaction.hash, `cannot find event of type ${identifier}`);
        }
        if (events.length > 1) {
            throw new ErrCannotParseTransactionOutcome(transaction.hash, `more than one event of type ${identifier}`);
        }

        return events[0];
    }

    private gatherAllEvents(transaction: ITransactionOnNetwork): ITransactionEvent[] {
        const allEvents = [];

        allEvents.push(...transaction.logs.events);

        for (const item of transaction.contractResults.items) {
            allEvents.push(...item.logs.events);
        }

        return allEvents;
    }
}


// export class ESDTPausingParser extends BaseParser<IEmptyOutcome> {
//     protected parseSuccessfulOutcome(_events: ITransactionEvent[]): IEmptyOutcome | null {
//         return {};
//     }
// }


// export class ESDTLocalMintParser extends BaseParser<IMintOutcome> {
//     protected parseSuccessfulOutcome(events: ITransactionEvent[]): IMintOutcome | null {
//         for (const event of events) {
//             if (event.identifier == "ESDTLocalMint") {
//                 return {
//                     userAddress: event.address,
//                     tokenIdentifier: event.topics[0].valueOf().toString(),
//                     nonce: bufferToBigInt(event.topics[1].valueOf()).toNumber() || 0,
//                     mintedSupply: bufferToBigInt(event.topics[2].valueOf()).toString()
//                 };
//             }
//         }

//         return null;
//     }
// }

// export class ESDTLocalBurnParser extends BaseParser<IBurnOutcome> {
//     protected parseSuccessfulOutcome(events: ITransactionEvent[]): IBurnOutcome | null {
//         for (const event of events) {
//             if (event.identifier == "ESDTLocalBurn") {
//                 return {
//                     userAddress: event.address,
//                     tokenIdentifier: event.topics[0].valueOf().toString(),
//                     nonce: bufferToBigInt(event.topics[1].valueOf()).toNumber() || 0,
//                     burntSupply: bufferToBigInt(event.topics[2].valueOf()).toString()
//                 };
//             }
//         }

//         return null;
//     }
// }


// export class ESDTFreezingParser extends BaseParser<IFreezingOutcome> {
//     protected parseSuccessfulOutcome(events: ITransactionEvent[]): IFreezingOutcome | null {
//         for (const event of events) {
//             if (event.identifier == "ESDTFreeze" || event.identifier == "ESDTUnFreeze") {
//                 let balance = bufferToBigInt(event.topics[2].valueOf());
//                 if (balance.isNaN()) {
//                     balance = new BigNumber(0);
//                 }

//                 return {
//                     userAddress: new Address(event.topics[3].valueOf()),
//                     tokenIdentifier: event.topics[0].valueOf().toString(),
//                     nonce: bufferToBigInt(event.topics[1].valueOf()).toNumber() || 0,
//                     balance: balance.toString()
//                 };
//             }
//         }

//         return null;
//     }
// }
