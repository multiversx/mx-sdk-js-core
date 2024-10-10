/**
 * The base class for exceptions (errors).
 */
export class Err extends Error {
    inner: Error | undefined = undefined;

    public constructor(message: string, inner?: Error) {
        super(message);
        this.inner = inner;
    }

    /**
     * Returns a pretty, friendly summary for the error or for the chain of errros (if appropriate).
     */
    summary(): any[] {
        const result = [];

        result.push({ name: this.name, message: this.message });

        let inner: any = this.inner;
        while (inner) {
            result.push({ name: inner.name, message: inner.message });
            inner = inner.inner;
        }

        return result;
    }
}

/**
 * Signals invalid arguments for a function, for an operation.
 */
export class ErrInvalidArgument extends Err {
    public constructor(message: string, inner?: Error) {
        super(`Invalid argument: ${message}`, inner);
    }
}

/**
 * Signals an unsupported operation.
 */
export class ErrUnsupportedOperation extends Err {
    public constructor(operation: string, reason: string = "not specified") {
        super(`Operation "${operation}" not supported. Reason: ${reason}`);
    }
}

/**
 * Signals the provisioning of objects of unexpected (bad) types.
 */
export class ErrBadType extends Err {
    public constructor(name: string, type: any, value?: any) {
        super(`Bad type of "${name}": ${value}. Expected type: ${type}`);
    }
}

/**
 * Signals that an invariant failed.
 */
