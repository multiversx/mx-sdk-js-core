import { EndpointDefinition, ResultsParser, ReturnCode, Type, UntypedOutcomeBundle } from "../smartcontracts";
import { TransactionOutcome } from "./resources";

interface Abi {
    getEndpoint(name: string): EndpointDefinition;
}

interface ILegacyResultsParser {
    parseOutcomeFromUntypedBundle(
        bundle: UntypedOutcomeBundle,
        endpoint: { output: IParameterDefinition[] },
    ): {
        values: any[];
        returnCode: { valueOf(): string };
        returnMessage: string;
    };
}

interface IParameterDefinition {
    type: Type;
}

export class SmartContractTransactionsOutcomeParser {
    private readonly abi?: Abi;
    private readonly legacyResultsParser: ILegacyResultsParser;

    constructor(options: { abi?: Abi; legacyResultsParser?: ILegacyResultsParser }) {
        this.abi = options.abi;

        // Prior v13, we've advertised that people can override the "ResultsParser" to alter it's behavior in case of exotic flows.
        // Now, since the new "SmartContractTransactionsOutcomeParser" (still) depends on the legacy "ResultsParser",
        // at least until "return data parts of direct outcome of contract call" are included on API & Proxy responses (on GET transaction),
        // we have to allow the same level of customization (for exotic flows).
        this.legacyResultsParser = options.legacyResultsParser || new ResultsParser();
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
