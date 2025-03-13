import { Address } from "../core/address";
import { AsyncTimer } from "../core/asyncTimer";
import * as errors from "../core/errors";
import { ErrMock } from "../core/errors";
import { SmartContractQuery, SmartContractQueryResponse } from "../core/smartContractQuery";
import { Token } from "../core/tokens";
import { Transaction } from "../core/transaction";
import { TransactionComputer } from "../core/transactionComputer";
import { TransactionOnNetwork } from "../core/transactionOnNetwork";
import { TransactionStatus } from "../core/transactionStatus";
import {
    AccountOnNetwork,
    AccountStorage,
    AccountStorageEntry,
    DefinitionOfFungibleTokenOnNetwork,
    DefinitionOfTokenCollectionOnNetwork,
    NetworkConfig,
    NetworkStatus,
} from "../networkProviders";
import { BlockOnNetwork } from "../networkProviders/blocks";
import { INetworkProvider, IPagination } from "../networkProviders/interface";
import { AwaitingOptions, TransactionCostResponse } from "../networkProviders/resources";
import { TokenAmountOnNetwork } from "../networkProviders/tokens";
import { SmartContractResult } from "../transactionsOutcomeParsers";
import { createAccountBalance } from "./utils";

export class MockNetworkProvider implements INetworkProvider {
    static AddressOfAlice = new Address("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
    static AddressOfBob = new Address("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx");
    static AddressOfCarol = new Address("erd1k2s324ww2g0yj38qn2ch2jwctdy8mnfxep94q9arncc6xecg3xaq6mjse8");

    private readonly transactions: Map<string, TransactionOnNetwork>;
    private nextTransactionTimelinePoints: any[] = [];
    private readonly accounts: Map<string, AccountOnNetwork>;
    private readonly queryContractResponders: QueryContractResponder[] = [];
    private readonly getTransactionResponders: GetTransactionResponder[] = [];

    constructor() {
        this.transactions = new Map<string, TransactionOnNetwork>();
        this.accounts = new Map<string, AccountOnNetwork>();

        this.accounts.set(
            MockNetworkProvider.AddressOfAlice.toBech32(),
            new AccountOnNetwork({
                nonce: 0n,
                balance: createAccountBalance(1000),
            }),
        );
        this.accounts.set(
            MockNetworkProvider.AddressOfBob.toBech32(),
            new AccountOnNetwork({ nonce: 5n, balance: createAccountBalance(500) }),
        );
        this.accounts.set(
            MockNetworkProvider.AddressOfCarol.toBech32(),
            new AccountOnNetwork({
                nonce: 42n,
                balance: createAccountBalance(300),
            }),
        );
    }
    getBlock(): Promise<BlockOnNetwork> {
        throw new Error("Method not implemented.");
    }
    getLatestBlock(_shard: number): Promise<BlockOnNetwork> {
        throw new Error("Method not implemented.");
    }
    getAccountStorage(_address: Address): Promise<AccountStorage> {
        throw new Error("Method not implemented.");
    }
    getAccountStorageEntry(_address: Address, _entryKey: string): Promise<AccountStorageEntry> {
        throw new Error("Method not implemented.");
    }
    awaitAccountOnCondition(
        _address: Address,
        _condition: (account: AccountOnNetwork) => boolean,
        _options?: AwaitingOptions,
    ): Promise<AccountOnNetwork> {
        throw new Error("Method not implemented.");
    }
    estimateTransactionCost(_tx: Transaction): Promise<TransactionCostResponse> {
        throw new Error("Method not implemented.");
    }
    awaitTransactionOnCondition(
        _transactionHash: string,
        _condition: (account: TransactionOnNetwork) => boolean,
        _options?: AwaitingOptions,
    ): Promise<TransactionOnNetwork> {
        throw new Error("Method not implemented.");
    }
    awaitTransactionCompleted(_transactionHash: string, _options?: AwaitingOptions): Promise<TransactionOnNetwork> {
        throw new Error("Method not implemented.");
    }
    getTokenOfAccount(_address: Address, _token: Token): Promise<TokenAmountOnNetwork> {
        throw new Error("Method not implemented.");
    }
    getNetworkStatus(): Promise<NetworkStatus> {
        throw new Error("Method not implemented.");
    }

    getFungibleTokensOfAccount(_address: Address, _pagination?: IPagination): Promise<TokenAmountOnNetwork[]> {
        throw new Error("Method not implemented.");
    }
    getNonFungibleTokensOfAccount(_address: Address, _pagination?: IPagination): Promise<TokenAmountOnNetwork[]> {
        throw new Error("Method not implemented.");
    }
    sendTransactions(_txs: Transaction[]): Promise<[number, string[]]> {
        throw new Error("Method not implemented.");
    }
    getDefinitionOfFungibleToken(_tokenIdentifier: string): Promise<DefinitionOfFungibleTokenOnNetwork> {
        throw new Error("Method not implemented.");
    }
    getDefinitionOfTokenCollection(_collection: string): Promise<DefinitionOfTokenCollectionOnNetwork> {
        throw new Error("Method not implemented.");
    }
    doGetGeneric(_resourceUrl: string): Promise<any> {
        throw new Error("Method not implemented.");
    }
    doPostGeneric(_resourceUrl: string, _payload: any): Promise<any> {
        throw new Error("Method not implemented.");
    }

    mockUpdateAccount(address: Address, mutate: (item: AccountOnNetwork) => void) {
        let account = this.accounts.get(address.toBech32());
        if (account) {
            mutate(account);
        }
    }

    mockUpdateTransaction(hash: string, mutate: (item: TransactionOnNetwork) => void) {
        let transaction = this.transactions.get(hash);
        if (transaction) {
            mutate(transaction);
        }
    }

    mockPutTransaction(hash: string, item: TransactionOnNetwork) {
        item.status = TransactionStatus.createUnknown();
        this.transactions.set(hash, item);
    }

    mockQueryContractOnFunction(functionName: string, response: SmartContractQueryResponse) {
        let predicate = (query: SmartContractQuery) => query.function.toString() == functionName;
        this.queryContractResponders.push(new QueryContractResponder(predicate, response));
    }

    mockGetTransactionWithAnyHashAsNotarizedWithOneResult(returnCodeAndData: string, functionName: string = "") {
        let contractResult = new SmartContractResult({ data: Buffer.from(returnCodeAndData) });

        let predicate = (_hash: string) => true;
        let response = new TransactionOnNetwork({
            status: new TransactionStatus("executed"),
            smartContractResults: [contractResult],
            function: functionName,
        });

        this.getTransactionResponders.unshift(new GetTransactionResponder(predicate, response));
    }

    mockAccountBalanceTimelineByAddress(address: Address, timelinePoints: Array<MarkCompleted | Wait>): void {
        const executeTimeline = async () => {
            for (const point of timelinePoints) {
                if (point instanceof MarkCompleted) {
                    // Mark account condition as reached
                    this.mockUpdateAccount(address, (account) => {
                        account.balance += createAccountBalance(7);
                    });
                } else if (point instanceof Wait) {
                    // Wait for the specified time
                    await this.sleep(point.milliseconds);
                }
            }
        };

        // Start the timeline execution in a separate async "thread"
        executeTimeline().catch((err) => {
            console.error("Error executing timeline:", err);
        });
    }

    async mockTransactionTimeline(transaction: Transaction, timelinePoints: any[]): Promise<void> {
        const computer = new TransactionComputer();
        return this.mockTransactionTimelineByHash(computer.computeTransactionHash(transaction), timelinePoints);
    }

    async mockNextTransactionTimeline(timelinePoints: any[]): Promise<void> {
        this.nextTransactionTimelinePoints = timelinePoints;
    }

    async mockTransactionTimelineByHash(hash: string, timelinePoints: any[]): Promise<void> {
        let timeline = new AsyncTimer(`mock timeline of ${hash}`);

        await timeline.start(0);

        for (const point of timelinePoints) {
            if (point instanceof TransactionStatus) {
                this.mockUpdateTransaction(hash, (transaction) => {
                    transaction.status = point;
                });
            } else if (point instanceof MarkCompleted) {
                this.mockUpdateTransaction(hash, (transaction) => {
                    transaction.status = new TransactionStatus("success");
                });
            } else if (point instanceof Wait) {
                await timeline.start(point.milliseconds);
            }
        }
    }

    private sleep(milliseconds: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, milliseconds));
    }

    async getAccount(address: Address): Promise<AccountOnNetwork> {
        let account = this.accounts.get(address.toBech32());
        if (account) {
            return account;
        }

        throw new ErrMock("Account not found");
    }

    async sendTransaction(transaction: Transaction): Promise<string> {
        const computer = new TransactionComputer();
        this.mockPutTransaction(
            computer.computeTransactionHash(transaction),
            new TransactionOnNetwork({
                sender: transaction.sender,
                receiver: transaction.receiver,
                data: Buffer.from(transaction.data),
                status: new TransactionStatus("pending"),
            }),
        );

        this.mockTransactionTimeline(transaction, this.nextTransactionTimelinePoints);
        return computer.computeTransactionHash(transaction);
    }

    async simulateTransaction(_transaction: Transaction): Promise<any> {
        return {};
    }

    async getTransaction(txHash: string): Promise<TransactionOnNetwork> {
        // At first, try to use a mock responder
        for (const responder of this.getTransactionResponders) {
            if (responder.matches(txHash)) {
                return responder.response;
            }
        }

        // Then, try to use the local collection of transactions
        let transaction = this.transactions.get(txHash.toString());
        if (transaction) {
            return transaction;
        }

        throw new ErrMock("Transaction not found");
    }

    async getTransactionStatus(txHash: string): Promise<TransactionStatus> {
        let transaction = await this.getTransaction(txHash);
        return transaction.status;
    }

    async getNetworkConfig(): Promise<NetworkConfig> {
        throw new errors.ErrNotImplemented();
    }

    async queryContract(query: SmartContractQuery): Promise<SmartContractQueryResponse> {
        for (const responder of this.queryContractResponders) {
            if (responder.matches(query)) {
                return responder.response;
            }
        }

        throw new ErrMock("No query response to return");
    }
}

export class Wait {
    readonly milliseconds: number;

    constructor(milliseconds: number) {
        this.milliseconds = milliseconds;
    }
}

export class MarkCompleted {}

class QueryContractResponder {
    readonly matches: (query: SmartContractQuery) => boolean;
    readonly response: SmartContractQueryResponse;

    constructor(matches: (query: SmartContractQuery) => boolean, response: SmartContractQueryResponse) {
        this.matches = matches;
        this.response = response;
    }
}

class GetTransactionResponder {
    readonly matches: (hash: string) => boolean;
    readonly response: TransactionOnNetwork;

    constructor(matches: (hash: string) => boolean, response: TransactionOnNetwork) {
        this.matches = matches;
        this.response = response;
    }
}
