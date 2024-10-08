import { Address } from "../address";
import { Err } from "../errors";
import { ITransactionOnNetwork } from "../interfaceOfNetwork";
import { EndpointDefinition, ResultsParser, ReturnCode, Type, UntypedOutcomeBundle } from "../smartcontracts";
import { TransactionOutcome, findEventsByIdentifier } from "./resources";

enum Events {
    SCDeploy = "SCDeploy",
    SignalError = "signalError",
    WriteLog = "writeLog",
}

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
        this.legacyResultsParser = options?.legacyResultsParser || new ResultsParser();
    }

    parseDeploy(
        options: { transactionOutcome: TransactionOutcome } | { transactionOnNetwork: ITransactionOnNetwork },
    ): {
        returnCode: string;
        returnMessage: string;
        contracts: {
            address: string;
            ownerAddress: string;
            codeHash: Uint8Array;
        }[];
    } {
        if ("transactionOutcome" in options) {
            return this.parseDeployGivenTransactionOutcome(options.transactionOutcome);
        }

        return this.parseDeployGivenTransactionOnNetwork(options.transactionOnNetwork);
    }

    /**
     * Legacy approach.
     */
    protected parseDeployGivenTransactionOutcome(transactionOutcome: TransactionOutcome): {
        returnCode: string;
        returnMessage: string;
        contracts: {
            address: string;
            ownerAddress: string;
            codeHash: Uint8Array;
        }[];
    } {
        const directCallOutcome = transactionOutcome.directSmartContractCallOutcome;
        const events = findEventsByIdentifier(transactionOutcome, Events.SCDeploy);
        const contracts = events.map((event) => this.parseScDeployEvent(event));

        return {
            returnCode: directCallOutcome.returnCode,
            returnMessage: directCallOutcome.returnMessage,
            contracts: contracts,
        };
    }

    protected parseDeployGivenTransactionOnNetwork(_transactionOnNetwork: ITransactionOnNetwork): {
        returnCode: string;
        returnMessage: string;
        contracts: {
            address: string;
            ownerAddress: string;
            codeHash: Uint8Array;
        }[];
    } {
        throw new Error("Not implemented.");
    }

    private parseScDeployEvent(event: { topics: Uint8Array[] }): {
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

    parseExecute(
        options:
            | { transactionOutcome: TransactionOutcome; function?: string }
            | { transactionOnNetwork: ITransactionOnNetwork; function?: string },
    ): {
        values: any[];
        returnCode: string;
        returnMessage: string;
    } {
        if ("transactionOutcome" in options) {
            return this.parseExecuteGivenTransactionOutcome(options.transactionOutcome, options.function);
        }

        return this.parseExecuteGivenTransactionOnNetwork(options.transactionOnNetwork, options.function);
    }

    /**
     * Legacy approach.
     */
    protected parseExecuteGivenTransactionOutcome(
        transactionOutcome: TransactionOutcome,
        functionName?: string,
    ): {
        values: any[];
        returnCode: string;
        returnMessage: string;
    } {
        const directCallOutcome = transactionOutcome.directSmartContractCallOutcome;

        if (!this.abi) {
            return {
                values: directCallOutcome.returnDataParts,
                returnCode: directCallOutcome.returnCode,
                returnMessage: directCallOutcome.returnMessage,
            };
        }

        functionName = functionName || directCallOutcome.function;

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

    protected parseExecuteGivenTransactionOnNetwork(
        _transactionOnNetwork: ITransactionOnNetwork,
        _functionName?: string,
    ): {
        values: any[];
        returnCode: string;
        returnMessage: string;
    } {
        throw new Error("Not implemented.");
    }
}
