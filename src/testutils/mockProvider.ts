import { AccountOnNetwork, ContractResultItem, ContractResults, TransactionOnNetwork, TransactionStatus } from "@multiversx/sdk-network-providers";
import { Address } from "../address";
import { AsyncTimer } from "../asyncTimer";
import * as errors from "../errors";
import { ErrMock } from "../errors";
import { IAddress } from "../interface";
import { IAccountOnNetwork, IContractQueryResponse, INetworkConfig, ITransactionOnNetwork, ITransactionStatus } from "../interfaceOfNetwork";
import { Query } from "../smartcontracts/query";
import { Transaction, TransactionHash } from "../transaction";
import { createAccountBalance } from "./utils";

export class MockProvider {
    static AddressOfAlice = new Address("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
    static AddressOfBob = new Address("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx");
    static AddressOfCarol = new Address("erd1k2s324ww2g0yj38qn2ch2jwctdy8mnfxep94q9arncc6xecg3xaq6mjse8");

    private readonly transactions: Map<string, ITransactionOnNetwork>;
    private nextTransactionTimelinePoints: any[] = [];
    private readonly accounts: Map<string, IAccountOnNetwork>;
    private readonly queryContractResponders: QueryContractResponder[] = [];
    private readonly getTransactionResponders: GetTransactionResponder[] = [];

    constructor() {
        this.transactions = new Map<string, ITransactionOnNetwork>();
        this.accounts = new Map<string, IAccountOnNetwork>();

        this.accounts.set(
            MockProvider.AddressOfAlice.bech32(),
            new AccountOnNetwork({ nonce: 0, balance: createAccountBalance(1000) })
        );
        this.accounts.set(
            MockProvider.AddressOfBob.bech32(),
            new AccountOnNetwork({ nonce: 5, balance: createAccountBalance(500) })
        );
        this.accounts.set(
            MockProvider.AddressOfCarol.bech32(),
            new AccountOnNetwork({ nonce: 42, balance: createAccountBalance(300) })
        );
    }

    mockUpdateAccount(address: Address, mutate: (item: IAccountOnNetwork) => void) {
        let account = this.accounts.get(address.bech32());
        if (account) {
            mutate(account);
        }
    }

    mockUpdateTransaction(hash: TransactionHash, mutate: (item: ITransactionOnNetwork) => void) {
        let transaction = this.transactions.get(hash.toString());
        if (transaction) {
            mutate(transaction);
        }
    }

    mockPutTransaction(hash: TransactionHash, item: ITransactionOnNetwork) {
        this.transactions.set(hash.toString(), item);
    }

    mockQueryContractOnFunction(functionName: string, response: IContractQueryResponse) {
        let predicate = (query: Query) => query.func.name == functionName;
        this.queryContractResponders.push(new QueryContractResponder(predicate, response));
    }

    mockGetTransactionWithAnyHashAsNotarizedWithOneResult(returnCodeAndData: string) {
        let contractResult = new ContractResultItem({ nonce: 1, data: returnCodeAndData });

        let predicate = (_hash: string) => true;
        let response = new TransactionOnNetwork({
            status: new TransactionStatus("executed"),
            contractResults: new ContractResults([contractResult]),
            isCompleted: true
        });

        this.getTransactionResponders.unshift(new GetTransactionResponder(predicate, response));
    }

    async mockTransactionTimeline(transaction: Transaction, timelinePoints: any[]): Promise<void> {
        return this.mockTransactionTimelineByHash(transaction.getHash(), timelinePoints);
    }

    async mockNextTransactionTimeline(timelinePoints: any[]): Promise<void> {
        this.nextTransactionTimelinePoints = timelinePoints;
    }

    async mockTransactionTimelineByHash(hash: TransactionHash, timelinePoints: any[]): Promise<void> {
        let timeline = new AsyncTimer(`mock timeline of ${hash}`);

        await timeline.start(0);

        for (const point of timelinePoints) {
            if (point instanceof TransactionStatus) {
                this.mockUpdateTransaction(hash, (transaction) => {
                    transaction.status = point;
                });
            } else if (point instanceof MarkCompleted) {
                this.mockUpdateTransaction(hash, (transaction) => {
                    transaction.isCompleted = true;
                });
            } else if (point instanceof Wait) {
                await timeline.start(point.milliseconds);
            }
        }
    }

    async getAccount(address: IAddress): Promise<IAccountOnNetwork> {
        let account = this.accounts.get(address.bech32());
        if (account) {
            return account;
        }

        throw new ErrMock("Account not found")
    }

    async sendTransaction(transaction: Transaction): Promise<string> {
        this.mockPutTransaction(
            transaction.getHash(),
            new TransactionOnNetwork({
                sender: transaction.getSender(),
                receiver: transaction.getReceiver(),
                data: transaction.getData().valueOf(),
                status: new TransactionStatus("pending"),
            })
        );

        this.mockTransactionTimeline(transaction, this.nextTransactionTimelinePoints);
        return transaction.getHash().hex();
    }

    async simulateTransaction(_transaction: Transaction): Promise<any> {
        return {};
    }

    async getTransaction(txHash: string): Promise<ITransactionOnNetwork> {
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

    async getTransactionStatus(txHash: string): Promise<ITransactionStatus> {
        let transaction = await this.getTransaction(txHash);
        return transaction.status;
    }

    async getNetworkConfig(): Promise<INetworkConfig> {
        throw new errors.ErrNotImplemented();
    }

    async queryContract(query: Query): Promise<IContractQueryResponse> {
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

export class MarkCompleted { }

class QueryContractResponder {
    readonly matches: (query: Query) => boolean;
    readonly response: IContractQueryResponse;

    constructor(matches: (query: Query) => boolean, response: IContractQueryResponse) {
        this.matches = matches;
        this.response = response;
    }
}

class GetTransactionResponder {
    readonly matches: (hash: string) => boolean;
    readonly response: ITransactionOnNetwork;

    constructor(matches: (hash: string) => boolean, response: ITransactionOnNetwork) {
        this.matches = matches;
        this.response = response;
    }
}
