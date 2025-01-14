/**
 * An abstraction for handling and interpreting the "status" field of a transaction.
 */
export class TransactionStatus {
    /**
     * The raw status, as fetched from the Network.
     */
    readonly status: string;

    readonly isCompleted: boolean;

    readonly isSuccessfull: boolean;

    /**
     * Creates a new TransactionStatus object.
     */
    constructor(status: string) {
        this.status = (status || "").toLowerCase();
        this.isCompleted = this.isStatusCompleted();
        this.isSuccessfull = this.isStatusSuccessful();
    }

    /**
     * Creates an unknown status.
     */
    static createUnknown(): TransactionStatus {
        return new TransactionStatus("unknown");
    }

    /**
     * Returns whether the transaction is pending (e.g. in mempool).
     */
    isPending(): boolean {
        return this.status == "received" || this.status == "pending";
    }

    /**
     * Returns whether the transaction has been executed (not necessarily with success).
     * @deprecated This will be remove next version, please use {@link isStatusCompleted} instead.
     */
    isExecuted(): boolean {
        return this.isStatusSuccessful() || this.isFailed() || this.isInvalid();
    }

    /**
     * Returns whether the transaction has been conpleted (not necessarily with success).
     */
    isStatusCompleted(): boolean {
        return this.isStatusSuccessful() || this.isFailed() || this.isInvalid();
    }

    /**
     * Returns whether the transaction has been executed successfully.
     */
    isStatusSuccessful(): boolean {
        return this.status == "executed" || this.status == "success" || this.status == "successful";
    }

    /**
     * Returns whether the transaction has been executed, but with a failure.
     */
    isFailed(): boolean {
        return this.status == "fail" || this.status == "failed" || this.status == "unsuccessful" || this.isInvalid();
    }

    /**
     * Returns whether the transaction has been executed, but marked as invalid (e.g. due to "insufficient funds").
     */
    isInvalid(): boolean {
        return this.status == "invalid";
    }

    toString(): string {
        return this.status;
    }

    valueOf(): string {
        return this.status;
    }

    equals(other: TransactionStatus) {
        if (!other) {
            return false;
        }

        return this.status == other.status;
    }
}
