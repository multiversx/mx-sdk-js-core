import { Address } from "../address";
import { TRANSACTION_OPTIONS_DEFAULT, TRANSACTION_VERSION_DEFAULT } from "../constants";
import { IAddress, IChainID, IGasLimit, IGasPrice, INonce, ITokenTransfer, ITransactionPayload, ITransactionValue } from "../interface";
import { TransactionOptions, TransactionVersion } from "../networkParams";
import { Transaction } from "../transaction";
import { CodeMetadata } from "./codeMetadata";
import { ICode, ICodeMetadata } from "./interface";
import { ContractDeployPayloadBuilder } from "./transactionPayloadBuilders";
import { AddressValue, BigUIntValue, BytesValue, TypedValue, U64Value, U8Value } from "./typesystem";

interface ISmartContractTransactionsFactoryOptions {
    config: IConfig;
    abiJson?: any
}

interface IConfig {
    chainID: IChainID;
    minGasPrice: IGasPrice;
    minGasLimit: IGasLimit;
    gasLimitPerByte: IGasLimit;
}

export class SmartContractTransactionsFactoryConfig implements IConfig {
    chainID: IChainID;
    minGasPrice: IGasPrice = 1000000000;
    minGasLimit = 50000;
    gasLimitPerByte = 1500;

    constructor(chainID: IChainID) {
        this.chainID = chainID;
    }
}

interface IBaseArgs {
    transactionNonce?: INonce;
    value?: ITransactionValue;
    gasPrice?: IGasPrice;
    gasLimit: IGasLimit;
}

export interface IDeployArgs extends IBaseArgs {
    deployer: IAddress;
    code: ICode;
    codeMetadata?: ICodeMetadata;
    initArguments?: TypedValue[];
}

export class SmartContractTransactionsFactory {
    private readonly config: IConfig;
    private readonly abiJson?: any;

    constructor(options: ISmartContractTransactionsFactoryOptions) {
        this.config = options.config;
        this.abiJson = options.abiJson;
    }

    // import { AbiRegistry } from "@multiversx/sdk-core";
    // import { promises } from "fs";

    // let jsonContent: string = await promises.readFile("myAbi.json", { encoding: "utf8" });
    // let json = JSON.parse(jsonContent);
    // let abiRegistry = AbiRegistry.create(json);
    // let abi = new SmartContractAbi(abiRegistry, ["MyContract"]);
    // ...
    // let contract = new SmartContract({ address: new Address("erd1..."), abi: abi });

    deploy(args: IDeployArgs): Transaction {
        const code = args.code;
        const codeMetadata = args.codeMetadata || new CodeMetadata();
        const initArguments = args.initArguments || [];
        const value = args.value || 0;

        // todo handle args using ABI?

        let payload = new ContractDeployPayloadBuilder()
            .setCode(code)
            .setCodeMetadata(codeMetadata)
            .setInitArgs(initArguments)
            .build();

        const transaction = this.createTransaction({
            sender: args.deployer,
            receiver: Address.Zero(),
            value: value,
            nonce: args.transactionNonce,
            gasPrice: args.gasPrice,
            gasLimit: args.gasLimit,
            payload: payload
        });

        return transaction;
    }

    private createTransaction({ sender, receiver, nonce, value, gasPrice, gasLimit, payload }: {
        sender: IAddress;
        receiver: IAddress;
        nonce?: INonce;
        value?: ITransactionValue;
        gasPrice?: IGasPrice;
        gasLimit: IGasLimit;
        payload: ITransactionPayload;
    }): Transaction {
        const version = new TransactionVersion(TRANSACTION_VERSION_DEFAULT);
        const options = new TransactionOptions(TRANSACTION_OPTIONS_DEFAULT);

        return new Transaction({
            chainID: this.config.chainID,
            sender: sender,
            receiver: receiver,
            gasLimit: gasLimit,
            gasPrice: gasPrice,
            nonce: nonce || 0,
            value: value || 0,
            data: payload,
            version: version,
            options: options
        });
    }

    private hasAbi(): boolean {
        return this.abiJson !== undefined;
    }
}

interface ITokenTransfersWithExecuteOptions {
    contractAddress: IAddress;
    transfers: ITokenTransfer[];
    functionName: string;
    functionArgs: TypedValue[];
}

export class TokenTransfersWithExecute {
    private readonly contractAddress: IAddress;
    private readonly transfers: ITokenTransfer[];
    private readonly functionName: string;
    private readonly functionArgs: TypedValue[];

    constructor(options: ITokenTransfersWithExecuteOptions) {
        this.contractAddress = options.contractAddress;
        this.transfers = options.transfers;
        this.functionName = options.functionName;
        this.functionArgs = options.functionArgs;
    }

    buildArgsForSingleESDTTransfer(): TypedValue[] {
        let singleTransfer = this.transfers[0];

        return [
            this.getTypedTokenIdentifier(singleTransfer),
            this.getTypedTokenQuantity(singleTransfer),
            this.getTypedInteractionFunction(),
            ...this.functionArgs
        ];
    }

    buildArgsForSingleESDTNFTTransfer(): TypedValue[] {
        let singleTransfer = this.transfers[0];

        return [
            this.getTypedTokenIdentifier(singleTransfer),
            this.getTypedTokenNonce(singleTransfer),
            this.getTypedTokenQuantity(singleTransfer),
            this.getTypedTokensReceiver(),
            this.getTypedInteractionFunction(),
            ...this.functionArgs
        ];
    }

    buildArgsForMultiESDTNFTTransfer(): TypedValue[] {
        let result: TypedValue[] = [];

        result.push(this.getTypedTokensReceiver());
        result.push(this.getTypedNumberOfTransfers());

        for (const transfer of this.transfers) {
            result.push(this.getTypedTokenIdentifier(transfer));
            result.push(this.getTypedTokenNonce(transfer));
            result.push(this.getTypedTokenQuantity(transfer));
        }

        result.push(this.getTypedInteractionFunction());
        result.push(...this.functionArgs);

        return result;
    }

    private getTypedNumberOfTransfers(): TypedValue {
        return new U8Value(this.transfers.length);
    }

    private getTypedTokenIdentifier(transfer: ITokenTransfer): TypedValue {
        // Important: for NFTs, this has to be the "collection" name, actually.
        // We will reconsider adding the field "collection" on "Token" upon merging "ApiProvider" and "ProxyProvider".
        return BytesValue.fromUTF8(transfer.tokenIdentifier);
    }

    private getTypedTokenNonce(transfer: ITokenTransfer): TypedValue {
        // The token nonce (creation nonce)
        return new U64Value(transfer.nonce);
    }

    private getTypedTokenQuantity(transfer: ITokenTransfer): TypedValue {
        // For NFTs, this will be 1.
        return new BigUIntValue(transfer.amountAsBigInteger);
    }

    private getTypedTokensReceiver(): TypedValue {
        // The actual receiver of the token(s): the contract
        return new AddressValue(this.contractAddress);
    }

    private getTypedInteractionFunction(): TypedValue {
        return BytesValue.fromUTF8(this.functionName)
    }
}
