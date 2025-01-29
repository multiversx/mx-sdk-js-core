export class PemEntry {
    label: string;
    message: Uint8Array;

    constructor(label: string, message: Uint8Array) {
        this.label = label;
        this.message = message;
    }

    static fromTextAll(pemText: string): PemEntry[] {
        const lines = PemEntry.cleanLines(pemText.split("\n"));

        // Group PEM entries into blocks of header, content, and footer
        const blocks: string[][] = PemEntry.groupBlocks(lines);

        return blocks.map((block) => {
            // Extract label from the header line
            const header = block[0];
            const footer = block[block.length - 1];
            if (!header.startsWith("-----BEGIN PRIVATE KEY for") || !footer.startsWith("-----END PRIVATE KEY for")) {
                throw new Error("Invalid PEM format");
            }

            const label = header.replace("-----BEGIN PRIVATE KEY for", "").replace("-----", "").trim();

            // Join all content lines between header and footer
            const base64Message = block.slice(1, block.length - 1).join("");

            // Decode Base64 to Uint8Array
            const messageBytes = Buffer.from(Buffer.from(base64Message, "base64").toString(), "hex");

            return new PemEntry(label, messageBytes);
        });
    }

    private static groupBlocks(lines: string[]): string[][] {
        const blocks: string[][] = [];
        let currentBlock: string[] = [];

        for (const line of lines) {
            if (line.startsWith("-----BEGIN PRIVATE KEY for")) {
                if (currentBlock.length > 0) {
                    blocks.push(currentBlock);
                }
                currentBlock = [line]; // Start a new block
            } else if (line.startsWith("-----END PRIVATE KEY for")) {
                currentBlock.push(line);
                blocks.push(currentBlock); // Finalize the current block
                currentBlock = [];
            } else {
                currentBlock.push(line); // Add content to the current block
            }
        }

        if (currentBlock.length > 0) {
            throw new Error("Invalid PEM format: Missing END line for a block");
        }

        return blocks;
    }

    toText(): string {
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
