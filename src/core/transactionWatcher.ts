import { AsyncTimer } from "./asyncTimer";
import {
    Err,
    ErrExpectedTransactionEventsNotFound,
    ErrExpectedTransactionStatusNotReached,
    ErrIsCompletedFieldIsMissingOnTransaction,
} from "./errors";
import { ITransactionFetcher } from "./interfaces";
import { Logger } from "./logger";
import { TransactionEvent } from "./transactionEvents";
import { TransactionOnNetwork } from "./transactionOnNetwork";
import { TransactionStatus } from "./transactionStatus";

export type PredicateIsAwaitedStatus = (status: TransactionStatus) => boolean;

/**
 * TransactionWatcher allows one to continuously watch (monitor), by means of polling, the status of a given transaction.
 */
export class TransactionWatcher {
    private static DefaultPollingInterval: number = 6000;
    private static DefaultTimeout: number = TransactionWatcher.DefaultPollingInterval * 15;
    private static DefaultPatience: number = 0;

    static NoopOnStatusReceived = (_: TransactionStatus) => {};

    protected readonly fetcher: ITransactionFetcher;
    protected readonly pollingIntervalMilliseconds: number;
    protected readonly timeoutMilliseconds: number;
    protected readonly patienceMilliseconds: number;

    /**
     * A transaction watcher (awaiter).
     *
     * @param fetcher The transaction fetcher
     * @param options The options
     * @param options.pollingIntervalMilliseconds The polling interval, in milliseconds
     * @param options.timeoutMilliseconds The timeout, in milliseconds
     * @param options.patienceMilliseconds The patience: an extra time (in milliseconds) to wait, after the transaction has reached its desired status. Currently there's a delay between the moment a transaction is marked as "completed" and the moment its outcome (contract results, events and logs) is available.
     */
    constructor(
        fetcher: ITransactionFetcher,
        options: {
            pollingIntervalMilliseconds?: number;
            timeoutMilliseconds?: number;
            patienceMilliseconds?: number;
        } = {},
    ) {
        this.fetcher = new TransactionFetcherWithTracing(fetcher);
        this.pollingIntervalMilliseconds =
            options.pollingIntervalMilliseconds || TransactionWatcher.DefaultPollingInterval;
        this.timeoutMilliseconds = options.timeoutMilliseconds || TransactionWatcher.DefaultTimeout;
        this.patienceMilliseconds = options.patienceMilliseconds || TransactionWatcher.DefaultPatience;
    }

    /**
     * Waits until the transaction reaches the "pending" status.
     * @param txHash The hex-encoded transaction hash
     */
    public async awaitPending(txHash: string): Promise<TransactionOnNetwork> {
        const isPending = (transaction: TransactionOnNetwork) => transaction.status.isPending();
        const doFetch = async () => {
            return await this.fetcher.getTransaction(txHash);
        };
        const errorProvider = () => new ErrExpectedTransactionStatusNotReached();

        return this.awaitConditionally<TransactionOnNetwork>(isPending, doFetch, errorProvider);
    }

    /**
     * Waits until the transaction is completely processed.
     * @param txHash The transaction hash
     */
    public async awaitCompleted(txHash: string): Promise<TransactionOnNetwork> {
        const isCompleted = (transactionOnNetwork: TransactionOnNetwork) => {
            return transactionOnNetwork.status.isCompleted();
        };

        const doFetch = async () => {
            return await this.fetcher.getTransaction(txHash);
        };
        const errorProvider = () => new ErrExpectedTransactionStatusNotReached();

        return this.awaitConditionally<TransactionOnNetwork>(isCompleted, doFetch, errorProvider);
    }

