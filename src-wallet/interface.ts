export interface ISignature {
    hex(): string;
}

/**
 * An interface that defines a signable object (e.g. a transaction).
 */
export interface ISignable {
    /**
     * Returns the signable object in its raw form - a sequence of bytes to be signed.
     */
    serializeForSigning(): Buffer;

    /**
     * Applies the computed signature on the object itself.
     *
     * @param signature The computed signature
    */
    applySignature(signature: ISignature): void;
}

export interface IGuardableSignable extends ISignable {
    /**
    * Applies the guardian signature on the transaction.
    *
    * @param guardianSignature The signature, as computed by a guardian.
    */
    applyGuardianSignature(guardianSignature: ISignature): void;
}

/**
 * Interface that defines a signed and verifiable object
 */
export interface IVerifiable {
    /**
     * Returns the signature that should be verified
     */
    getSignature(): ISignature;

    /**
     * Returns the signable object in its raw form - a sequence of bytes to be verified.
     */
    serializeForSigning(): Buffer;
}
