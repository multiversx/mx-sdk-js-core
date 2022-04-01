import { ITransactionFetcher } from "./interface";
import { AsyncTimer } from "./asyncTimer";
import { TransactionHash, TransactionStatus } from "./transaction";
import { TransactionOnNetwork } from "./transactionOnNetwork";
import { Logger } from "./logger";
import { Err, ErrExpectedTransactionStatusNotReached } from "./errors";
import { Address } from "./address";

export type PredicateIsAwaitedStatus = (status: TransactionStatus) => boolean;

/**
 * Internal interface: a transaction, as seen from the perspective of a {@link TransactionWatcher}.
 */
interface ITransaction {
    getHash(): TransactionHash;
}

/**
 * TransactionWatcher allows one to continuously watch (monitor), by means of polling, the status of a given transaction.
 */
export class TransactionWatcher {
    static DefaultPollingInterval: number = 6000;
    static DefaultTimeout: number = TransactionWatcher.DefaultPollingInterval * 15;

    static NoopOnStatusReceived = (_: TransactionStatus) => { };

    private readonly fetcher: ITransactionFetcher;
    private readonly pollingInterval: number;
    private readonly timeout: number;

    /**
     * 
     * @param fetcher The transaction fetcher
     * @param pollingInterval The polling interval, in milliseconds
     * @param timeout The timeout, in milliseconds
     */
    constructor(
        fetcher: ITransactionFetcher,
        pollingInterval: number = TransactionWatcher.DefaultPollingInterval,
        timeout: number = TransactionWatcher.DefaultTimeout
    ) {
        this.fetcher = new TransactionFetcherWithTracing(fetcher);
        this.pollingInterval = pollingInterval;
        this.timeout = timeout;
    }

    /**
     * Waits until the transaction reaches the "pending" status.
     */
    public async awaitPending(transaction: ITransaction): Promise<void> {
        let isPending = (status: TransactionStatus) => status.isPending();
        let doFetch = async () => await this.fetcher.getTransactionStatus(transaction.getHash());
        let errorProvider = () => new ErrExpectedTransactionStatusNotReached();
        
        return this.awaitConditionally<TransactionStatus>(
            isPending,
            doFetch,
            errorProvider
        );
    }

    /**
      * Waits until the transaction is completely processed.
      */
    public async awaitCompleted(transaction: ITransaction): Promise<void> {
        let isCompleted = (transactionOnNetwork: TransactionOnNetwork) => transactionOnNetwork.isCompleted();
        let doFetch = async () => await this.fetcher.getTransaction(transaction.getHash(), undefined, true);
        let errorProvider = () => new ErrExpectedTransactionStatusNotReached();

        return this.awaitConditionally<TransactionOnNetwork>(
            isCompleted,
            doFetch,
            errorProvider
        );
    }

    private async awaitConditionally<TData>(
        isSatisfied: (data: TData) => boolean,
        doFetch: () => Promise<TData>,
        createError: () => Err
    ): Promise<void> {
        let periodicTimer = new AsyncTimer("watcher:periodic");
        let timeoutTimer = new AsyncTimer("watcher:timeout");

        let stop = false;
        let fetchedData: TData | undefined = undefined;
        let satisfied: boolean = false;

        let _ = timeoutTimer.start(this.timeout).finally(() => {
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

        if (!timeoutTimer.isStopped()) {
            timeoutTimer.stop();
        }

        if (!fetchedData || !satisfied) {
            let error = createError();
            throw error;
        }
    }
}

class TransactionFetcherWithTracing implements ITransactionFetcher {
    private readonly fetcher: ITransactionFetcher;

    constructor(fetcher: ITransactionFetcher) {
        this.fetcher = fetcher;
    }

    async getTransaction(txHash: TransactionHash, hintSender?: Address, withResults?: boolean): Promise<TransactionOnNetwork> {
        Logger.debug(`transactionWatcher, getTransaction(${txHash.toString()})`);
        return await this.fetcher.getTransaction(txHash, hintSender, withResults);
    }

    async getTransactionStatus(txHash: TransactionHash): Promise<TransactionStatus> {
        Logger.debug(`transactionWatcher, getTransactionStatus(${txHash.toString()})`);
        return await this.fetcher.getTransactionStatus(txHash);
    }
}
