import { QueryRunnerAdapter } from "../adapters";
import { TransactionsConverter } from "../converters";
import { ProviderWrapper } from "../facades/providerWrapper";
import { IAddress } from "../interface";
import { ITransactionOnNetwork } from "../interfaceOfNetwork";
import { INetworkProvider } from "../networkProviders/interface";
import { IAbi, SmartContractQueriesController } from "../smartContractQueriesController";
import { TokenTransfer } from "../tokens";
import { Transaction } from "../transaction";
import { TransactionComputer } from "../transactionComputer";
import { SmartContractTransactionsFactory, TransactionsFactoryConfig } from "../transactionsFactories";
import { SmartContractTransactionsOutcomeParser } from "../transactionsOutcomeParsers";
import { TransactionWatcher } from "../transactionWatcher";
import { IAccount } from "./interfaces";

export class SmartContractController {
    private abi?: IAbi;
    private factory: SmartContractTransactionsFactory;
    private parser: SmartContractTransactionsOutcomeParser;
    private queryController: SmartContractQueriesController;
    private transactionWatcher: TransactionWatcher;
    private txComputer: TransactionComputer;

    constructor(chainId: string, networkProvider: INetworkProvider, abi?: IAbi) {
        this.abi = abi;
        this.factory = new SmartContractTransactionsFactory({
            config: new TransactionsFactoryConfig({ chainID: chainId }),
        });
        this.parser = new SmartContractTransactionsOutcomeParser();

        this.queryController = new SmartContractQueriesController({
            queryRunner: new QueryRunnerAdapter({ networkProvider }),
            abi: this.abi,
        });
        this.transactionWatcher = new TransactionWatcher(new ProviderWrapper(networkProvider));
        this.txComputer = new TransactionComputer();
    }

    createTransactionForDeploy(
        sender: IAccount,
        nonce: bigint,
        bytecode: Uint8Array,
        gasLimit: bigint,
        args: any[] = [],
        nativeTransferAmount: bigint = BigInt(0),
        isUpgradeable: boolean = true,
        isReadable: boolean = true,
        isPayable: boolean = false,
        isPayableBySc: boolean = true,
    ): Transaction {
        const transaction = this.factory.createTransactionForDeploy({
            sender: sender.address,
            bytecode,
            gasLimit: gasLimit,
            arguments: args,
            nativeTransferAmount,
            isUpgradeable,
            isReadable,
            isPayable,
            isPayableBySmartContract: isPayableBySc,
        });

        transaction.nonce = nonce;
        transaction.signature = sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    parseDeploy(transactionOnNetwork: ITransactionOnNetwork): SmartContractDeployOutcome {
        const txConverter = new TransactionsConverter();
        const txOutcome = txConverter.transactionOnNetworkToOutcome(transactionOnNetwork);
        return this.parser.parseDeploy({ transactionOutcome: txOutcome });
    }

    async awaitCompletedDeploy(txHash: string): Promise<SmartContractDeployOutcome> {
        const transaction = await this.transactionWatcher.awaitCompleted(txHash);
        return this.parseDeploy(transaction);
    }

    createTransactionForUpgrade(
        sender: IAccount,
        nonce: bigint,
        contract: IAddress,
        bytecode: Uint8Array,
        gasLimit: bigint,
        args: any[] = [],
        nativeTransferAmount: bigint = BigInt(0),
        isUpgradeable: boolean = true,
        isReadable: boolean = true,
        isPayable: boolean = false,
        isPayableBySc: boolean = true,
    ): Transaction {
        const transaction = this.factory.createTransactionForUpgrade({
            sender: sender.address,
            contract,
            bytecode,
            gasLimit,
            arguments: args,
            nativeTransferAmount,
            isUpgradeable,
            isReadable,
            isPayable,
            isPayableBySmartContract: isPayableBySc,
        });

        transaction.nonce = nonce;
        transaction.signature = sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    createTransactionForExecute(
        sender: IAccount,
        nonce: bigint,
        contract: IAddress,
        gasLimit: bigint,
        func: string,
        args: any[] = [],
        nativeTransferAmount: bigint = BigInt(0),
        tokenTransfers: TokenTransfer[] = [],
    ): Transaction {
        const transaction = this.factory.createTransactionForExecute({
            sender: sender.address,
            contract,
            gasLimit,
            function: func,
            arguments: args,
            nativeTransferAmount,
            tokenTransfers,
        });

        transaction.nonce = nonce;
        transaction.signature = sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    queryContract(contract: IAddress, func: string, args: any[], caller?: IAddress, value?: bigint): Promise<any[]> {
        return this.queryController.query({
            contract: contract.bech32(),
            function: func,
            arguments: args,
            caller: caller ? caller.bech32() : undefined,
            value: BigInt(value ?? 0),
        });
    }
}

interface SmartContractDeployOutcome {
    returnCode: string;
    returnMessage: string;
    contracts: DeployedSmartContract[];
}

class DeployedSmartContract {
    address: string;
    ownerAddress: string;
    codeHash: Uint8Array;

    constructor(address: string, ownerAddress: string, codeHash: Uint8Array) {
        this.address = address;
        this.ownerAddress = ownerAddress;
        this.codeHash = codeHash;
    }

    toString(): string {
        return `DeployedSmartContract(address=${this.address}, ownerAddress=${this.ownerAddress}, codeHash=${Buffer.from(this.codeHash).toString("hex")})`;
    }
}
