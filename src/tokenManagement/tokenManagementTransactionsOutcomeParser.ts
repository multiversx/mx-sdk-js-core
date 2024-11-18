import { bufferToBigInt } from "../abi/codec/utils";
import { Address } from "../address";
import { TransactionsConverter } from "../converters/transactionsConverter";
import { ErrParseTransactionOutcome } from "../errors";
import { ITransactionOnNetwork } from "../interfaceOfNetwork";
import { TransactionEvent, TransactionOutcome, findEventsByIdentifier } from "../transactionsOutcomeParsers/resources";
import { MintNftOutput, SpecialRoleOutput } from "./resources";

export class TokenManagementTransactionsOutcomeParser {
    constructor() {}

    parseIssueFungible(transaction: TransactionOutcome | ITransactionOnNetwork): { tokenIdentifier: string }[] {
        transaction = this.ensureTransactionOutcome(transaction);

        this.ensureNoError(transaction.logs.events);

        const events = findEventsByIdentifier(transaction, "issue");
        return events.map((event) => ({ tokenIdentifier: this.extractTokenIdentifier(event) }));
    }

    parseIssueNonFungible(transaction: TransactionOutcome | ITransactionOnNetwork): { tokenIdentifier: string }[] {
        transaction = this.ensureTransactionOutcome(transaction);

        this.ensureNoError(transaction.logs.events);

        const events = findEventsByIdentifier(transaction, "issueNonFungible");
        return events.map((event) => ({ tokenIdentifier: this.extractTokenIdentifier(event) }));
    }

    parseIssueSemiFungible(transaction: TransactionOutcome | ITransactionOnNetwork): { tokenIdentifier: string }[] {
        transaction = this.ensureTransactionOutcome(transaction);

        this.ensureNoError(transaction.logs.events);

        const events = findEventsByIdentifier(transaction, "issueSemiFungible");
        return events.map((event) => ({ tokenIdentifier: this.extractTokenIdentifier(event) }));
    }

    parseRegisterMetaEsdt(transaction: TransactionOutcome | ITransactionOnNetwork): { tokenIdentifier: string }[] {
        transaction = this.ensureTransactionOutcome(transaction);

        this.ensureNoError(transaction.logs.events);

        const events = findEventsByIdentifier(transaction, "registerMetaESDT");
        return events.map((event) => ({ tokenIdentifier: this.extractTokenIdentifier(event) }));
    }

