import { ErrBadPEM } from "../core/errors";
import { assertIndexIsValid, PemEntry } from "./pemEntry";
import { USER_PUBKEY_LENGTH, USER_SEED_LENGTH, UserSecretKey } from "./userKeys";
import { UserPem } from "./userPem";
import { VALIDATOR_SECRETKEY_LENGTH, ValidatorSecretKey } from "./validatorKeys";

export function parseUserKey(text: string, index: number = 0): UserSecretKey {
    const keys = parseUserKeys(text);
    assertIndexIsValid(index, keys.length);
    return keys[index];
}

export function parseUserKeys(text: string): UserSecretKey[] {
    // As before, each entry must hold both the secret key and the public key (64 bytes).
    // Entries that hold 32 bytes are rejected here, even though "UserPem" accepts them: otherwise,
    // the content of a "validatorKey.pem" or of a "p2pKey.pem" would be loaded as the secret key of a user.
    parse(text, USER_SEED_LENGTH + USER_PUBKEY_LENGTH);

    // Same parsing and checks as for "UserPem" (e.g. the embedded public key and the label must match the secret key).
    return UserPem.fromTextAll(text).map((item) => item.secretKey);
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
        if (entry.message.length != expectedLength) {
            throw new ErrBadPEM(`incorrect key length: expected ${expectedLength}, found ${entry.message.length}`);
        }

        return Buffer.from(entry.message);
    });
}
