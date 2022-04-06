import { IBech32Address, IHash, IProvider } from "../interface";
import { Transaction, TransactionHash } from "../transaction";
import { NetworkConfig } from "../networkProvider/networkConfig";
import { Address } from "../address";
import { Nonce } from "../nonce";
import { AsyncTimer } from "../asyncTimer";
import { Balance } from "../balance";
import * as errors from "../errors";
import { Query } from "../smartcontracts/query";
import { ContractQueryResponse } from "../networkProvider/contractQueryResponse";
import { TypedEvent } from "../events";
import { BalanceBuilder } from "../balanceBuilder";
import BigNumber from "bignumber.js";
import { ContractResultItem, ContractResults } from "../networkProvider/contractResults";
import { TransactionOnNetwork } from "../networkProvider/transactions";
import { INetworkConfig, ITransactionOnNetwork, ITransactionStatus } from "../interfaceOfNetwork";
import { TransactionStatus } from "../networkProvider/transactionStatus";
import { AccountOnNetwork } from "../networkProvider/accounts";
import { NetworkStatus } from "../networkProvider/networkStatus";

const DummyHyperblockNonce = 42;
const DummyHyperblockHash = "a".repeat(32);

/**
 * A mock {@link IProvider}, used for tests only.
 */
export class MockProvider implements IProvider {
    static AddressOfAlice = new Address("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
    static AddressOfBob = new Address("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx");
    static AddressOfCarol = new Address("erd1k2s324ww2g0yj38qn2ch2jwctdy8mnfxep94q9arncc6xecg3xaq6mjse8");

    private readonly transactions: Map<string, TransactionOnNetwork>;
    private readonly onTransactionSent: TypedEvent<{ transaction: Transaction }>;
    private readonly accounts: Map<string, AccountOnNetwork>;
    private readonly queryContractResponders: QueryContractResponder[] = [];
    private readonly getTransactionResponders: GetTransactionResponder[] = [];

    constructor() {
        this.transactions = new Map<string, TransactionOnNetwork>();
        this.onTransactionSent = new TypedEvent();
        this.accounts = new Map<string, AccountOnNetwork>();

        this.accounts.set(
            MockProvider.AddressOfAlice.bech32(),
            new AccountOnNetwork({ nonce: new Nonce(0), balance: Balance.egld(1000) })
        );
        this.accounts.set(
            MockProvider.AddressOfBob.bech32(),
            new AccountOnNetwork({ nonce: new Nonce(5), balance: Balance.egld(500) })
        );
        this.accounts.set(
            MockProvider.AddressOfCarol.bech32(),
            new AccountOnNetwork({ nonce: new Nonce(42), balance: Balance.egld(300) })
        );
    }

    getAccountEsdtBalance(_address: Address, _tokenBalanceBuilder: BalanceBuilder): Promise<Balance> {
        throw new Error("Method not implemented.");
    }

    doPostGeneric(_resourceUrl: string, _payload: any, _callback: (response: any) => any): Promise<any> {
        throw new Error("Method not implemented.");
    }

    doGetGeneric(_resourceUrl: string, _callback: (response: any) => any): Promise<any> {
        throw new Error("Method not implemented.");
    }

    mockUpdateAccount(address: Address, mutate: (item: AccountOnNetwork) => void) {
        let account = this.accounts.get(address.bech32());
        if (account) {
            mutate(account);
        }
    }

    mockUpdateTransaction(hash: TransactionHash, mutate: (item: TransactionOnNetwork) => void) {
        let transaction = this.transactions.get(hash.toString());
        if (transaction) {
            mutate(transaction);
        }
    }

    mockPutTransaction(hash: TransactionHash, item: TransactionOnNetwork) {
        this.transactions.set(hash.toString(), item);
    }

    mockQueryContractOnFunction(functionName: string, response: ContractQueryResponse) {
        let predicate = (query: Query) => query.func.name == functionName;
        this.queryContractResponders.push(new QueryContractResponder(predicate, response));
    }

    mockGetTransactionWithAnyHashAsNotarizedWithOneResult(returnCodeAndData: string) {
        let contractResult = new ContractResultItem({ nonce: new Nonce(1), data: returnCodeAndData });

        let predicate = (_hash: IHash) => true;
        let response = new TransactionOnNetwork({
            status: new TransactionStatus("executed"),
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
            if (point instanceof TransactionStatus) {
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

    async getAccount(address: IBech32Address): Promise<AccountOnNetwork> {
        let account = this.accounts.get(address.bech32());
        if (account) {
            return account;
        }

        return new AccountOnNetwork();
    }

    async getAddressEsdt(_address: IBech32Address, _tokenIdentifier: string): Promise<any> {
        return {};
    }

    async getAddressEsdtList(_address: IBech32Address): Promise<any> {
        return {};
    }

    async getAddressNft(_address: IBech32Address, _tokenIdentifier: string, _nonce: BigNumber): Promise<any> {
        return {};
    }

    async sendTransaction(transaction: Transaction): Promise<TransactionHash> {
        this.mockPutTransaction(
            transaction.getHash(),
            new TransactionOnNetwork({
                nonce: transaction.getNonce(),
                sender: transaction.getSender(),
                receiver: transaction.getReceiver(),
                data: transaction.getData(),
                status: new TransactionStatus("pending"),
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
        return new NetworkConfig();
    }

    async getNetworkStatus(): Promise<NetworkStatus> {
        return new NetworkStatus();
    }

    async queryContract(query: Query): Promise<ContractQueryResponse> {
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
    readonly response: ContractQueryResponse;

    constructor(matches: (query: Query) => boolean, response: ContractQueryResponse) {
        this.matches = matches;
        this.response = response;
    }
}

class GetTransactionResponder {
    readonly matches: (hash: IHash) => boolean;
    readonly response: TransactionOnNetwork;

    constructor(matches: (hash: IHash) => boolean, response: TransactionOnNetwork) {
        this.matches = matches;
        this.response = response;
    }
}
