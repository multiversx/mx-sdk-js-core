import { ErrBadType, ErrInvariantFailed } from "../core/errors";

export function guardLength(withLength: { length?: number }, expectedLength: number) {
    let actualLength = withLength.length || 0;

    if (actualLength != expectedLength) {
        throw new ErrInvariantFailed(`wrong length, expected: ${expectedLength}, actual: ${actualLength}`);
    }
}

/**
 * Copies binary data into a Uint8Array, or throws if the input isn't binary data.
 * Types are erased at runtime, and "new Uint8Array(value)" alone would silently convert, e.g., any string to an empty array.
 */
export function bytesFromInput(value: any, name: string): Uint8Array {
    // Not "instanceof", so that a Uint8Array (or Buffer) created in another realm (e.g. iframe, "vm" context) is accepted, as well.
    const tag = Object.prototype.toString.call(value);

    // ArrayBuffer and arrays of bytes aren't covered by the declared types, but were always handled correctly (kept for backwards compatibility).
    if (tag === "[object Uint8Array]" || tag === "[object ArrayBuffer]" || isArrayOfBytes(value)) {
        return new Uint8Array(value);
    }

    throw new ErrBadType(name, "Uint8Array", tag);
}

function isArrayOfBytes(value: any): boolean {
    if (!Array.isArray(value)) {
        return false;
    }

    // A plain loop (not "every"), so that holes in sparse arrays aren't skipped.
    for (let i = 0; i < value.length; i++) {
        const item = value[i];
        if (!Number.isInteger(item) || item < 0 || item > 255) {
            return false;
        }
    }

    return true;
}