export class ErrInvariantFailed extends Err {
    public constructor(message: string) {
        super(`Invariant failed: [${message}]`);
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
 * Signals issues with {@link Address} instantiation.
 */
export class ErrAddressCannotCreate extends Err {
    public constructor(input: any, inner?: Error) {
        const message = `Cannot create address from: ${input}`;
        super(message, inner);
    }
}

/**
 * Signals issues with the HRP of an {@link Address}.
 */
export class ErrAddressBadHrp extends Err {
    public constructor(expected: string, got: string) {
        super(`Wrong address HRP. Expected: ${expected}, got ${got}`);
    }
}

/**
 * Signals the presence of an empty / invalid address.
 */
export class ErrAddressEmpty extends Err {
    public constructor() {
        super(`Address is empty`);
    }
}

/**
 * Signals an invalid value for {@link GasLimit} objects.
 */
export class ErrNotEnoughGas extends Err {
    public constructor(value: number) {
        super(`Not enough gas provided: ${value}`);
    }
}

/**
 * Signals an invalid value for {@link Nonce} objects.
 */
export class ErrNonceInvalid extends Err {
    public constructor(value: number) {
        super(`Invalid nonce: ${value}`);
    }
}

/**
 * Signals an invalid value for {@link TransactionVersion} objects.
 */
export class ErrTransactionVersionInvalid extends Err {
    public constructor(value: number) {
        super(`Invalid transaction version: ${value}`);
    }
}

/**
 * Signals an invalid value for {@link TransactionOptions} objects.
 */
export class ErrTransactionOptionsInvalid extends Err {
    public constructor(value: number) {
        super(`Invalid transaction options: ${value}`);
    }
}

/**
 * Signals an error related to signing a message (a transaction).
 */
export class ErrSignatureCannotCreate extends Err {
    public constructor(input: any, inner?: Error) {
        const message = `Cannot create signature from: ${input}`;
        super(message, inner);
    }
}

/**
 * Signals an invalid value for the name of a {@link ContractFunction}.
 */
export class ErrInvalidFunctionName extends Err {
    public constructor() {
        super(`Invalid function name`);
    }
}

/**
 * Signals a failed operation, since the Timer is already running.
 */
export class ErrAsyncTimerAlreadyRunning extends Err {
    public constructor() {
        super("Async timer already running");
    }
}

/**
 * Signals a failed operation, since the Timer has been aborted.
 */
export class ErrAsyncTimerAborted extends Err {
    public constructor() {
        super("Async timer aborted");
    }
}

/**
 * Signals a timout for a {@link TransactionWatcher}.
 */
export class ErrTransactionWatcherTimeout extends Err {
    public constructor() {
        super(`TransactionWatcher has timed out`);
    }
}

/**
 * Signals an issue related to waiting for a specific transaction status.
 */
export class ErrExpectedTransactionStatusNotReached extends Err {
    public constructor() {
        super(`Expected transaction status not reached`);
    }
}

/**
 * Signals an issue related to waiting for specific transaction events.
 */
export class ErrExpectedTransactionEventsNotFound extends Err {
    public constructor() {
        super(`Expected transaction events not found`);
    }
}

/**
 * Signals a generic error in the context of Smart Contracts.
 */
export class ErrContract extends Err {
    public constructor(message: string) {
        super(message);
    }
}

export class ErrContractHasNoAddress extends ErrContract {
    public constructor() {
        super(`
The smart contract has no address set. Make sure you provide the address in the constructor, or call setAddress() appropriately.
If you need to recompute the address of the contract, make use of SmartContract.computeAddress() (static method). 
`);
    }
}

/**
 * Signals an error thrown by the mock-like test objects.
 */
export class ErrMock extends Err {
    public constructor(message: string) {
        super(message);
    }
}

/**
 * Signals a generic type error.
 */
export class ErrTypingSystem extends Err {
    public constructor(message: string) {
        super(message);
    }
}

/**
 * Signals a missing field on a struct.
 */
export class ErrMissingFieldOnStruct extends Err {
    public constructor(fieldName: string, structName: string) {
        super(`field ${fieldName} does not exist on struct ${structName}`);
    }
}

/**
 * Signals a missing field on an enum.
 */
export class ErrMissingFieldOnEnum extends Err {
    public constructor(fieldName: string, enumName: string) {
        super(`field ${fieldName} does not exist on enum ${enumName}`);
    }
}

/**
 * Signals an error when parsing the contract results.
 */
export class ErrCannotParseContractResults extends Err {
    public constructor(details: string) {
        super(`cannot parse contract results: ${details}`);
    }
}

/**
 * Signals an error when parsing the outcome of a transaction (results and logs).
 */
export class ErrCannotParseTransactionOutcome extends Err {
    public constructor(transactionHash: string, message: string) {
        super(`cannot parse outcome of transaction ${transactionHash}: ${message}`);
    }
}

/**
 * Signals a generic codec (encode / decode) error.
 */
export class ErrCodec extends Err {
    public constructor(message: string) {
        super(message);
    }
}

/**
 * Signals a generic contract interaction error.
 */
export class ErrContractInteraction extends Err {
    public constructor(message: string) {
        super(message);
    }
}

/**
 * Signals that a method is not yet implemented
 */
export class ErrNotImplemented extends Err {
    public constructor() {
        super("Method not yet implemented");
    }
}

/**
 * Signals invalid arguments when using the relayed v1 builder
 */
export class ErrInvalidRelayedV1BuilderArguments extends Err {
    public constructor() {
        super("invalid arguments for relayed v1 builder");
    }
}

/**
 * Signals invalid arguments when using the relayed v2 builder
 */
export class ErrInvalidRelayedV2BuilderArguments extends Err {
    public constructor() {
        super("invalid arguments for relayed v2 builder");
    }
}

/**
 * Signals that Gas Limit isn't 0 for an inner tx when using relayed v2 builder
 */
export class ErrGasLimitShouldBe0ForInnerTransaction extends Err {
    public constructor() {
        super("gas limit must be 0 for the inner transaction for relayed v2");
    }
}

/**
 * Signals that the `isCompleted` property is missing on the transaction obect and is needed for the Transaction Watcher
 */
export class ErrIsCompletedFieldIsMissingOnTransaction extends Err {
    public constructor() {
        super(
            "The transaction watcher requires the `isCompleted` property to be defined on the transaction object. Perhaps you've used the sdk-network-provider's `ProxyNetworkProvider.getTransaction()` and in that case you should also pass `withProcessStatus=true`.",
        );
    }
}

/**
 * Signals that the provided token identifier is not valid
 */
export class ErrInvalidTokenIdentifier extends Err {
    public constructor(message: string) {
        super(message);
    }
}

/**
 * Signals a generic bad usage error
 */
export class ErrBadUsage extends Err {
    public constructor(message: string) {
        super(message);
    }
}

/**
 * Signals an invalid inner transaction for relayed transactions
 */
export class ErrInvalidInnerTransaction extends Err {
    public constructor(message: string) {
        super(message);
    }
}

/**
 * Signals an error when parsing the logs of a transaction.
 */
export class ErrParseTransactionOutcome extends Err {
    public constructor(message: string) {
        super(message);
    }
}

/**
 * Signals an error when querying a smart contract.
 */
export class ErrSmartContractQuery extends Err {
    public returnCode: string;

    public constructor(returnCode: string, message: string) {
        super(message);
        this.returnCode = returnCode;
    }
}

/**
 * Signals a wrong mnemonic format.
 */
export class ErrWrongMnemonic extends Err {
    public constructor() {
        super("Wrong mnemonic format");
    }
}

/**
 * Signals a bad mnemonic entropy.
 */
export class ErrBadMnemonicEntropy extends Err {
    public constructor(inner: Error) {
        super("Bad mnemonic entropy", inner);
    }
}

/**
 * Signals a bad PEM file.
 */
export class ErrBadPEM extends Err {
    public constructor(message?: string) {
        super(message ? `Bad PEM: ${message}` : `Bad PEM`);
    }
}

/**
 * Signals an error related to signing a message (a transaction).
 */
export class ErrSignerCannotSign extends Err {
    public constructor(inner: Error) {
        super(`Cannot sign`, inner);
    }
}

/**
 * Signals a bad address.
 */
export class ErrBadAddress extends Err {
    public constructor(value: string, inner?: Error) {
        super(`Bad address: ${value}`, inner);
    }
}

/**
 * Signals an error that happened during a request against the Network.
 */
export class ErrNetworkProvider extends Err {
    public constructor(url: string, error: string, inner?: Error) {
        const message = `Request error on url [${url}]: [${error}]`;
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
