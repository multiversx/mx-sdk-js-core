import * as base64 from "base64-js"; // For Base64 encoding and decoding

export class PemEntry {
    label: string;
    message: Uint8Array;

    constructor(label: string, message: Uint8Array) {
        this.label = label;
        this.message = message;
    }

    static fromTextAll(pemText: string): PemEntry[] {
        const lines = PemEntry.cleanLines(pemText.split("\n"));
        // Group lines based on whether they include "-----"
        const groupedLines: { [key: string]: string[] } = PemEntry.groupLines(lines);
        const messageLinesGroups = Object.values(groupedLines).filter((_, idx) => idx % 2 === 1) as string[][];
        const messageBase64s = messageLinesGroups.map((lines) => lines.join(""));
        const labels = PemEntry.parseLabels(lines);

        return messageBase64s.map((messageBase64, index) => {
            const messageHex = new TextDecoder().decode(base64.toByteArray(messageBase64));
            const messageBytes = Uint8Array.from(Buffer.from(messageHex, "hex"));
            return new PemEntry(labels[index], messageBytes);
        });
    }

    private static groupLines(lines: string[]): { [key: string]: string[] } {
        return lines.reduce(
            (acc, line) => {
                const isHeaderOrFooter = line.includes("-----");
                const key = isHeaderOrFooter ? "headers" : "messages";

                if (!acc[key]) {
                    acc[key] = [];
                }
                acc[key].push(line);

                return acc;
            },
            { headers: [], messages: [] } as { [key: string]: string[] },
        );
    }

    toText(): string {
        const header = `-----BEGIN PRIVATE KEY for ${this.label}-----`;
        const footer = `-----END PRIVATE KEY for ${this.label}-----`;

        const messageHex = Buffer.from(this.message).toString("hex");
        const messageBase64 = base64.fromByteArray(Buffer.from(messageHex, "utf-8"));
        const payloadLines = PemEntry.wrapText(messageBase64, 64);
        const payload = payloadLines.join("\n");

        return [header, payload, footer].join("\n");
    }

    private static cleanLines(lines: string[]): string[] {
        return lines.map((line) => line.trim()).filter((line) => line.length > 0);
    }

    private static parseLabels(headers: string[]): string[] {
        const marker = "-----BEGIN PRIVATE KEY for";
        return headers
            .filter((line) => line.startsWith(marker))
            .map((line) => line.replace(marker, "").replace(/-/g, "").trim());
    }

    private static wrapText(text: string, width: number): string[] {
        const regex = new RegExp(`.{1,${width}}`, "g"); // Match chunks of up to `width` characters
        return text.match(regex) || [];
    }
}
