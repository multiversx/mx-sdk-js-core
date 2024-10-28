import { ErrInvariantFailed } from "../errors";

export function guardLength(withLength: { length?: number }, expectedLength: number) {
    let actualLength = withLength.length || 0;

    if (actualLength != expectedLength) {
        throw new ErrInvariantFailed(`wrong length, expected: ${expectedLength}, actual: ${actualLength}`);
    }
}
