import { Address } from "../address";
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

interface IContractResultItem {
    logs: ITransactionLogs;
}

interface ITransactionLogs {
    events: ITransactionEvent[];
}

interface ITransactionEvent {
    readonly address: IAddress;
    readonly identifier: string;
    readonly topics: ITransactionEventTopic[];
    readonly data: string;
}

interface ITransactionEventTopic {
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
    nonce: string;
    initialQuantity: string;
}

export interface IMintOutcome {
    userAddress: string;
    tokenIdentifier: string;
    nonce: string;
    mintedSupply: string;
}

export interface IBurnOutcome {
    userAddress: string;
    tokenIdentifier: string;
    nonce: string;
    burntSupply: string;
}

export interface IPausingOutcome {
}

export interface IFreezingOutcome {
    userAddress: string;
    tokenIdentifier: string;
    nonce: string;
    balance: string;
}

export interface IWipingOutcome {
    userAddress: string;
    tokenIdentifier: string;
    nonce: string;
    balance: string;
}

export interface IUpdateAttributesOutcome {
    tokenIdentifier: string;
    nonce: string;
    attributes: Buffer;
}

export interface IAddQuantityOutcome {
    tokenIdentifier: string;
    nonce: string;
    addedQuantity: string;
}

export interface IBurnQuantityOutcome {
    tokenIdentifier: string;
    nonce: string;
    burntQuantity: string;
}

export class TokenOperationsOutcomeParser {
    parseIssueFungible(transaction: ITransactionOnNetwork): IESDTIssueOutcome {
        this.ensureNoError(transaction);

        const event = this.findSingleEventByIdentifier(transaction, "issue");
        const tokenIdentifier = this.extractTokenIdentifier(event);
        return { tokenIdentifier: tokenIdentifier };
    }

    parseIssueNonFungible(transaction: ITransactionOnNetwork): IESDTIssueOutcome {
        this.ensureNoError(transaction);

        const event = this.findSingleEventByIdentifier(transaction, "issueNonFungible");
        const tokenIdentifier = this.extractTokenIdentifier(event);
        return { tokenIdentifier: tokenIdentifier };
    }

    parseIssueSemiFungible(transaction: ITransactionOnNetwork): IESDTIssueOutcome {
        this.ensureNoError(transaction);

        const event = this.findSingleEventByIdentifier(transaction, "issueSemiFungible");
        const tokenIdentifier = this.extractTokenIdentifier(event);
        return { tokenIdentifier: tokenIdentifier };
    }

    parseRegisterMetaESDT(transaction: ITransactionOnNetwork): IESDTIssueOutcome {
        this.ensureNoError(transaction);

        const event = this.findSingleEventByIdentifier(transaction, "registerMetaESDT");
        const tokenIdentifier = this.extractTokenIdentifier(event);
        return { tokenIdentifier: tokenIdentifier };
    }

    parseSetSpecialRole(transaction: ITransactionOnNetwork): ISetSpecialRoleOutcome {
        this.ensureNoError(transaction);

        const event = this.findSingleEventByIdentifier(transaction, "ESDTSetRole");
        const userAddress = event.address.toString();
        const tokenIdentifier = this.extractTokenIdentifier(event);
        const roles = event.topics.slice(3).map(topic => topic.valueOf().toString());
        return { userAddress, tokenIdentifier, roles };
    }

    parseNFTCreate(transaction: ITransactionOnNetwork): INFTCreateOutcome {
        this.ensureNoError(transaction);

        const event = this.findSingleEventByIdentifier(transaction, "ESDTNFTCreate");
        const tokenIdentifier = this.extractTokenIdentifier(event);
        const nonce = this.extractNonce(event);
        const initialQuantity = this.extractAmount(event);
        return { tokenIdentifier, nonce, initialQuantity };
    }

    parseLocalMint(transaction: ITransactionOnNetwork): IMintOutcome {
        this.ensureNoError(transaction);

        const event = this.findSingleEventByIdentifier(transaction, "ESDTLocalMint");
        const userAddress = event.address.toString();
        const tokenIdentifier = this.extractTokenIdentifier(event);
        const nonce = this.extractNonce(event);
        const mintedSupply = this.extractAmount(event);
        return { userAddress, tokenIdentifier, nonce, mintedSupply };
    }

