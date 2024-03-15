import { TransactionEvent, TransactionOutcome } from "./resources";
import { ErrParseTransactionOutcome } from "../errors";
import { Address } from "../address";
import { bufferToBigInt } from "../smartcontracts/codec/utils";

export class TokenManagementTransactionsOutcomeParser {
    constructor() {}

    parseIssueFungible(transactionOutcome: TransactionOutcome): { tokenIdentifier: string }[] {
        this.ensureNoError(transactionOutcome.transactionLogs.events);

        const events = this.findEventsByIdentifier(transactionOutcome, "issue");
        return events.map((event) => ({ tokenIdentifier: this.extractTokenIdentifier(event) }));
    }

    parseIssueNonFungible(transactionOutcome: TransactionOutcome): { tokenIdentifier: string }[] {
        this.ensureNoError(transactionOutcome.transactionLogs.events);

        const events = this.findEventsByIdentifier(transactionOutcome, "issueNonFungible");
        return events.map((event) => ({ tokenIdentifier: this.extractTokenIdentifier(event) }));
    }

    parseIssueSemiFungible(transactionOutcome: TransactionOutcome): { tokenIdentifier: string }[] {
        this.ensureNoError(transactionOutcome.transactionLogs.events);

        const events = this.findEventsByIdentifier(transactionOutcome, "issueSemiFungible");
        return events.map((event) => ({ tokenIdentifier: this.extractTokenIdentifier(event) }));
    }

    parseRegisterMetaEsdt(transactionOutcome: TransactionOutcome): { tokenIdentifier: string }[] {
        this.ensureNoError(transactionOutcome.transactionLogs.events);

        const events = this.findEventsByIdentifier(transactionOutcome, "registerMetaESDT");
        return events.map((event) => ({ tokenIdentifier: this.extractTokenIdentifier(event) }));
    }

    parseRegisterAndSetAllRoles(
        transactionOutcome: TransactionOutcome,
    ): { tokenIdentifier: string; roles: string[] }[] {
        this.ensureNoError(transactionOutcome.transactionLogs.events);
        const registerEvents = this.findEventsByIdentifier(transactionOutcome, "registerAndSetAllRoles");
        const setRoleEvents = this.findEventsByIdentifier(transactionOutcome, "ESDTSetRole");

        if (registerEvents.length !== setRoleEvents.length) {
            throw new ErrParseTransactionOutcome(
                "Register Events and Set Role events mismatch. Should have the same number of events.",
            );
        }

        return registerEvents.map((registerEvent, index) => {
            const tokenIdentifier = this.extractTokenIdentifier(registerEvent);
            const encodedRoles = setRoleEvents[index].topics.slice(3);
            const roles = encodedRoles.map((role) => this.decodeTopicAsString(role));
            return { tokenIdentifier, roles };
        });
    }

    parseSetBurnRoleGlobally(transactionOutcome: TransactionOutcome) {
        this.ensureNoError(transactionOutcome.transactionLogs.events);
    }

    parseUnsetBurnRoleGlobally(transactionOutcome: TransactionOutcome) {
        this.ensureNoError(transactionOutcome.transactionLogs.events);
    }

    parseSetSpecialRole(transactionOutcome: TransactionOutcome): {
        userAddress: string;
        tokenIdentifier: string;
        roles: string[];
    }[] {
        this.ensureNoError(transactionOutcome.transactionLogs.events);

        const events = this.findEventsByIdentifier(transactionOutcome, "ESDTSetRole");
        return events.map((event) => this.getOutputForSetSpecialRoleEvent(event));
    }

    private getOutputForSetSpecialRoleEvent(event: TransactionEvent): {
        userAddress: string;
        tokenIdentifier: string;
        roles: string[];
    } {
        const userAddress = event.address;
        const tokenIdentifier = this.extractTokenIdentifier(event);
        const encodedRoles = event.topics.slice(3);
        const roles = encodedRoles.map((role) => this.decodeTopicAsString(role));

        return { userAddress: userAddress, tokenIdentifier: tokenIdentifier, roles: roles };
    }