    parseRegisterAndSetAllRoles(
        transaction: TransactionOutcome | ITransactionOnNetwork,
    ): { tokenIdentifier: string; roles: string[] }[] {
        transaction = this.ensureTransactionOutcome(transaction);

        this.ensureNoError(transaction.logs.events);
        const registerEvents = findEventsByIdentifier(transaction, "registerAndSetAllRoles");
        const setRoleEvents = findEventsByIdentifier(transaction, "ESDTSetRole");

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

    parseSetBurnRoleGlobally(transaction: TransactionOutcome | ITransactionOnNetwork) {
        transaction = this.ensureTransactionOutcome(transaction);

        this.ensureNoError(transaction.logs.events);
    }

    parseUnsetBurnRoleGlobally(transaction: TransactionOutcome | ITransactionOnNetwork) {
        transaction = this.ensureTransactionOutcome(transaction);

        this.ensureNoError(transaction.logs.events);
    }

    parseSetSpecialRole(transaction: TransactionOutcome | ITransactionOnNetwork): SpecialRoleOutput[] {
        transaction = this.ensureTransactionOutcome(transaction);

        this.ensureNoError(transaction.logs.events);

        const events = findEventsByIdentifier(transaction, "ESDTSetRole");
        return events.map((event) => this.getOutputForSetSpecialRoleEvent(event));
    }

    private getOutputForSetSpecialRoleEvent(event: TransactionEvent): SpecialRoleOutput {
        const userAddress = event.address;
        const tokenIdentifier = this.extractTokenIdentifier(event);
        const encodedRoles = event.topics.slice(3);
        const roles = encodedRoles.map((role) => this.decodeTopicAsString(role));

        return { userAddress: userAddress, tokenIdentifier: tokenIdentifier, roles: roles };
    }

    parseNftCreate(transaction: TransactionOutcome | ITransactionOnNetwork): MintNftOutput[] {
        transaction = this.ensureTransactionOutcome(transaction);

        this.ensureNoError(transaction.logs.events);

        const events = findEventsByIdentifier(transaction, "ESDTNFTCreate");
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

    parseLocalMint(transaction: TransactionOutcome | ITransactionOnNetwork): {
        userAddress: string;
        tokenIdentifier: string;
        nonce: bigint;
        mintedSupply: bigint;
    }[] {
        transaction = this.ensureTransactionOutcome(transaction);

        this.ensureNoError(transaction.logs.events);

        const events = findEventsByIdentifier(transaction, "ESDTLocalMint");
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

    parseLocalBurn(transaction: TransactionOutcome | ITransactionOnNetwork): {
        userAddress: string;
        tokenIdentifier: string;
        nonce: bigint;
        burntSupply: bigint;
    }[] {
        transaction = this.ensureTransactionOutcome(transaction);

        this.ensureNoError(transaction.logs.events);

        const events = findEventsByIdentifier(transaction, "ESDTLocalBurn");
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

    parsePause(transaction: TransactionOutcome | ITransactionOnNetwork): { tokenIdentifier: string }[] {
        transaction = this.ensureTransactionOutcome(transaction);

        this.ensureNoError(transaction.logs.events);

        const events = findEventsByIdentifier(transaction, "ESDTPause");
        return events.map((event) => ({ tokenIdentifier: this.extractTokenIdentifier(event) }));
    }

    parseUnpause(transaction: TransactionOutcome | ITransactionOnNetwork): { tokenIdentifier: string }[] {
        transaction = this.ensureTransactionOutcome(transaction);

        this.ensureNoError(transaction.logs.events);

        const events = findEventsByIdentifier(transaction, "ESDTUnPause");
        return events.map((event) => ({ tokenIdentifier: this.extractTokenIdentifier(event) }));
    }

    parseFreeze(transaction: TransactionOutcome | ITransactionOnNetwork): {
        userAddress: string;
        tokenIdentifier: string;
        nonce: bigint;
        balance: bigint;
    }[] {
        transaction = this.ensureTransactionOutcome(transaction);

        this.ensureNoError(transaction.logs.events);

        const events = findEventsByIdentifier(transaction, "ESDTFreeze");
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

    parseUnfreeze(transaction: TransactionOutcome | ITransactionOnNetwork): {
        userAddress: string;
        tokenIdentifier: string;
        nonce: bigint;
        balance: bigint;
    }[] {
        transaction = this.ensureTransactionOutcome(transaction);

        this.ensureNoError(transaction.logs.events);

        const events = findEventsByIdentifier(transaction, "ESDTUnFreeze");
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

    parseWipe(transaction: TransactionOutcome | ITransactionOnNetwork): {
        userAddress: string;
        tokenIdentifier: string;
        nonce: bigint;
        balance: bigint;
    }[] {
        transaction = this.ensureTransactionOutcome(transaction);

        this.ensureNoError(transaction.logs.events);

        const events = findEventsByIdentifier(transaction, "ESDTWipe");
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

    parseUpdateAttributes(transaction: TransactionOutcome | ITransactionOnNetwork): {
        tokenIdentifier: string;
        nonce: bigint;
        attributes: Uint8Array;
    }[] {
        transaction = this.ensureTransactionOutcome(transaction);

        this.ensureNoError(transaction.logs.events);

        const events = findEventsByIdentifier(transaction, "ESDTNFTUpdateAttributes");
        return events.map((event) => this.getOutputForUpdateAttributesEvent(event));
    }

    private getOutputForUpdateAttributesEvent(event: TransactionEvent): {
        tokenIdentifier: string;
        nonce: bigint;
        attributes: Uint8Array;
    } {
        const tokenIdentifier = this.extractTokenIdentifier(event);
        const nonce = this.extractNonce(event);
        const attributes = event.topics[3] ? event.topics[3] : new Uint8Array();

        return {
            tokenIdentifier: tokenIdentifier,
            nonce: nonce,
            attributes: attributes,
        };
    }

    parseAddQuantity(transaction: TransactionOutcome | ITransactionOnNetwork): {
        tokenIdentifier: string;
        nonce: bigint;
        addedQuantity: bigint;
    }[] {
        transaction = this.ensureTransactionOutcome(transaction);

        this.ensureNoError(transaction.logs.events);

        const events = findEventsByIdentifier(transaction, "ESDTNFTAddQuantity");
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

    parseBurnQuantity(transaction: TransactionOutcome | ITransactionOnNetwork): {
        tokenIdentifier: string;
        nonce: bigint;
        burntQuantity: bigint;
    }[] {
        transaction = this.ensureTransactionOutcome(transaction);

        this.ensureNoError(transaction.logs.events);

        const events = findEventsByIdentifier(transaction, "ESDTNFTBurn");
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

    /**
     * Temporary workaround, until "TransactionOnNetwork" completely replaces "TransactionOutcome".
     */
    private ensureTransactionOutcome(transaction: TransactionOutcome | ITransactionOnNetwork): TransactionOutcome {
        if ("hash" in transaction) {
            return new TransactionsConverter().transactionOnNetworkToOutcome(transaction);
        }

        return transaction;
    }

    private ensureNoError(transactionEvents: TransactionEvent[]) {
        for (const event of transactionEvents) {
            if (event.identifier == "signalError") {
                const data = Buffer.from(event.dataItems[0]?.toString().slice(1)).toString() || "";
                const message = this.decodeTopicAsString(event.topics[1]);

                throw new ErrParseTransactionOutcome(
                    `encountered signalError: ${message} (${Buffer.from(data, "hex").toString()})`,
                );
            }
        }
    }

    private extractTokenIdentifier(event: TransactionEvent): string {
        if (!event.topics[0]?.length) {
            return "";
        }
        return this.decodeTopicAsString(event.topics[0]);
    }

    private extractNonce(event: TransactionEvent): bigint {
        if (!event.topics[1]?.length) {
            return BigInt(0);
        }
        const nonce = Buffer.from(event.topics[1]);
        return BigInt(bufferToBigInt(nonce).toFixed(0));
    }

    private extractAmount(event: TransactionEvent): bigint {
        if (!event.topics[2]?.length) {
            return BigInt(0);
        }
        const amount = Buffer.from(event.topics[2]);
        return BigInt(bufferToBigInt(amount).toFixed(0));
    }

    private extractAddress(event: TransactionEvent): string {
        if (!event.topics[3]?.length) {
            return "";
        }
        const address = Buffer.from(event.topics[3]);
        return Address.fromBuffer(address).bech32();
    }

    private decodeTopicAsString(topic: Uint8Array): string {
        return Buffer.from(topic).toString();
    }
}