    parseLocalBurn(transaction: ITransactionOnNetwork): IBurnOutcome {
        this.ensureNoError(transaction);

        const event = this.findSingleEventByIdentifier(transaction, "ESDTLocalBurn");
        const userAddress = event.address.toString();
        const tokenIdentifier = this.extractTokenIdentifier(event);
        const nonce = this.extractNonce(event);
        const burntSupply = this.extractAmount(event);
        return { userAddress, tokenIdentifier, nonce, burntSupply };
    }

    parsePause(transaction: ITransactionOnNetwork): IPausingOutcome {
        this.ensureNoError(transaction);
        const _ = this.findSingleEventByIdentifier(transaction, "ESDTPause");
        return {};
    }

    parseUnpause(transaction: ITransactionOnNetwork): IPausingOutcome {
        this.ensureNoError(transaction);
        const _ = this.findSingleEventByIdentifier(transaction, "ESDTUnPause");
        return {};
    }

    parseFreeze(transaction: ITransactionOnNetwork): IFreezingOutcome {
        this.ensureNoError(transaction);

        const event = this.findSingleEventByIdentifier(transaction, "ESDTFreeze");
        const tokenIdentifier = this.extractTokenIdentifier(event);
        const nonce = this.extractNonce(event);
        const balance = this.extractAmount(event);
        const userAddress = this.extractAddress(event);
        return { userAddress, tokenIdentifier, nonce, balance };
    }

    parseUnfreeze(transaction: ITransactionOnNetwork): IFreezingOutcome {
        this.ensureNoError(transaction);

        const event = this.findSingleEventByIdentifier(transaction, "ESDTUnFreeze");
        const tokenIdentifier = this.extractTokenIdentifier(event);
        const nonce = this.extractNonce(event);
        const balance = this.extractAmount(event);
        const userAddress = this.extractAddress(event);
        return { userAddress, tokenIdentifier, nonce, balance };
    }

    parseWipe(transaction: ITransactionOnNetwork): IWipingOutcome {
        this.ensureNoError(transaction);

        const event = this.findSingleEventByIdentifier(transaction, "ESDTWipe");
        const tokenIdentifier = this.extractTokenIdentifier(event);
        const nonce = this.extractNonce(event);
        const balance = this.extractAmount(event);
        const userAddress = this.extractAddress(event);
        return { userAddress, tokenIdentifier, nonce, balance };
    }

    parseUpdateAttributes(transaction: ITransactionOnNetwork): IUpdateAttributesOutcome {
        this.ensureNoError(transaction);

        const event = this.findSingleEventByIdentifier(transaction, "ESDTNFTUpdateAttributes");
        const tokenIdentifier = this.extractTokenIdentifier(event);
        const nonce = this.extractNonce(event);
        const attributes = event.topics[3]?.valueOf();
        return { tokenIdentifier, nonce, attributes };
    }

    parseAddQuantity(transaction: ITransactionOnNetwork): IAddQuantityOutcome {
        this.ensureNoError(transaction);

        const event = this.findSingleEventByIdentifier(transaction, "ESDTNFTAddQuantity");
        const tokenIdentifier = this.extractTokenIdentifier(event);
        const nonce = this.extractNonce(event);
        const addedQuantity = this.extractAmount(event);
        return { tokenIdentifier, nonce, addedQuantity };
    }

    parseBurnQuantity(transaction: ITransactionOnNetwork): IBurnQuantityOutcome {
        this.ensureNoError(transaction);

        const event = this.findSingleEventByIdentifier(transaction, "ESDTNFTBurn");
        const tokenIdentifier = this.extractTokenIdentifier(event);
        const nonce = this.extractNonce(event);
        const burntQuantity = this.extractAmount(event);
        return { tokenIdentifier, nonce, burntQuantity };
    }

    private ensureNoError(transaction: ITransactionOnNetwork) {
        for (const event of transaction.logs.events) {
            if (event.identifier == "signalError") {
                const data = Buffer.from(event.data.substring(1), "hex").toString();
                const message = event.topics[1]?.valueOf().toString();

                throw new ErrCannotParseTransactionOutcome(transaction.hash, `encountered signalError: ${message} (${data})`);
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

    private extractTokenIdentifier(event: ITransactionEvent): string {
        return event.topics[0]?.valueOf().toString();
    }

    private extractNonce(event: ITransactionEvent): string {
        return bufferToBigInt(event.topics[1]?.valueOf()).toFixed(0);
    }

    private extractAmount(event: ITransactionEvent): string {
        return bufferToBigInt(event.topics[2]?.valueOf()).toFixed(0);
    }

    private extractAddress(event: ITransactionEvent): string {
        return Address.fromBuffer(event.topics[3]?.valueOf()).toString();
    }
}

