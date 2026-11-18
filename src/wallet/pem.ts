import { ErrBadPEM } from "../core/errors";
import { assertIndexIsValid, PemEntry } from "./pemEntry";
import { USER_PUBKEY_LENGTH, USER_SEED_LENGTH, UserSecretKey } from "./userKeys";
import { checkIdentityOfUserPemEntry, secretKeyOfUserPemEntry } from "./userPemEntries";
import { VALIDATOR_SECRETKEY_LENGTH, ValidatorSecretKey } from "./validatorKeys";

/**
 * Loads the secret key held by the entry at the given index.
 *
 * The structure of the whole text and the length of each entry are checked. Though, only the requested entry is checked
 * against its embedded public key and its label (which requires deriving the public key - by far, the most expensive step).
 * Use "parseUserKeys()" to have all the entries checked.
 */
export function parseUserKey(text: string, index: number = 0): UserSecretKey {
    const entries = parseUserEntries(text);
    assertIndexIsValid(index, entries.length);
    return loadUserKey(entries[index]);
}

export function parseUserKeys(text: string): UserSecretKey[] {
    // Same checks as for "UserPem" (e.g. the embedded public key and the label must match the secret key).
    return parseUserEntries(text).map((entry) => loadUserKey(entry));
}

function loadUserKey(entry: PemEntry): UserSecretKey {
    const secretKey = secretKeyOfUserPemEntry(entry);
    checkIdentityOfUserPemEntry(entry, secretKey.generatePublicKey());
    return secretKey;
}

function parseUserEntries(text: string): PemEntry[] {
    const entries = PemEntry.fromTextAll(text);

    // As before, each entry must hold both the secret key and the public key (64 bytes).
    // Entries that hold 32 bytes are rejected here, even though "UserPem" accepts them: otherwise,
    // the content of a "validatorKey.pem" or of a "p2pKey.pem" would be loaded as the secret key of a user.
    entries.forEach((entry) => assertLength(entry, USER_SEED_LENGTH + USER_PUBKEY_LENGTH));
    return entries;
}

export function parseValidatorKey(text: string, index: number = 0): ValidatorSecretKey {
    const keys = parseValidatorKeys(text);
    assertIndexIsValid(index, keys.length);
    return keys[index];
}

export function parseValidatorKeys(text: string): ValidatorSecretKey[] {
    const buffers = parse(text, VALIDATOR_SECRETKEY_LENGTH);
    return buffers.map((buffer) => new ValidatorSecretKey(buffer));
}

export function parse(text: string, expectedLength: number): Buffer[] {
    return PemEntry.fromTextAll(text).map((entry) => {
        assertLength(entry, expectedLength);
        return Buffer.from(entry.message);
    });
}

function assertLength(entry: PemEntry, expectedLength: number) {
    if (entry.message.length != expectedLength) {
        throw new ErrBadPEM(`incorrect key length: expected ${expectedLength}, found ${entry.message.length}`);
    }
}
