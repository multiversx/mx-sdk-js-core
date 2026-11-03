import { ErrBadPEM, ErrInvalidArgument } from "../core/errors";

// Any kind of entry is accepted (e.g. "-----BEGIN foobar"), as before. Generally, the entries are "PRIVATE KEY for <label>".
const HEADER_PREFIX = "-----BEGIN";
const FOOTER_PREFIX = "-----END";
const LABEL_PREFIX = "PRIVATE KEY for";
const DELIMITER = "-----";

export class PemEntry {
    label: string;
    message: Uint8Array;

    constructor(label: string, message: Uint8Array) {
        this.label = label;
        this.message = message;
    }

    static fromTextAll(pemText: string): PemEntry[] {
        const lines = PemEntry.cleanLines(pemText.split("\n"));
        const result: PemEntry[] = [];

        // Each entry is parsed on its own (header, message lines, footer), so that labels can't be paired with the wrong messages.
        for (const { header, messageLines, footer } of PemEntry.groupBlocks(lines)) {
            const title = PemEntry.parseTitle(header, HEADER_PREFIX);
            if (PemEntry.parseTitle(footer, FOOTER_PREFIX) !== title) {
                throw new ErrBadPEM("the END line does not match the BEGIN line");
            }

            if (messageLines.length == 0) {
                throw new ErrBadPEM("an entry has no content");
            }

            const messageBase64 = messageLines.join("");
            const messageBytes = PemEntry.decodeMessage(messageBase64);
            const label = title.startsWith(LABEL_PREFIX) ? title.slice(LABEL_PREFIX.length).trim() : title;
            result.push(new PemEntry(label, messageBytes));
        }

        return result;
    }

    private static groupBlocks(lines: string[]): { header: string; messageLines: string[]; footer: string }[] {
        const blocks: { header: string; messageLines: string[]; footer: string }[] = [];
        let header: string | undefined = undefined;
        let messageLines: string[] = [];

        for (const line of lines) {
            if (line.startsWith(HEADER_PREFIX)) {
                if (header !== undefined) {
                    throw new ErrBadPEM("missing END line");
                }

                header = line;
                messageLines = [];
            } else if (line.startsWith(FOOTER_PREFIX)) {
                if (header === undefined) {
                    throw new ErrBadPEM("missing BEGIN line");
                }

                blocks.push({ header, messageLines, footer: line });
                header = undefined;
            } else if (header === undefined) {
                // The content of the line is not included in the error message, since it could be secret.
                throw new ErrBadPEM("unexpected line outside of an entry");
            } else {
                messageLines.push(line);
            }
        }

        if (header !== undefined) {
            throw new ErrBadPEM("missing END line");
        }

        return blocks;
    }

    private static parseTitle(line: string, prefix: string): string {
        // Only the delimiters are removed, so that dashes within the label are kept.
        // The trailing delimiter is handled leniently (e.g. "---" instead of "-----"), as before: such files exist in the wild.
        // A loop, not a regex such as /-+$/, which would take quadratic time on long runs of dashes.
        let end = line.length;
        while (end > prefix.length && line[end - 1] === "-") {
            end--;
        }

        return line.slice(prefix.length, end).trim();
    }

    private static decodeMessage(messageBase64: string): Buffer {
        // "Buffer.from()" silently skips (or stops at) invalid characters, thus the explicit checks.
        // The content is not included in the error message, since it could be secret.
        const isBase64 = messageBase64.length % 4 == 0 && /^[A-Za-z0-9+/]*={0,2}$/.test(messageBase64);
        const messageHex = isBase64 ? Buffer.from(messageBase64, "base64").toString() : "";
        const isHex = /^([0-9a-fA-F]{2})*$/.test(messageHex);

        if (!isBase64 || !isHex) {
            throw new ErrBadPEM("the content of an entry is not properly encoded");
        }

        return Buffer.from(messageHex, "hex");
    }

    toText(): string {
        // Such labels would break the structure of the file.
        if (this.label.includes(DELIMITER) || /[\n\r\v\f\x1c-\x1e\x85\u2028\u2029]/.test(this.label)) {
            throw new ErrBadPEM(`the label must not contain line breaks or '${DELIMITER}'`);
        }

        const header = `-----BEGIN PRIVATE KEY for ${this.label}-----`;
        const footer = `-----END PRIVATE KEY for ${this.label}-----`;

        const messageHex = Buffer.from(this.message).toString("hex");
        const messageBase64 = Buffer.from(messageHex, "utf-8").toString("base64");
        const payloadLines = PemEntry.wrapText(messageBase64, 64);
        const payload = payloadLines.join("\n");

        return [header, payload, footer].join("\n");
    }

    private static cleanLines(lines: string[]): string[] {
        return lines.map((line) => line.trim()).filter((line) => line.length > 0);
    }

    private static wrapText(text: string, width: number): string[] {
        const lines: string[] = [];
        for (let i = 0; i < text.length; i += width) {
            lines.push(text.slice(i, i + width));
        }
        return lines;
    }
}

export function assertIndexIsValid(index: number, numberOfEntries: number) {
    // Otherwise, the caller would silently get "undefined" (e.g. for an off-by-one error), instead of a secret key.
    if (!Number.isInteger(index) || index < 0 || index >= numberOfEntries) {
        throw new ErrInvalidArgument(
            `PEM entry index ${index} is out of range (number of entries: ${numberOfEntries})`,
        );
    }
}