    parseNftCreate(transactionOutcome: TransactionOutcome): {
        tokenIdentifier: string;
        nonce: bigint;
        initialQuantity: bigint;
    }[] {
        this.ensureNoError(transactionOutcome.transactionLogs.events);

        const events = this.findEventsByIdentifier(transactionOutcome, "ESDTNFTCreate");
        return events.map((event) => this.getOutputForNftCreateEvent(event));
    }

    private getOutputForNftCreateEvent(event: TransactionEvent): {
        tokenIdentifier: string;
        nonce: bigint;
        initialQuantity: bigint;
    } {
        const tokenIdentifier = this.extractTokenIdentifier(event);
        const nonce = this.extractNonce(event);
        const amount = this.extractAmount(event);

        return { tokenIdentifier: tokenIdentifier, nonce: nonce, initialQuantity: amount };
    }

    parseLocalMint(transactionOutcome: TransactionOutcome): {
        userAddress: string;
        tokenIdentifier: string;
        nonce: bigint;
        mintedSupply: bigint;
    }[] {
        this.ensureNoError(transactionOutcome.transactionLogs.events);

        const events = this.findEventsByIdentifier(transactionOutcome, "ESDTLocalMint");
        return events.map((event) => this.getOutputForLocalMintEvent(event));
    }

    private getOutputForLocalMintEvent(event: TransactionEvent): {
        userAddress: string;
        tokenIdentifier: string;
        nonce: bigint;
        mintedSupply: bigint;
    } {
        const userAddress = event.address;
        const tokenIdentifier = this.extractTokenIdentifier(event);
        const nonce = this.extractNonce(event);
        const mintedSupply = this.extractAmount(event);

        return {
            userAddress: userAddress,
            tokenIdentifier: tokenIdentifier,
            nonce: nonce,
            mintedSupply: mintedSupply,
        };
    }

    parseLocalBurn(transactionOutcome: TransactionOutcome): {
        userAddress: string;
        tokenIdentifier: string;
        nonce: bigint;
        burntSupply: bigint;
    }[] {
        this.ensureNoError(transactionOutcome.transactionLogs.events);

        const events = this.findEventsByIdentifier(transactionOutcome, "ESDTLocalBurn");
        return events.map((event) => this.getOutputForLocalBurnEvent(event));
    }

    private getOutputForLocalBurnEvent(event: TransactionEvent): {
        userAddress: string;
        tokenIdentifier: string;
        nonce: bigint;
        burntSupply: bigint;
    } {
        const userAddress = event.address;
        const tokenIdentifier = this.extractTokenIdentifier(event);
        const nonce = this.extractNonce(event);
        const burntSupply = this.extractAmount(event);

        return {
            userAddress: userAddress,
            tokenIdentifier: tokenIdentifier,
            nonce: nonce,
            burntSupply: burntSupply,
        };
    }

    parsePause(transactionOutcome: TransactionOutcome): { tokenIdentifier: string }[] {
        this.ensureNoError(transactionOutcome.transactionLogs.events);

        const events = this.findEventsByIdentifier(transactionOutcome, "ESDTPause");
        return events.map((event) => ({ tokenIdentifier: this.extractTokenIdentifier(event) }));
    }

    parseUnpause(transactionOutcome: TransactionOutcome): { tokenIdentifier: string }[] {
        this.ensureNoError(transactionOutcome.transactionLogs.events);

        const events = this.findEventsByIdentifier(transactionOutcome, "ESDTUnPause");
        return events.map((event) => ({ tokenIdentifier: this.extractTokenIdentifier(event) }));
    }

