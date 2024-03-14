import { EndpointDefinition, ResultsParser } from "../smartcontracts";
import { TransactionOutcome } from "./resources";

interface Abi {
    getEndpoint(name: string): EndpointDefinition;
}

export class SmartContractTransactionsOutcomeParser {
    private readonly abi?: Abi;
    private readonly legacyResultsParser: ResultsParser;

    constructor(options: { abi?: Abi }) {
        this.abi = options.abi;
        this.legacyResultsParser = new ResultsParser();
    }

    parseExecute(options: { outcome: TransactionOutcome; function?: string }): {
        values: any[];
        returnCode: string;
        returnMessage: string;
    } {
        const functionName = options.function || options.outcome.function;

        if (this.abi) {
            const endpoint = this.abi.getEndpoint(functionName);
        }

        return {
            values: [],
            returnCode: "",
            returnMessage: "",
        };
    }
}
