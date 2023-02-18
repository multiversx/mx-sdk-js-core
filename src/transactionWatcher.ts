import { AsyncTimer } from "./asyncTimer";
import { Err, ErrExpectedTransactionEventsNotFound, ErrExpectedTransactionStatusNotReached } from "./errors";
import { ITransactionFetcher } from "./interface";
import { ITransactionEvent, ITransactionOnNetwork, ITransactionStatus } from "./interfaceOfNetwork";
import { Logger } from "./logger";

export type PredicateIsAwaitedStatus = (status: ITransactionStatus) => boolean;

/**
 * Internal interface: a transaction, as seen from the perspective of a {@link TransactionWatcher}.
 */
interface ITransaction {
    getHash(): { hex(): string; }
}

/**
 * TransactionWatcher allows one to continuously watch (monitor), by means of polling, the status of a given transaction.
 */
export class TransactionWatcher {
    static DefaultPollingInterval: number = 6000;
    static DefaultTimeout: number = TransactionWatcher.DefaultPollingInterval * 15;
    static DefaultPatience: number = 1;

    static NoopOnStatusReceived = (_: ITransactionStatus) => { };

    protected readonly fetcher: ITransactionFetcher;
    protected readonly pollingInterval: number;
    protected readonly timeout: number;
    protected readonly patience: number;

    /**
     * 
     * @param fetcher The transaction fetcher
     * @param pollingInterval The polling interval, in milliseconds
     * @param timeout The timeout, in milliseconds
     * @param patience The patience: number of additional "polling intervals" to wait, after the transaction has reached its desired status. Currently there's a delay between the moment a transaction is marked as "completed" and the moment its outcome (contract results, events and logs) is available.
     */
    constructor(
        fetcher: ITransactionFetcher,
        pollingInterval: number = TransactionWatcher.DefaultPollingInterval,
        timeout: number = TransactionWatcher.DefaultTimeout,
        patience: number = TransactionWatcher.DefaultPatience
    ) {
        this.fetcher = new TransactionFetcherWithTracing(fetcher);
        this.pollingInterval = pollingInterval;
        this.timeout = timeout;
        this.patience = patience;
    }

    /**
     * Waits until the transaction reaches the "pending" status.
     */
    public async awaitPending(transaction: ITransaction): Promise<ITransactionOnNetwork> {
        const isPending = (transaction: ITransactionOnNetwork) => transaction.status.isPending();
        const doFetch = async () => await this.fetcher.getTransaction(transaction.getHash().hex());
        const errorProvider = () => new ErrExpectedTransactionStatusNotReached();

        return this.awaitConditionally<ITransactionOnNetwork>(
            isPending,
            doFetch,
            errorProvider
        );
    }

    /**
      * Waits until the transaction is completely processed.
      */
    public async awaitCompleted(transaction: ITransaction): Promise<ITransactionOnNetwork> {
        const isCompleted = (transactionOnNetwork: ITransactionOnNetwork) => transactionOnNetwork.isCompleted;
        const doFetch = async () => await this.fetcher.getTransaction(transaction.getHash().hex());
        const errorProvider = () => new ErrExpectedTransactionStatusNotReached();

        return this.awaitConditionally<ITransactionOnNetwork>(
            isCompleted,
            doFetch,
            errorProvider
        );
    }

    public async awaitAllEvents(transaction: ITransaction, events: string[]): Promise<ITransactionOnNetwork> {
        const foundAllEvents = (transactionOnNetwork: ITransactionOnNetwork) => {
            const allEventIdentifiers = this.getAllTransactionEvents(transactionOnNetwork).map(event => event.identifier);
            const allAreFound = events.every(event => allEventIdentifiers.includes(event));
            return allAreFound;
        };

        const doFetch = async () => await this.fetcher.getTransaction(transaction.getHash().hex());
        const errorProvider = () => new ErrExpectedTransactionEventsNotFound();

        return this.awaitConditionally<ITransactionOnNetwork>(
            foundAllEvents,
            doFetch,
            errorProvider
        );
    }

    public async awaitAnyEvent(transaction: ITransaction, events: string[]): Promise<ITransactionOnNetwork> {
        const foundAnyEvent = (transactionOnNetwork: ITransactionOnNetwork) => {
            const allEventIdentifiers = this.getAllTransactionEvents(transactionOnNetwork).map(event => event.identifier);
            const anyIsFound = events.find(event => allEventIdentifiers.includes(event)) != undefined;
            return anyIsFound;
        };

        const doFetch = async () => await this.fetcher.getTransaction(transaction.getHash().hex());
        const errorProvider = () => new ErrExpectedTransactionEventsNotFound();

        return this.awaitConditionally<ITransactionOnNetwork>(
            foundAnyEvent,
            doFetch,
            errorProvider
        );
    }

    public async awaitOnCondition(transaction: ITransaction, condition: (data: ITransactionOnNetwork) => boolean): Promise<ITransactionOnNetwork> {
        const doFetch = async () => await this.fetcher.getTransaction(transaction.getHash().hex());
        const errorProvider = () => new ErrExpectedTransactionStatusNotReached();

        return this.awaitConditionally<ITransactionOnNetwork>(
            condition,
            doFetch,
            errorProvider
        );
    }

    protected async awaitConditionally<TData>(
        isSatisfied: (data: TData) => boolean,
        doFetch: () => Promise<TData>,
        createError: () => Err
    ): Promise<TData> {
        const periodicTimer = new AsyncTimer("watcher:periodic");
        const patienceTimer = new AsyncTimer("watcher:patience");
        const timeoutTimer = new AsyncTimer("watcher:timeout");

        let stop = false;
        let fetchedData: TData | undefined = undefined;
        let satisfied: boolean = false;

        timeoutTimer.start(this.timeout).finally(() => {
            timeoutTimer.stop();
            stop = true;
        });

        while (!stop) {
            await periodicTimer.start(this.pollingInterval);

            try {
                fetchedData = await doFetch();
                satisfied = isSatisfied(fetchedData);
                if (satisfied || stop) {
                    break;
                }
            } catch (error) {
                Logger.debug("TransactionWatcher.awaitConditionally(): cannot (yet) fetch data.");

                if (!(error instanceof Err)) {
                    throw error;
                }
            }
        }

        // The patience timer isn't subject to the timeout constraints.
        if (satisfied) {
            await patienceTimer.start(this.pollingInterval * this.patience);
        }

        if (!timeoutTimer.isStopped()) {
            timeoutTimer.stop();
        }

        if (!fetchedData || !satisfied) {
            throw createError();
        }

        return fetchedData;
    }

    protected getAllTransactionEvents(transaction: ITransactionOnNetwork): ITransactionEvent[] {
        const result = [...transaction.logs.events];

        for (const resultItem of transaction.contractResults.items) {
            result.push(...resultItem.logs.events);
        }

        return result;
    }
}

class TransactionFetcherWithTracing implements ITransactionFetcher {
    private readonly fetcher: ITransactionFetcher;

    constructor(fetcher: ITransactionFetcher) {
        this.fetcher = fetcher;
    }

    async getTransaction(txHash: string): Promise<ITransactionOnNetwork> {
        Logger.debug(`transactionWatcher, getTransaction(${txHash})`);
        return await this.fetcher.getTransaction(txHash);
    }
}