    parseFreeze(transactionOutcome: TransactionOutcome): {
        userAddress: string;
        tokenIdentifier: string;
        nonce: bigint;
        balance: bigint;
    }[] {
        this.ensureNoError(transactionOutcome.transactionLogs.events);

        const events = this.findEventsByIdentifier(transactionOutcome, "ESDTFreeze");
        return events.map((event) => this.getOutputForFreezeEvent(event));
    }

    private getOutputForFreezeEvent(event: TransactionEvent): {
        userAddress: string;
        tokenIdentifier: string;
        nonce: bigint;
        balance: bigint;
    } {
        const userAddress = this.extractAddress(event);
        const tokenIdentifier = this.extractTokenIdentifier(event);
        const nonce = this.extractNonce(event);
        const balance = this.extractAmount(event);

        return {
            userAddress: userAddress,
            tokenIdentifier: tokenIdentifier,
            nonce: nonce,
            balance: balance,
        };
    }

    parseUnfreeze(transactionOutcome: TransactionOutcome): {
        userAddress: string;
        tokenIdentifier: string;
        nonce: bigint;
        balance: bigint;
    }[] {
        this.ensureNoError(transactionOutcome.transactionLogs.events);

        const events = this.findEventsByIdentifier(transactionOutcome, "ESDTUnFreeze");
        return events.map((event) => this.getOutputForUnfreezeEvent(event));
    }

    private getOutputForUnfreezeEvent(event: TransactionEvent): {
        userAddress: string;
        tokenIdentifier: string;
        nonce: bigint;
        balance: bigint;
    } {
        const userAddress = this.extractAddress(event);
        const tokenIdentifier = this.extractTokenIdentifier(event);
        const nonce = this.extractNonce(event);
        const balance = this.extractAmount(event);

        return {
            userAddress: userAddress,
            tokenIdentifier: tokenIdentifier,
            nonce: nonce,
            balance: balance,
        };
    }

    parseWipe(transactionOutcome: TransactionOutcome): {
        userAddress: string;
        tokenIdentifier: string;
        nonce: bigint;
        balance: bigint;
    }[] {
        this.ensureNoError(transactionOutcome.transactionLogs.events);

        const events = this.findEventsByIdentifier(transactionOutcome, "ESDTWipe");
        return events.map((event) => this.getOutputForWipeEvent(event));
    }

    private getOutputForWipeEvent(event: TransactionEvent): {
        userAddress: string;
        tokenIdentifier: string;
        nonce: bigint;
        balance: bigint;
    } {
        const userAddress = this.extractAddress(event);
        const tokenIdentifier = this.extractTokenIdentifier(event);
        const nonce = this.extractNonce(event);
        const balance = this.extractAmount(event);

        return {
            userAddress: userAddress,
            tokenIdentifier: tokenIdentifier,
            nonce: nonce,
            balance: balance,
        };
    }

    parseUpdateAttributes(transactionOutcome: TransactionOutcome): {
        tokenIdentifier: string;
        nonce: bigint;
        attributes: Uint8Array;
    }[] {
        this.ensureNoError(transactionOutcome.transactionLogs.events);

        const events = this.findEventsByIdentifier(transactionOutcome, "ESDTNFTUpdateAttributes");
        return events.map((event) => this.getOutputForUpdateAttributesEvent(event));
    }

    private getOutputForUpdateAttributesEvent(event: TransactionEvent): {
        tokenIdentifier: string;
        nonce: bigint;
        attributes: Uint8Array;
    } {
        const tokenIdentifier = this.extractTokenIdentifier(event);
        const nonce = this.extractNonce(event);
        const attributes = event.topics[3] ? Buffer.from(event.topics[3], "base64") : new Uint8Array();

        return {
            tokenIdentifier: tokenIdentifier,
            nonce: nonce,
            attributes: attributes,
        };
    }

