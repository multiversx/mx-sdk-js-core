import { AsyncTimer } from "./asyncTimer";
import { HEX_TRANSACTION_HASH_LENGTH } from "./constants";
import {
    Err,
    ErrExpectedTransactionEventsNotFound,
    ErrExpectedTransactionStatusNotReached,
    ErrIsCompletedFieldIsMissingOnTransaction,
} from "./errors";
import { ITransactionFetcher } from "./interface";
import { ITransactionEvent, ITransactionOnNetwork, ITransactionStatus } from "./interfaceOfNetwork";
import { Logger } from "./logger";

export type PredicateIsAwaitedStatus = (status: ITransactionStatus) => boolean;

/**
 * Internal interface: a transaction, as seen from the perspective of a {@link TransactionWatcher}.
 */
interface ITransaction {
    getHash(): { hex(): string };
}

/**
 * TransactionWatcher allows one to continuously watch (monitor), by means of polling, the status of a given transaction.
 */
export class TransactionWatcher {
    static DefaultPollingInterval: number = 6000;
    static DefaultTimeout: number = TransactionWatcher.DefaultPollingInterval * 15;
    static DefaultPatience: number = 0;

    static NoopOnStatusReceived = (_: ITransactionStatus) => {};

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
    public async awaitPending(transactionOrTxHash: ITransaction | string): Promise<ITransactionOnNetwork> {
        const isPending = (transaction: ITransactionOnNetwork) => transaction.status.isPending();
        const doFetch = async () => {
            const hash = this.transactionOrTxHashToTxHash(transactionOrTxHash);
            return await this.fetcher.getTransaction(hash);
        };
        const errorProvider = () => new ErrExpectedTransactionStatusNotReached();

        return this.awaitConditionally<ITransactionOnNetwork>(isPending, doFetch, errorProvider);
    }

    /**
     * Waits until the transaction is completely processed.
     * @param txHash The hex-encoded transaction hash
     */
    public async awaitCompleted(transactionOrTxHash: ITransaction | string): Promise<ITransactionOnNetwork> {
        const isCompleted = (transactionOnNetwork: ITransactionOnNetwork) => {
            if (transactionOnNetwork.isCompleted === undefined) {
                throw new ErrIsCompletedFieldIsMissingOnTransaction();
            }
            return transactionOnNetwork.isCompleted;
        };

        const doFetch = async () => {
            const hash = this.transactionOrTxHashToTxHash(transactionOrTxHash);
            return await this.fetcher.getTransaction(hash);
        };
        const errorProvider = () => new ErrExpectedTransactionStatusNotReached();

        return this.awaitConditionally<ITransactionOnNetwork>(isCompleted, doFetch, errorProvider);
    }

    public async awaitAllEvents(
        transactionOrTxHash: ITransaction | string,
        events: string[],
    ): Promise<ITransactionOnNetwork> {
        const foundAllEvents = (transactionOnNetwork: ITransactionOnNetwork) => {
            const allEventIdentifiers = this.getAllTransactionEvents(transactionOnNetwork).map(
                (event) => event.identifier,
            );
            const allAreFound = events.every((event) => allEventIdentifiers.includes(event));
            return allAreFound;
        };

        const doFetch = async () => {
            const hash = this.transactionOrTxHashToTxHash(transactionOrTxHash);
            return await this.fetcher.getTransaction(hash);
        };
        const errorProvider = () => new ErrExpectedTransactionEventsNotFound();

        return this.awaitConditionally<ITransactionOnNetwork>(foundAllEvents, doFetch, errorProvider);
    }

    public async awaitAnyEvent(
        transactionOrTxHash: ITransaction | string,
        events: string[],
    ): Promise<ITransactionOnNetwork> {
        const foundAnyEvent = (transactionOnNetwork: ITransactionOnNetwork) => {
            const allEventIdentifiers = this.getAllTransactionEvents(transactionOnNetwork).map(
                (event) => event.identifier,
            );
            const anyIsFound = events.find((event) => allEventIdentifiers.includes(event)) != undefined;
            return anyIsFound;
        };

        const doFetch = async () => {
            const hash = this.transactionOrTxHashToTxHash(transactionOrTxHash);
            return await this.fetcher.getTransaction(hash);
        };
        const errorProvider = () => new ErrExpectedTransactionEventsNotFound();

        return this.awaitConditionally<ITransactionOnNetwork>(foundAnyEvent, doFetch, errorProvider);
    }

    public async awaitOnCondition(
        transactionOrTxHash: ITransaction | string,
        condition: (data: ITransactionOnNetwork) => boolean,
    ): Promise<ITransactionOnNetwork> {
        const doFetch = async () => {
            const hash = this.transactionOrTxHashToTxHash(transactionOrTxHash);
            return await this.fetcher.getTransaction(hash);
        };
        const errorProvider = () => new ErrExpectedTransactionStatusNotReached();

        return this.awaitConditionally<ITransactionOnNetwork>(condition, doFetch, errorProvider);
    }

    private transactionOrTxHashToTxHash(transactionOrTxHash: ITransaction | string): string {
        const hash =
            typeof transactionOrTxHash === "string" ? transactionOrTxHash : transactionOrTxHash.getHash().hex();

        if (hash.length !== HEX_TRANSACTION_HASH_LENGTH) {
            throw new Err(
                `Invalid transaction hash length. The length of a hex encoded hash should be ${HEX_TRANSACTION_HASH_LENGTH}.`,
            );
        }

        return hash;
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
