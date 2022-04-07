/**
 * The base class for exceptions (errors).
 */
export class Err extends Error {
    inner: Error | undefined = undefined;

    public constructor(message: string, inner?: Error) {
        super(message);
        this.inner = inner;
    }
}

/**
 * Signals an unexpected condition.
 */
export class ErrUnexpectedCondition extends Err {
    public constructor(message: string) {
        super(`Unexpected condition: [${message}]`);
    }
}

/**
 * Signals an error that happened during a request against the Network.
 */
export class ErrNetworkProvider extends Err {
    public constructor(url: string, error: string, inner?: Error) {
        let message = `Request error on url [${url}]: [${error}]`;
        super(message, inner);
    }
}


/**
 * Signals a generic error in the context of querying Smart Contracts.
 */
export class ErrContractQuery extends Err {
    public constructor(originalError: Error) {
        super(originalError.message.replace("executeQuery:", ""));
    }
}
