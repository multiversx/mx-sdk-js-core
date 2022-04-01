import path from "path";
import fs from "fs";
import { ChainSendContext } from "./chainSendContext";
import { generateMethods, Methods } from "./generateMethods";
import { formatEndpoint, FormattedCall } from "./formattedCall";
import { ArgumentErrorContext } from "../argumentErrorContext";
import { PreparedCall } from "./preparedCall";
import { TransactionOnNetwork } from "../../transactionOnNetwork";
import { ContractLogger } from "./contractLogger";
import { SendContext } from "./sendContext";
import { loadContractCode } from "../../testutils";
import { NativeSerializer, NativeTypes } from "../nativeSerializer";
import { AddressType, EndpointDefinition, EndpointParameterDefinition } from "../typesystem";
import { Address } from "../../address";
import { SmartContractAbi } from "../abi";
import { SmartContract } from "../smartContract";
import { Code } from "../code";
import { Transaction } from "../../transaction";
import { IProvider } from "../../interface";
import { Interaction } from "../interaction";
import { Err, ErrContract, ErrInvalidArgument } from "../../errors";
import { Egld } from "../../balanceBuilder";
import { Balance } from "../../balance";
import { ExecutionResultsBundle, findImmediateResult, interpretExecutionResults } from "./deprecatedContractResults";
import { Result } from "./result";

/**
 * Provides a simple interface in order to easily call or query the smart contract's methods.
 */
export class ContractWrapper extends ChainSendContext {
    readonly context: SendContext;
    private readonly smartContract: SmartContract;
    private readonly wasmPath: string | null;
    private readonly abi: SmartContractAbi;
    private readonly builtinFunctions: ContractWrapper;
    readonly call: Methods<Promise<any>>;
    readonly results: Methods<Promise<ExecutionResultsBundle>>;
    readonly query: Methods<Promise<any>>;
    readonly format: Methods<FormattedCall>;

    private constructor(
        smartContract: SmartContract,
        abi: SmartContractAbi,
        wasmPath: string | null,
        context: SendContext,
        builtinFunctions: ContractWrapper | null,
    ) {
        super(context);
        this.context = context;
        this.smartContract = smartContract;
        this.abi = abi;
        this.wasmPath = wasmPath;
        this.builtinFunctions = builtinFunctions || this;


        this.call = generateMethods(this, this.abi, this.handleCall);

        this.results = generateMethods(this, this.abi, this.handleResults);

        this.query = generateMethods(this, this.abi, this.handleQuery);

        this.format = generateMethods(this, this.abi, this.handleFormat);

        let constructor = this.abi.getConstructorDefinition();
        if (constructor !== null) {
            this.call.deploy = this.handleDeployCall.bind(this, constructor);
            this.format.deploy = this.handleFormat.bind(this, constructor);
        }
    }

    address(address: NativeTypes.NativeAddress): ContractWrapper {
        let typedAddress = NativeSerializer.convertNativeToAddress(address, new ArgumentErrorContext("address", "0", new EndpointParameterDefinition("address", "", new AddressType())));
        this.smartContract.setAddress(typedAddress);
        return this;
    }

    getAddress(): Address {
        return this.smartContract.getAddress();
    }

    getAbi(): SmartContractAbi {
        return this.abi;
    }

    getSmartContract(): SmartContract {
        return this.smartContract;
    }

    async getCode(): Promise<Code> {
        if (this.wasmPath == null) {
            throw new Err("contract wasm path not configured");
        }
        return await loadContractCode(this.wasmPath);
    }

    private async buildDeployTransaction(constructorDefinition: EndpointDefinition, args: any[]): Promise<Transaction> {
        let contractCode = await this.getCode();

        let convertedArgs = formatEndpoint(constructorDefinition, constructorDefinition, ...args).toTypedValues();
        let transaction = this.smartContract.deploy({
            code: contractCode,
            gasLimit: this.context.getGasLimit(),
            initArguments: convertedArgs,
            chainID: this.context.getChainID()
        });
        return transaction;
    }

    private async handleDeployCall(constructorDefinition: EndpointDefinition, ...args: any[]): Promise<void> {
        let transaction = await this.buildDeployTransaction(constructorDefinition, args);

        let transactionOnNetwork = await this.processTransaction(transaction);

        let smartContractResults = transactionOnNetwork.results;
        let immediateResult = findImmediateResult(smartContractResults)!;
        immediateResult.assertSuccess();
        let logger = this.context.getLogger();
        logger?.deployComplete(transaction, smartContractResults, this.smartContract.getAddress());
    }