    public async awaitAllEvents(txHash: string, events: string[]): Promise<TransactionOnNetwork> {
        const foundAllEvents = (transactionOnNetwork: TransactionOnNetwork) => {
            const allEventIdentifiers = this.getAllTransactionEvents(transactionOnNetwork).map(
                (event) => event.identifier,
            );
            const allAreFound = events.every((event) => allEventIdentifiers.includes(event));
            return allAreFound;
        };

        const doFetch = async () => {
            return await this.fetcher.getTransaction(txHash);
        };
        const errorProvider = () => new ErrExpectedTransactionEventsNotFound();

        return this.awaitConditionally<TransactionOnNetwork>(foundAllEvents, doFetch, errorProvider);
    }

    public async awaitAnyEvent(txHash: string, events: string[]): Promise<TransactionOnNetwork> {
        const foundAnyEvent = (transactionOnNetwork: TransactionOnNetwork) => {
            const allEventIdentifiers = this.getAllTransactionEvents(transactionOnNetwork).map(
                (event) => event.identifier,
            );
            const anyIsFound = events.find((event) => allEventIdentifiers.includes(event)) != undefined;
            return anyIsFound;
        };

        const doFetch = async () => {
            return await this.fetcher.getTransaction(txHash);
        };
        const errorProvider = () => new ErrExpectedTransactionEventsNotFound();

        return this.awaitConditionally<TransactionOnNetwork>(foundAnyEvent, doFetch, errorProvider);
    }

    public async awaitOnCondition(
        txHash: string,
        condition: (data: TransactionOnNetwork) => boolean,
    ): Promise<TransactionOnNetwork> {
        const doFetch = async () => {
            return await this.fetcher.getTransaction(txHash);
        };
        const errorProvider = () => new ErrExpectedTransactionStatusNotReached();

        return this.awaitConditionally<TransactionOnNetwork>(condition, doFetch, errorProvider);
    }

    protected async awaitConditionally<TData>(
        isSatisfied: (data: TData) => boolean,
        doFetch: () => Promise<TData>,
        createError: () => Err,
    ): Promise<TData> {
        const periodicTimer = new AsyncTimer("watcher:periodic");
        const patienceTimer = new AsyncTimer("watcher:patience");
        const timeoutTimer = new AsyncTimer("watcher:timeout");

        let stop = false;
        let fetchedData: TData | undefined = undefined;
        let satisfied: boolean = false;

        timeoutTimer.start(this.timeoutMilliseconds).finally(() => {
            timeoutTimer.stop();
            stop = true;
        });

        while (!stop) {
            await periodicTimer.start(this.pollingIntervalMilliseconds);

            try {
                fetchedData = await doFetch();
                satisfied = isSatisfied(fetchedData);
                if (satisfied || stop) {
                    break;
                }
            } catch (error) {
                Logger.debug("TransactionWatcher.awaitConditionally(): cannot (yet) fetch data.");

                if (error instanceof ErrIsCompletedFieldIsMissingOnTransaction) {
                    throw error;
                }

                if (!(error instanceof Err)) {
                    throw error;
                }
            }
        }

        // The patience timer isn't subject to the timeout constraints.
        if (satisfied) {
            await patienceTimer.start(this.patienceMilliseconds);
        }

        if (!timeoutTimer.isStopped()) {
            timeoutTimer.stop();
        }

        if (!fetchedData || !satisfied) {
            throw createError();
        }

        return fetchedData;
    }

    protected getAllTransactionEvents(transaction: TransactionOnNetwork): TransactionEvent[] {
        const result = [...transaction.logs.events];

        for (const resultItem of transaction.smartContractResults) {
            result.push(...resultItem.logs?.events);
        }

        return result;
    }
}

class TransactionFetcherWithTracing implements ITransactionFetcher {
    private readonly fetcher: ITransactionFetcher;

    constructor(fetcher: ITransactionFetcher) {
        this.fetcher = fetcher;
    }

    async getTransaction(txHash: string): Promise<TransactionOnNetwork> {
        Logger.debug(`transactionWatcher, getTransaction(${txHash})`);
        return await this.fetcher.getTransaction(txHash);
    }
}