    parseAddQuantity(transactionOutcome: TransactionOutcome): {
        tokenIdentifier: string;
        nonce: bigint;
        addedQuantity: bigint;
    }[] {
        this.ensureNoError(transactionOutcome.transactionLogs.events);

        const events = this.findEventsByIdentifier(transactionOutcome, "ESDTNFTAddQuantity");
        return events.map((event) => this.getOutputForAddQuantityEvent(event));
    }

    private getOutputForAddQuantityEvent(event: TransactionEvent): {
        tokenIdentifier: string;
        nonce: bigint;
        addedQuantity: bigint;
    } {
        const tokenIdentifier = this.extractTokenIdentifier(event);
        const nonce = this.extractNonce(event);
        const addedQuantity = this.extractAmount(event);

        return {
            tokenIdentifier: tokenIdentifier,
            nonce: nonce,
            addedQuantity: addedQuantity,
        };
    }

    parseBurnQuantity(transactionOutcome: TransactionOutcome): {
        tokenIdentifier: string;
        nonce: bigint;
        burntQuantity: bigint;
    }[] {
        this.ensureNoError(transactionOutcome.transactionLogs.events);

        const events = this.findEventsByIdentifier(transactionOutcome, "ESDTNFTBurn");
        return events.map((event) => this.getOutputForBurnQuantityEvent(event));
    }

    private getOutputForBurnQuantityEvent(event: TransactionEvent): {
        tokenIdentifier: string;
        nonce: bigint;
        burntQuantity: bigint;
    } {
        const tokenIdentifier = this.extractTokenIdentifier(event);
        const nonce = this.extractNonce(event);
        const burntQuantity = this.extractAmount(event);

        return {
            tokenIdentifier: tokenIdentifier,
            nonce: nonce,
            burntQuantity: burntQuantity,
        };
    }

    private ensureNoError(transactionEvents: TransactionEvent[]) {
        for (const event of transactionEvents) {
            if (event.identifier == "signalError") {
                const data = Buffer.from(event.data.toString().slice(1)).toString();
                const message = this.decodeTopicAsString(event.topics[1]);

                throw new ErrParseTransactionOutcome(
                    `encountered signalError: ${message} (${Buffer.from(data, "hex").toString()})`,
                );
            }
        }
    }

    private findEventsByIdentifier(transactionOutcome: TransactionOutcome, identifier: string): TransactionEvent[] {
        const events = this.gatherAllEvents(transactionOutcome).filter((event) => event.identifier == identifier);

        if (events.length == 0) {
            throw new ErrParseTransactionOutcome(`cannot find event of type ${identifier}`);
        }

        return events;
    }

    private gatherAllEvents(transactionOutcome: TransactionOutcome): TransactionEvent[] {
        const allEvents = [];

        allEvents.push(...transactionOutcome.transactionLogs.events);

        for (const item of transactionOutcome.smartContractResults) {
            allEvents.push(...item.logs.events);
        }

        return allEvents;
    }

    private extractTokenIdentifier(event: TransactionEvent): string {
        if (!event.topics[0]) {
            return "";
        }
        return this.decodeTopicAsString(event.topics[0]);
    }

    private extractNonce(event: TransactionEvent): bigint {
        if (!event.topics[1]) {
            return BigInt(0);
        }
        const nonce = Buffer.from(event.topics[1], "base64");
        return BigInt(bufferToBigInt(nonce).toFixed(0));
    }

    private extractAmount(event: TransactionEvent): bigint {
        if (!event.topics[2]) {
            return BigInt(0);
        }
        const amount = Buffer.from(event.topics[2], "base64");
        return BigInt(bufferToBigInt(amount).toFixed(0));
    }

    private extractAddress(event: TransactionEvent): string {
        if (!event.topics[3]) {
            return "";
        }
        const address = Buffer.from(event.topics[3], "base64");
        return Address.fromBuffer(address).bech32();
    }

    private decodeTopicAsString(topic: string): string {
        return Buffer.from(topic, "base64").toString();
    }
}
