import { Abi } from "../abi";
import { TransactionOnNetwork } from "../core";
import { Address } from "../core/address";
import { Err } from "../core/errors";
import { SmartContractDeployOutcome } from "../smartContracts/resources";
import { SmartContractTransactionsOutcomeParser } from "../transactionsOutcomeParsers";

/**
 * Parses the outcome of multisig contract operations
 */
export class MultisigTransactionsOutcomeParser {
    private parser: SmartContractTransactionsOutcomeParser;
    private readonly abi?: Abi;

    constructor(options?: { abi?: Abi }) {
        this.abi = options?.abi;
        this.parser = new SmartContractTransactionsOutcomeParser({ abi: this.abi });
    }

    /**
     * Parses the outcome of creating a new multisig contract
     * @param transactionOnNetwork The completed transaction
     * @returns An array of objects containing the new contract addresses
     */
    parseDeployMultisigContract(transactionOnNetwork: TransactionOnNetwork): SmartContractDeployOutcome {
        return this.parser.parseDeploy({ transactionOnNetwork });
    }

    /**
     * Parses the outcome of a multisig action proposal
     * @param transactionOnNetwork The completed transaction
     * @returns The action ID that was created
     */
    parseActionProposal(transactionOnNetwork: TransactionOnNetwork): number {
        const result = this.parser.parseExecute({ transactionOnNetwork });

        return result.values[0];
    }

    /**
     * Parses the outcome of a query to get the multisig contract's pending actions
     * @param queryResponse The query response
     * @returns The list of pending action IDs
     */
    parsePendingActionIds(queryResponse: string[]): number[] {
        try {
            if (!queryResponse || queryResponse.length === 0) {
                return [];
            }

            // Assuming each element in the response is a base64 encoded action ID
            return queryResponse.map((item) => {
                const buffer = Buffer.from(item, "base64");
                return parseInt(buffer.toString("hex"), 16);
            });
        } catch (error) {
            throw new Error(`Error parsing pending action IDs: ${error}`);
        }
    }

    /**
     * Parses the outcome of a query to get the multisig contract's board members
     * @param queryResponse The query response
     * @returns The list of board member addresses
     */
    parseBoardMembers(queryResponse: string[]): Address[] {
        if (!queryResponse || queryResponse.length === 0) {
            return [];
        }

        return queryResponse.map((item) => {
            const buffer = Buffer.from(item, "base64");
            return Address.newFromHex(buffer.toString("hex"));
        });
    }

    /**
     * Parses the outcome of a query to get the multisig contract's quorum
     * @param queryResponse The query response
     * @returns The quorum value
     */
    parseQuorum(queryResponse: string[]): number {
        if (!queryResponse || queryResponse.length === 0) {
            throw new Err("No return data available");
        }

        const buffer = Buffer.from(queryResponse[0], "base64");
        return parseInt(buffer.toString("hex"), 16);
    }
}
