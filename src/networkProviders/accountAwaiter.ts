import { Address } from "../core/address";
import { ExpectedAccountConditionNotReachedError } from "../core/errors";
import { AccountOnNetwork } from "./accounts";
import {
    DEFAULT_ACCOUNT_AWAITING_PATIENCE_IN_MILLISECONDS,
    DEFAULT_ACCOUNT_AWAITING_POLLING_TIMEOUT_IN_MILLISECONDS,
    DEFAULT_ACCOUNT_AWAITING_TIMEOUT_IN_MILLISECONDS,
} from "./constants";

interface IAccountFetcher {
    getAccount(address: Address): Promise<AccountOnNetwork>;
}

export class AccountAwaiter {
    private readonly fetcher: IAccountFetcher;
    private readonly pollingIntervalInMilliseconds: number;
    private readonly timeoutIntervalInMilliseconds: number;
    private readonly patienceTimeInMilliseconds: number;

    /**
     * AccountAwaiter allows one to await until a specific event occurs on a given address.
     *
     * @param fetcher - Used to fetch the account of the network.
     * @param pollingIntervalInMilliseconds - The polling interval, in milliseconds.
     * @param timeoutIntervalInMilliseconds - The timeout, in milliseconds.
     * @param patienceTimeInMilliseconds - The patience, an extra time (in milliseconds) to wait, after the account has reached its desired condition.
     */
    constructor(options: {
        fetcher: IAccountFetcher;
        pollingIntervalInMilliseconds?: number;
        timeoutIntervalInMilliseconds?: number;
        patienceTimeInMilliseconds?: number;
    }) {
        this.fetcher = options.fetcher;

        this.pollingIntervalInMilliseconds =
            options.pollingIntervalInMilliseconds ?? DEFAULT_ACCOUNT_AWAITING_POLLING_TIMEOUT_IN_MILLISECONDS;

        this.timeoutIntervalInMilliseconds =
            options.timeoutIntervalInMilliseconds ?? DEFAULT_ACCOUNT_AWAITING_TIMEOUT_IN_MILLISECONDS;

        this.patienceTimeInMilliseconds =
            options.patienceTimeInMilliseconds ?? DEFAULT_ACCOUNT_AWAITING_PATIENCE_IN_MILLISECONDS;
    }

    /**
     * Waits until the condition is satisfied.
     *
     * @param address - The address to monitor.
     * @param condition - A callable that evaluates the desired condition.
     */
    async awaitOnCondition(
        address: Address,
        condition: (account: AccountOnNetwork) => boolean,
    ): Promise<AccountOnNetwork> {
        const doFetch = async () => await this.fetcher.getAccount(address);

        return this.awaitConditionally(condition, doFetch, new ExpectedAccountConditionNotReachedError());
    }

    private async awaitConditionally(
        isSatisfied: (account: AccountOnNetwork) => boolean,
        doFetch: () => Promise<AccountOnNetwork>,
        error: Error,
    ): Promise<AccountOnNetwork> {
        let isConditionSatisfied = false;
        let fetchedData: AccountOnNetwork | null = null;

        const maxNumberOfRetries = Math.floor(this.timeoutIntervalInMilliseconds / this.pollingIntervalInMilliseconds);

        let numberOfRetries = 0;

        while (numberOfRetries < maxNumberOfRetries) {
            try {
                fetchedData = await doFetch();
                isConditionSatisfied = isSatisfied(fetchedData);

                if (isConditionSatisfied) {
                    break;
                }
            } catch (ex) {
                throw ex;
            }

            numberOfRetries += 1;
            await this._sleep(this.pollingIntervalInMilliseconds);
        }

        if (!fetchedData || !isConditionSatisfied) {
            throw error;
        }

        if (this.patienceTimeInMilliseconds) {
            await this._sleep(this.patienceTimeInMilliseconds);
            return doFetch();
        }

        return fetchedData;
    }

    private async _sleep(milliseconds: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, milliseconds));
    }
}
