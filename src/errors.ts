/**
 * The base class for `erdjs` exceptions (errors).
 */
import BigNumber from "bignumber.js";

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
    let result = [];

    result.push({ name: this.name, message: this.message });

    let inner: any = this.inner;
    while (inner) {
      result.push({ name: inner.name, message: inner.message });
      inner = inner.inner;
    }

    return result;
  }

  /**
   * Returns a HTML-friendly summary for the error or for the chain of errros (if appropriate).
   */
  html(): string {
    let summary = this.summary();
    let error = summary[0];
    let causedBy = summary.slice(1);

    let html = `
            An error of type <strong>${error.name}</strong> occurred: ${error.message}.
        `;

    causedBy.forEach((cause) => {
      html += `<br /> ... <strong>${cause.name}</strong>: ${cause.message}`;
    });

    return html;
  }

  /**
   * Returns a HTML-friendly summary for the error or for the chain of errros (if appropriate).
   */
  static html(error: Error): string {
    if (error instanceof Err) {
      return error.html();
    } else {
      return `Unexpected error of type <strong>${error.name}</strong> occurred: ${error.message}.`;
    }
  }
}

/**
 * Signals invalid arguments for a function, for an operation.
 */
export class ErrInvalidArgument extends Err {
  public constructor(
    name: string,
    value?: any,
    reason: string = "not specified",
    inner?: Error
  ) {
    super(ErrInvalidArgument.getMessage(name, value, reason), inner);
  }

  static getMessage(name: string, value?: any, reason?: string): string {
    if (value) {
      return `Invalid argument "${name}": ${value}. Reason: ${reason}`;
    }

    return `Invalid argument "${name}"`;
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
    let message = `Cannot create address from: ${input}`;
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
 * Signals an invalid value for {@link Balance} objects.
 */
export class ErrBalanceInvalid extends Err {
  public constructor(value: BigNumber) {
    super(`Invalid balance: ${value.toString()}`);
  }
}

/**
 * Signals an invalid value for {@link GasPrice} objects.
 */
export class ErrGasPriceInvalid extends Err {
  public constructor(value: number) {
    super(`Invalid gas price: ${value}`);
  }
}

/**
 * Signals an invalid value for {@link GasLimit} objects.
 */
export class ErrGasLimitInvalid extends Err {
  public constructor(value: number) {
    super(`Invalid gas limit: ${value}`);
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
 * Signals an invalid value for {@link ChainID} objects.
 */
export class ErrChainIDInvalid extends Err {
  public constructor(value: string) {
    super(`Invalid chain ID: ${value}`);
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
 * Signals an invalid value for {@link GasPriceModifier} objects.
 */
export class ErrGasPriceModifierInvalid extends Err {
  public constructor(value: number) {
    super(`Invalid gas price modifier: ${value}`);
  }
}

/**
 * Signals that the hash of the {@link Transaction} is not known (not set).
 */
export class ErrTransactionHashUnknown extends Err {
  public constructor() {
    super(`Transaction hash isn't known`);
  }
}

/**
 * Signals that a {@link Transaction} cannot be used within an operation, since it isn't signed.
 */
export class ErrTransactionNotSigned extends Err {
  public constructor() {
    super(`Transaction isn't signed`);
  }
}

/**
 * Signals an error related to signing a message (a transaction).
 */
export class ErrSignatureCannotCreate extends Err {
  public constructor(input: any, inner?: Error) {
    let message = `Cannot create signature from: ${input}`;
    super(message, inner);
  }
}

/**
 * Signals the usage of an empty signature.
 */
export class ErrSignatureEmpty extends Err {
  public constructor() {
    super(`Signature is empty`);
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
 * Signals an issue related to waiting for a specific {@link TransactionStatus}.
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

/**
 * Signals an error thrown by the mock-like test objects.
 */
export class ErrMock extends Err {
  public constructor(message: string) {
    super(message);
  }
}

/**
 * Signals a generic serialization error.
 */
export class ErrSerialization extends Err {
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
 * Signals an invalid smart contract call data field
 */
export class ErrInvalidScCallDataField extends Err {
  public constructor(message?: string) {
    message = " " + message ? message : ".";
    super("Invalid smart contract call data field" + message);
  }
}

/**
 * Signals an invalid ESDT transfer data field
 */
export class ErrInvalidEsdtTransferDataField extends Err {
  public constructor() {
    super("Invalid ESDT transfer call data field");
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
 * Signals that a specific transaction event was not found (i.e. in the transaction logs).
 */
export class ErrTransactionEventNotFound extends Err {
  public constructor(identifier: string) {
    super(`Transaction event with identifier [${identifier}] not found (in logs)`);
  }
}
