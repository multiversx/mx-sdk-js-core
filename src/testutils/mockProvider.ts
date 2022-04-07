import { IBech32Address, IHash } from "../interface";
import { Transaction, TransactionHash } from "../transaction";
import { Address } from "../address";
import { Nonce } from "../nonce";
import { AsyncTimer } from "../asyncTimer";
import { Balance } from "../balance";
import * as errors from "../errors";
import { Query } from "../smartcontracts/query";
import { TypedEvent } from "../events";
import { BalanceBuilder } from "../balanceBuilder";
import BigNumber from "bignumber.js";
import { IAccountOnNetwork, IContractQueryResponse, INetworkConfig, ITransactionOnNetwork, ITransactionStatus } from "../interfaceOfNetwork";
import { MockAccountOnNetwork, MockTransactionStatus } from "./networkProviders";
import { ErrMock } from "../errors";

const DummyHyperblockNonce = 42;
const DummyHyperblockHash = "a".repeat(32);

export class MockProvider {
    static AddressOfAlice = new Address("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
    static AddressOfBob = new Address("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx");
    static AddressOfCarol = new Address("erd1k2s324ww2g0yj38qn2ch2jwctdy8mnfxep94q9arncc6xecg3xaq6mjse8");

    private readonly transactions: Map<string, ITransactionOnNetwork>;
    private readonly onTransactionSent: TypedEvent<{ transaction: Transaction }>;
    private readonly accounts: Map<string, IAccountOnNetwork>;
    private readonly queryContractResponders: QueryContractResponder[] = [];
    private readonly getTransactionResponders: GetTransactionResponder[] = [];

    constructor() {
        this.transactions = new Map<string, ITransactionOnNetwork>();
        this.onTransactionSent = new TypedEvent();
        this.accounts = new Map<string, IAccountOnNetwork>();

        this.accounts.set(
            MockProvider.AddressOfAlice.bech32(),
            new MockAccountOnNetwork({ nonce: new Nonce(0), balance: Balance.egld(1000) })
        );
        this.accounts.set(
            MockProvider.AddressOfBob.bech32(),
            new MockAccountOnNetwork({ nonce: new Nonce(5), balance: Balance.egld(500) })
        );
        this.accounts.set(
            MockProvider.AddressOfCarol.bech32(),
            new MockAccountOnNetwork({ nonce: new Nonce(42), balance: Balance.egld(300) })
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
        let contractResult = new ContractResultItem({ nonce: new Nonce(1), data: returnCodeAndData });

        let predicate = (_hash: IHash) => true;
        let response = new TransactionOnNetwork({
            status: new MockTransactionStatus("executed"),
            hyperblockNonce: DummyHyperblockNonce,
            hyperblockHash: DummyHyperblockHash,
            contractResults: new ContractResults([contractResult])
        });

        this.getTransactionResponders.unshift(new GetTransactionResponder(predicate, response));
    }

    async mockTransactionTimeline(transaction: Transaction, timelinePoints: any[]): Promise<void> {
        await transaction.awaitHashed();
        return this.mockTransactionTimelineByHash(transaction.getHash(), timelinePoints);
    }

    async mockNextTransactionTimeline(timelinePoints: any[]): Promise<void> {
        let transaction = await this.nextTransactionSent();
        return this.mockTransactionTimelineByHash(transaction.getHash(), timelinePoints);
    }

    private async nextTransactionSent(): Promise<Transaction> {
        return new Promise<Transaction>((resolve, _reject) => {
            this.onTransactionSent.on((eventArgs) => resolve(eventArgs.transaction));
        });
    }

    async mockTransactionTimelineByHash(hash: TransactionHash, timelinePoints: any[]): Promise<void> {
        let timeline = new AsyncTimer(`mock timeline of ${hash}`);

        await timeline.start(0);

        for (const point of timelinePoints) {
            if (point instanceof MockTransactionStatus) {
                this.mockUpdateTransaction(hash, (transaction) => {
                    transaction.status = point;
                });
            } else if (point instanceof InHyperblock) {
                this.mockUpdateTransaction(hash, (transaction) => {
                    transaction.hyperblockNonce = DummyHyperblockNonce;
                    transaction.hyperblockHash = DummyHyperblockHash;
                });
            } else if (point instanceof Wait) {
                await timeline.start(point.milliseconds);
            }
        }
    }

    async getAccount(address: IBech32Address): Promise<IAccountOnNetwork> {
        let account = this.accounts.get(address.bech32());
        if (account) {
            return account;
        }

        throw new ErrMock("account does not exist")
    }

    async sendTransaction(transaction: Transaction): Promise<TransactionHash> {
        this.mockPutTransaction(
            transaction.getHash(),
            new TransactionOnNetwork({
                nonce: transaction.getNonce(),
                sender: transaction.getSender(),
                receiver: transaction.getReceiver(),
                data: transaction.getData(),
                status: new MockTransactionStatus("pending"),
            })
        );

        this.onTransactionSent.emit({ transaction: transaction });

        return transaction.getHash();
    }

    async simulateTransaction(_transaction: Transaction): Promise<any> {
        return {};
    }

    async getTransaction(
        txHash: IHash,
        _hintSender?: IBech32Address,
        _withResults?: boolean
    ): Promise<ITransactionOnNetwork> {
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

        throw new errors.ErrMock("Transaction not found");
    }

    async getTransactionStatus(txHash: TransactionHash): Promise<ITransactionStatus> {
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

        return new ContractQueryResponse();
    }
}

export class Wait {
    readonly milliseconds: number;

    constructor(milliseconds: number) {
        this.milliseconds = milliseconds;
    }
}

export class InHyperblock { }

class QueryContractResponder {
    readonly matches: (query: Query) => boolean;
    readonly response: IContractQueryResponse;

    constructor(matches: (query: Query) => boolean, response: IContractQueryResponse) {
        this.matches = matches;
        this.response = response;
    }
}

class GetTransactionResponder {
    readonly matches: (hash: IHash) => boolean;
    readonly response: ITransactionOnNetwork;

    constructor(matches: (hash: IHash) => boolean, response: ITransactionOnNetwork) {
        this.matches = matches;
        this.response = response;
    }
}
