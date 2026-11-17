import { Address } from "../core/address";
import { ErrBadPEM } from "../core/errors";
import { PemEntry } from "./pemEntry";
import { USER_PUBKEY_LENGTH, USER_SEED_LENGTH, UserPublicKey, UserSecretKey } from "./userKeys";

// The checks applied to the entries of a PEM file that holds the keys of users.
// Internal: shared by "UserPem" and by the functions of "pem.ts"; not exported by the package.

/**
 * The message of an entry holds the secret key, optionally followed by the public key.
 */
export function checkLengthOfUserPemEntry(entry: PemEntry) {
    const length = entry.message.length;
    if (length != USER_SEED_LENGTH && length != USER_SEED_LENGTH + USER_PUBKEY_LENGTH) {
        throw new ErrBadPEM(
            `incorrect key length: expected ${USER_SEED_LENGTH} or ${USER_SEED_LENGTH + USER_PUBKEY_LENGTH}, found ${length}`,
        );
    }
}

export function secretKeyOfUserPemEntry(entry: PemEntry): UserSecretKey {
    checkLengthOfUserPemEntry(entry);
    return new UserSecretKey(entry.message.slice(0, USER_SEED_LENGTH));
}

/**
 * The embedded public key (if any) and the label (if it is an address) must match the secret key.
 *
 * @param publicKey the public key derived from the secret key of the entry
 */
export function checkIdentityOfUserPemEntry(entry: PemEntry, publicKey: UserPublicKey) {
    const embeddedPublicKey = Buffer.from(entry.message.slice(USER_SEED_LENGTH));
    if (embeddedPublicKey.length && !embeddedPublicKey.equals(publicKey.valueOf())) {
        throw new ErrBadPEM("the embedded public key does not match the secret key");
    }

    // Generally, the label is the bech32 address of the account. Other labels (e.g. custom ones) are accepted, as before.
    // The HRP isn't checked, so that files saved with a custom HRP can be loaded, as well.
    let labelPublicKey: Buffer;
    try {
        labelPublicKey = Address.newFromBech32(entry.label).getPublicKey();
    } catch {
        return;
    }

    if (!labelPublicKey.equals(publicKey.valueOf())) {
        throw new ErrBadPEM("the label (address) does not match the secret key");
    }
}