    static async loadProject(provider: IProvider, builtinFunctions: ContractWrapper | null, projectPath: string, filenameHint?: string, sendContext?: SendContext): Promise<ContractWrapper> {
        let { abiPath, wasmPath } = await expandProjectPath(projectPath, filenameHint);
        let abi = await SmartContractAbi.fromAbiPath(abiPath);
        let smartContract = new SmartContract({ abi: abi });
        let networkConfig = await provider.getNetworkConfig();
        sendContext = sendContext || new SendContext(provider, networkConfig).logger(new ContractLogger());
        return new ContractWrapper(smartContract, abi, wasmPath, sendContext, builtinFunctions);
    }

    async handleQuery(endpoint: EndpointDefinition, ...args: any[]): Promise<any> {
        let preparedCall = await this.prepareCallWithPayment(endpoint, args);
        let interaction = this.convertPreparedCallToInteraction(preparedCall);
        let provider = this.context.getProvider();
        let logger = this.context.getLogger();

        let query = interaction.buildQuery();
        logger?.queryCreated(query);
        let optionalSender = this.context.getSenderOptional();
        if (optionalSender != null) {
            query.caller = optionalSender.address;
        }
        let response = await provider.queryContract(query);
        let result = Result.unpackQueryOutput(endpoint, response);
        logger?.queryComplete(result, response);

        return result;
    }

    async handleCall(endpoint: EndpointDefinition, ...args: any[]): Promise<any> {
        let { transaction, interaction } = this.buildTransactionAndInteraction(endpoint, args);
        let { result } = await this.processTransactionAndInterpretResults({ endpoint, transaction });
        return result;
    }

    async handleResults(endpoint: EndpointDefinition, ...args: any[]): Promise<ExecutionResultsBundle> {
        let { transaction, interaction } = this.buildTransactionAndInteraction(endpoint, args);
        let { executionResultsBundle } = await this.processTransactionAndInterpretResults({ endpoint, transaction });
        return executionResultsBundle;
    }

    async processTransactionAndInterpretResults({ endpoint, transaction }: {
        endpoint: EndpointDefinition,
        transaction: Transaction
    }): Promise<{ executionResultsBundle: ExecutionResultsBundle, result: any }> {
        let transactionOnNetwork = await this.processTransaction(transaction);
        let executionResultsBundle = interpretExecutionResults(endpoint, transactionOnNetwork);
        let { smartContractResults, immediateResult } = executionResultsBundle;
        let result = Result.unpackExecutionOutput(endpoint, immediateResult);
        let logger = this.context.getLogger();
        logger?.transactionComplete(result, immediateResult?.data, transaction, smartContractResults);
        return { executionResultsBundle, result };
    }

    async processTransaction(transaction: Transaction): Promise<TransactionOnNetwork> {
        let provider = this.context.getProvider();
        let sender = this.context.getSender();
        transaction.setNonce(sender.account.nonce);
        await sender.signer.sign(transaction);

        let logger = this.context.getLogger();
        logger?.transactionCreated(transaction);
        await transaction.send(provider);

        // increment the nonce only after the transaction is sent
        // since an exception thrown by the provider means we will have to re-use the same nonce
        // otherwise the next transactions will hang (and never complete)
        sender.account.incrementNonce();

        logger?.transactionSent(transaction);
        await transaction.awaitExecuted(provider);
        let transactionOnNetwork = await transaction.getAsOnNetwork(provider, true, false, true);
        if (transaction.getStatus().isFailed()) {
            // TODO: extract the error messages
            //let results = transactionOnNetwork.results.getAllResults();
            //let messages = results.map((result) => console.log(result));
            throw new ErrContract(`Transaction status failed: [${transaction.getStatus().toString()}].`);// Return messages:\n${messages}`);
        }
        return transactionOnNetwork;
    }

    handleFormat(endpoint: EndpointDefinition, ...args: any[]): FormattedCall {
        let { formattedCall } = this.prepareCallWithPayment(endpoint, args);
        return formattedCall;
    }

    buildTransactionAndInteraction(endpoint: EndpointDefinition, args: any[]): { transaction: Transaction, interaction: Interaction } {
        let preparedCall = this.prepareCallWithPayment(endpoint, args);
        let interaction = this.convertPreparedCallToInteraction(preparedCall);
        interaction.withGasLimit(this.context.getGasLimit());
        interaction.withChainID(this.context.getChainID());
        let transaction = interaction.buildTransaction();
        return { transaction, interaction };
    }

