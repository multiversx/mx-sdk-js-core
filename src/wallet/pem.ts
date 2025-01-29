import { ErrBadPEM } from "../core/errors";
import { USER_PUBKEY_LENGTH, USER_SEED_LENGTH, UserSecretKey } from "./userKeys";
import { VALIDATOR_SECRETKEY_LENGTH, ValidatorSecretKey } from "./validatorKeys";

export function parseUserKey(text: string, index: number = 0): UserSecretKey {
    const keys = parseUserKeys(text);
    return keys[index];
}

export function parseUserKeys(text: string): UserSecretKey[] {
    // The user PEM files encode both the seed and the pubkey in their payloads.
    const buffers = parse(text, USER_SEED_LENGTH + USER_PUBKEY_LENGTH);
    return buffers.map((buffer) => new UserSecretKey(buffer.slice(0, USER_SEED_LENGTH)));
}

export function parseValidatorKey(text: string, index: number = 0): ValidatorSecretKey {
    const keys = parseValidatorKeys(text);
    return keys[index];
}

export function parseValidatorKeys(text: string): ValidatorSecretKey[] {
    const buffers = parse(text, VALIDATOR_SECRETKEY_LENGTH);
    return buffers.map((buffer) => new ValidatorSecretKey(buffer));
}

export function parse(text: string, expectedLength: number): Buffer[] {
    // Split by newlines, trim whitespace, then discard remaining empty lines.
    const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    const buffers: Buffer[] = [];
    let linesAccumulator: string[] = [];

    for (const line of lines) {
        if (line.startsWith("-----BEGIN")) {
            linesAccumulator = [];
        } else if (line.startsWith("-----END")) {
            const asBase64 = linesAccumulator.join("");
            const asHex = Buffer.from(asBase64, "base64").toString();
            const asBytes = Buffer.from(asHex, "hex");

            if (asBytes.length != expectedLength) {
                throw new ErrBadPEM(`incorrect key length: expected ${expectedLength}, found ${asBytes.length}`);
            }

            buffers.push(asBytes);
            linesAccumulator = [];
        } else {
            linesAccumulator.push(line);
        }
    }

    if (linesAccumulator.length != 0) {
        throw new ErrBadPEM("incorrect file structure");
    }

    return buffers;
}
