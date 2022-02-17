import { IProvider, ITransactionFetcher } from "./interface";
import { AsyncTimer } from "./asyncTimer";
import { TransactionHash, TransactionStatus } from "./transaction";
import { TransactionOnNetwork } from "./transactionOnNetwork";
import * as errors from "./errors";
import { Logger } from "./logger";

export type PredicateIsAwaitedStatus = (status: TransactionStatus) => boolean;
export type ActionOnStatusReceived = (status: TransactionStatus) => void;

/**
 * TransactionWatcher allows one to continuously watch (monitor), by means of polling, the status of a given transaction.
 */
export class TransactionWatcher {
    static DefaultPollingInterval: number = 6000;
    static DefaultTimeout: number = TransactionWatcher.DefaultPollingInterval * 15;

    static NoopOnStatusReceived = (_: TransactionStatus) => { };

    private readonly hash: TransactionHash;
    private readonly fetcher: ITransactionFetcher;
    private readonly pollingInterval: number;
    private readonly timeout: number;

    /**
     * 
     * @param hash The hash of the transaction to watch
     * @param fetcher The transaction fetcher
     * @param pollingInterval The polling interval, in milliseconds
     * @param timeout The timeout, in milliseconds
     */
    constructor(
        hash: TransactionHash,
        fetcher: ITransactionFetcher,
        pollingInterval: number = TransactionWatcher.DefaultPollingInterval,
        timeout: number = TransactionWatcher.DefaultTimeout
    ) {
        this.hash = hash;
        this.fetcher = fetcher;
        this.pollingInterval = pollingInterval;
        this.timeout = timeout;
    }

    /**
     * Waits until the transaction reaches the "pending" status.
     */
    public async awaitPending(onStatusReceived?: ActionOnStatusReceived): Promise<void> {
        await this.awaitStatus(status => status.isPending(), onStatusReceived || TransactionWatcher.NoopOnStatusReceived);
    }

    /**
      * Waits until the transaction reaches the "executed" status.
      */
    public async awaitExecuted(onStatusReceived?: ActionOnStatusReceived): Promise<void> {
        await this.awaitStatus(status => status.isExecuted(), onStatusReceived || TransactionWatcher.NoopOnStatusReceived);
    }

    /**
     * Waits until the predicate over the transaction status evaluates to "true".
     * @param isAwaitedStatus A predicate over the status
     */
    public async awaitStatus(isAwaitedStatus: PredicateIsAwaitedStatus, onStatusReceived: ActionOnStatusReceived): Promise<void> {
        let doFetch = async () => await this.fetcher.getTransactionStatus(this.hash);
        let errorProvider = () => new errors.ErrExpectedTransactionStatusNotReached();

        return this.awaitConditionally<TransactionStatus>(
            isAwaitedStatus,
            doFetch,
            onStatusReceived,
            errorProvider
        );
    }

    public async awaitNotarized(): Promise<void> {
        let isNotarized = (data: TransactionOnNetwork) => !data.hyperblockHash.isEmpty();
        let doFetch = async () => await this.fetcher.getTransaction(this.hash);
        let errorProvider = () => new errors.ErrTransactionWatcherTimeout();

        return this.awaitConditionally<TransactionOnNetwork>(
            isNotarized,
            doFetch,
            (_) => { },
            errorProvider
        );
    }

    public async awaitConditionally<TData>(
        isSatisfied: (data: TData) => boolean,
        doFetch: () => Promise<TData>,
        onFetched: (data: TData) => void,
        createError: () => errors.Err
    ): Promise<void> {
        let periodicTimer = new AsyncTimer("watcher:periodic");
        let timeoutTimer = new AsyncTimer("watcher:timeout");

        let stop = false;
        let fetchedData: TData | undefined = undefined;

        let _ = timeoutTimer.start(this.timeout).finally(() => {
            timeoutTimer.stop();
            stop = true;
        });

        while (!stop) {
            try {
                fetchedData = await doFetch();
                Logger.debug("TransactionWatcher.awaitConditionally(): fetched data.", this.hash.toString())

                if (onFetched) {
                    onFetched(fetchedData);
                }

                if (isSatisfied(fetchedData) || stop) {
                    break;
                }
            } catch (error) {
                Logger.info("TransactionWatcher.awaitConditionally(): cannot (yet) fetch data.", this.hash.toString());

                if (!(error instanceof errors.Err)) {
                    throw error;
                }
            }

            await periodicTimer.start(this.pollingInterval);
        }

        if (!timeoutTimer.isStopped()) {
            timeoutTimer.stop();
        }

        let notSatisfied = !fetchedData || !isSatisfied(fetchedData);
        if (notSatisfied) {
            let error = createError();
            throw error;
        }
    }
}