    prepareCallWithPayment(endpoint: EndpointDefinition, args: any[]): PreparedCall {
        let value = this.context.getAndResetValue();
        if (value == null && endpoint.modifiers.isPayable()) {
            throw new Err("Did not provide any value for a payable method");
        }
        if (value != null && !endpoint.modifiers.isPayable()) {
            throw new Err("A value was provided for a non-payable method");
        }
        if (value != null && !endpoint.modifiers.isPayableInToken(value.token.getTokenIdentifier())) {
            throw new Err(`Token ${value.token.getTokenIdentifier()} is not accepted by payable method. Accepted tokens: ${endpoint.modifiers.payableInTokens}`);
        }
        let formattedCall = formatEndpoint(endpoint, endpoint, ...args);
        let preparedCall = new PreparedCall(this.smartContract.getAddress(), Egld(0), formattedCall);
        this.applyValueModfiers(value, preparedCall);
        return preparedCall;
    }

    convertPreparedCallToInteraction(preparedCall: PreparedCall): Interaction {
        let executingFunction = preparedCall.formattedCall.getExecutingFunction();
        let interpretingFunction = preparedCall.formattedCall.getInterpretingFunction();
        let typedValueArgs = preparedCall.formattedCall.toTypedValues();
        // TODO: Most probably, this need to be fixed. Perhaps two interactions have to be instantiated?
        let interaction = new Interaction(this.smartContract, executingFunction, typedValueArgs, preparedCall.receiver);
        interaction.withValue(preparedCall.egldValue);
        return interaction;
    }

    applyValueModfiers(value: Balance | null, preparedCall: PreparedCall) {
        if (value == null) {
            return;
        }
        if (value.token.isEgld()) {
            preparedCall.egldValue = value;
            return;
        }
        if (value.token.isFungible()) {
            preparedCall.wrap(
                this.builtinFunctions.format.ESDTTransfer(
                    value.token.getTokenIdentifier(),
                    value.valueOf(),
                    preparedCall.formattedCall
                )
            );
        } else {
            preparedCall.receiver = this.context.getSender().address;
            preparedCall.wrap(
                this.builtinFunctions.format.ESDTNFTTransfer(
                    value.token.getTokenIdentifier(),
                    value.getNonce(),
                    value.valueOf(),
                    this.smartContract,
                    preparedCall.formattedCall
                )
            );
        }
    }
}


function filterByExtension(fileList: string[], extension: string): string[] {
    return fileList.filter(name => name.endsWith(extension));
}

function filterByFilename(fileList: string[], filename: string): string[] {
    return fileList.filter(name => name == filename);
}

// Compiling creates a temporary file which sometimes doesn't get deleted. It should be ignored.
function ignoreTemporaryWasmFiles(fileList: string[]) {
    let temporaryWasmFiles = filterByExtension(fileList, "_wasm.wasm");
    let difference = fileList.filter(file => temporaryWasmFiles.indexOf(file) === -1);
    return difference;
}

function filterWithHint(fileList: string[], extension: string, filenameHint?: string): { pattern: string, filteredFileList: string[] } {
    if (filenameHint) {
        let pattern = filenameHint + extension;
        return {
            pattern,
            filteredFileList: filterByFilename(fileList, pattern)
        };
    }
    return {
        pattern: "*" + extension,
        filteredFileList: filterByExtension(fileList, extension)
    };
}

function getFileByExtension(fileList: string[], folderPath: string, extension: string, filenameHint?: string): string {
    let { pattern, filteredFileList } = filterWithHint(fileList, extension, filenameHint);
    if (filteredFileList.length != 1) {
        throw new ErrInvalidArgument(`Expected a single ${pattern} file in ${folderPath} (found ${filteredFileList.length})`);
    }
    return path.join(folderPath, filteredFileList[0]);
}

async function getAbiAndWasmPaths(outputPath: string, filenameHint?: string) {
    let filesInOutput = await fs.promises.readdir(outputPath);
    filesInOutput = ignoreTemporaryWasmFiles(filesInOutput);

    let abiPath = getFileByExtension(filesInOutput, outputPath, ".abi.json", filenameHint);
    let wasmPath: string | null;
    try {
        wasmPath = getFileByExtension(filesInOutput, outputPath, ".wasm", filenameHint);
    } catch (_) {
        wasmPath = null;
    }
    return { abiPath, wasmPath };
}

async function expandProjectPath(projectPath: string, filenameHint?: string): Promise<{ abiPath: string, wasmPath: string | null }> {
    projectPath = path.resolve(projectPath);
    try {
        return await getAbiAndWasmPaths(projectPath, filenameHint);
    }
    catch (_) {
        let outputPath = path.join(projectPath, "output");
        return await getAbiAndWasmPaths(outputPath, filenameHint);
    }
}
