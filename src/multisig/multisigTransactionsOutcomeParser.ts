import { Abi } from "../abi";
import { Address, TransactionOnNetwork } from "../core";
import { SmartContractDeployOutcome } from "../smartContracts/resources";
import { SmartContractTransactionsOutcomeParser } from "../transactionsOutcomeParsers";

/**
 * Parses the outcome of multisig contract operations
 */
export class MultisigTransactionsOutcomeParser {
    private parser: SmartContractTransactionsOutcomeParser;
    private readonly abi: Abi;

    constructor(options: { abi: Abi }) {
        this.abi = options?.abi;
        this.parser = new SmartContractTransactionsOutcomeParser({ abi: this.abi });
    }

    /**
     * Parses the outcome of creating a new multisig contract
     * @param transactionOnNetwork The completed transaction
     * @returns An array of objects containing the new contract addresses
     */
    parseDeploy(transactionOnNetwork: TransactionOnNetwork): SmartContractDeployOutcome {
        return this.parser.parseDeploy({ transactionOnNetwork });
    }

    /**
     * Parses the outcome of a multisig action proposal
     * @param transactionOnNetwork The completed transaction
     * @returns The action ID that was created
     */
    parseProposeAction(transactionOnNetwork: TransactionOnNetwork): number {
        const result = this.parser.parseExecute({ transactionOnNetwork });

        return result.values[0];
    }

    /**
     * Parses the outcome of a multisig action proposal
     * @param transactionOnNetwork The completed transaction
     * @returns In case of scDeploy returns address else undefined
     */
    parsePerformAction(transactionOnNetwork: TransactionOnNetwork): Address | undefined {
        const result = this.parser.parseExecute({ transactionOnNetwork });

        return result.values[0];
    }
}
