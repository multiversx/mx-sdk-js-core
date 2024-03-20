import { EndpointDefinition, ResultsParser, ReturnCode } from "../smartcontracts";
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
        const directCallOutcome = options.outcome.directSmartContractCallOutcome;

        if (!this.abi) {
            return {
                values: directCallOutcome.returnDataParts,
                returnCode: directCallOutcome.returnCode,
                returnMessage: directCallOutcome.returnMessage,
            };
        }

        const functionName = options.function || directCallOutcome.function;
        const endpoint = this.abi.getEndpoint(functionName);
        const legacyUntypedBundle = {
            returnCode: new ReturnCode(directCallOutcome.returnCode),
            returnMessage: directCallOutcome.returnMessage,
            values: directCallOutcome.returnDataParts.map((part) => Buffer.from(part)),
        };

        const legacyTypedBundle = this.legacyResultsParser.parseOutcomeFromUntypedBundle(legacyUntypedBundle, endpoint);

        return {
            values: legacyTypedBundle.values.map((value) => value.valueOf()),
            returnCode: legacyTypedBundle.returnCode.toString(),
            returnMessage: legacyTypedBundle.returnMessage,
        };
    }
}
