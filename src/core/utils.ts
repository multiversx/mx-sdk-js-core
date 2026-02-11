import * as errors from "./errors";

// TODO: Create a class called "Guard". Add the following as member functions.

export function guardTrue(value: boolean, what: string) {
    if (!value) {
        throw new errors.ErrInvariantFailed(`[<${what}>] isn't true`);
    }
}

/**
 * Guards that a value is set (not null or undefined).
 * @param nameOrMessage - Either a variable name or a custom error message
 * @param value - The value to check
 */
export function guardValueIsSet(nameOrMessage: string, value?: any | null | undefined) {
    if (value == null || value === undefined) {
        const message = nameOrMessage.includes(" ") 
            ? nameOrMessage 
            : `${nameOrMessage} isn't set (null or undefined)`;
        throw new errors.ErrInvariantFailed(message);
    }
}

/**
 * @deprecated Use guardValueIsSet instead. This function is kept for backward compatibility.
 */
export function guardValueIsSetWithMessage(message: string, value?: any | null | undefined) {
    guardValueIsSet(message, value);
}

export function guardSameLength(a: any[], b: any[]) {
    a = a || [];
    b = b || [];

    if (a.length != b.length) {
        throw new errors.ErrInvariantFailed("arrays do not have the same length");
    }
}

export function guardLength(withLength: { length?: number }, expectedLength: number) {
    let actualLength = withLength.length || 0;

    if (actualLength != expectedLength) {
        throw new errors.ErrInvariantFailed(`wrong length, expected: ${expectedLength}, actual: ${actualLength}`);
    }
}

export function guardNotEmpty(value: { isEmpty?: () => boolean; length?: number }, what: string) {
    if (isEmpty(value)) {
        throw new errors.ErrInvariantFailed(`${what} is empty`);
    }
}

export function guardEmpty(value: { isEmpty?: () => boolean; length?: number }, what: string) {
    if (!isEmpty(value)) {
        throw new errors.ErrInvariantFailed(`${what} is not empty`);
    }
}

export function isEmpty(value: { isEmpty?: () => boolean; length?: number }): boolean {
    if (value.isEmpty) {
        return value.isEmpty();
    }

    return value.length === 0;
}

export function getAxios() {
    try {
        return require("axios");
    } catch (error) {
        throw new Error("axios is required but not installed. Please install axios to make network requests.");
    }
}
