import { Address } from "../address";
import { Err } from "../errors";
import { EndpointDefinition, ResultsParser, ReturnCode, Type, UntypedOutcomeBundle } from "../smartcontracts";
import { TransactionEvent, TransactionOutcome, findEventsByIdentifier } from "./resources";

interface IAbi {
    getEndpoint(name: string): EndpointDefinition;
}

interface IParameterDefinition {
    type: Type;
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

export class SmartContractTransactionsOutcomeParser {
    private readonly abi?: IAbi;
    private readonly legacyResultsParser: ILegacyResultsParser;

    constructor(options?: { abi?: IAbi; legacyResultsParser?: ILegacyResultsParser }) {
        this.abi = options?.abi;

        // Prior v13, we've advertised that people can override the "ResultsParser" to alter it's behavior in case of exotic flows.
        // Now, since the new "SmartContractTransactionsOutcomeParser" (still) depends on the legacy "ResultsParser",
        // at least until "return data parts of direct outcome of contract call" are included on API & Proxy responses (on GET transaction),
        // we have to allow the same level of customization (for exotic flows).
        this.legacyResultsParser = options?.legacyResultsParser || new ResultsParser();
    }

    parseDeploy(options: { transactionOutcome: TransactionOutcome }): {
        returnCode: string;
        returnMessage: string;
        contracts: {
            address: string;
            ownerAddress: string;
            codeHash: Uint8Array;
        }[];
    } {
        const directCallOutcome = options.transactionOutcome.directSmartContractCallOutcome;
        const events = findEventsByIdentifier(options.transactionOutcome, "SCDeploy");
        const contracts = events.map((event) => this.parseScDeployEvent(event));

        return {
            returnCode: directCallOutcome.returnCode,
            returnMessage: directCallOutcome.returnMessage,
            contracts: contracts,
        };
    }

    private parseScDeployEvent(event: TransactionEvent): {
        address: string;
        ownerAddress: string;
        codeHash: Uint8Array;
    } {
        const topicForAddress = event.topics[0];
        const topicForOwnerAddress = event.topics[1];
        const topicForCodeHash = event.topics[2];

        const address = topicForAddress?.length ? new Address(topicForAddress).toBech32() : "";
        const ownerAddress = topicForOwnerAddress?.length ? new Address(topicForOwnerAddress).toBech32() : "";
        const codeHash = topicForCodeHash;

        return {
            address,
            ownerAddress,
            codeHash,
        };
    }

    parseExecute(options: { transactionOutcome: TransactionOutcome; function?: string }): {
        values: any[];
        returnCode: string;
        returnMessage: string;
    } {
        const directCallOutcome = options.transactionOutcome.directSmartContractCallOutcome;

        if (!this.abi) {
            return {
                values: directCallOutcome.returnDataParts,
                returnCode: directCallOutcome.returnCode,
                returnMessage: directCallOutcome.returnMessage,
            };
        }

        const functionName = options.function || directCallOutcome.function;

        if (!functionName) {
            throw new Err(
                `Function name is not available in the transaction outcome, thus endpoint definition (ABI) cannot be picked (for parsing). Maybe provide the "function" parameter explicitly?`,
            );
        }

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
