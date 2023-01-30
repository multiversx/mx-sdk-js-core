import { Err } from "../../errors";
import { IOutcomeBundle, IOutcomeError } from "./interface";

export class OutcomeBundle<TOutcome> implements IOutcomeBundle<TOutcome> {
    outcome?: TOutcome;
    error?: IOutcomeError;

    constructor({ outcome, error }: { outcome?: TOutcome, error?: IOutcomeError }) {
        this.outcome = outcome;
        this.error = error;
    }

    isSuccess(): boolean {
        return !this.error;
    }

    raiseOnError(): void {
        if (this.error) {
            const message = `${this.error.data}: ${this.error.message}`;
            throw new Err(message);
        }
    }
}
