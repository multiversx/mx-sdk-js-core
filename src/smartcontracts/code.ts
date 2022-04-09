import axios, { AxiosResponse } from "axios";

/**
 * Bytecode of a Smart Contract, as an abstraction.
 */
export class Code {
    private readonly hex: string;

    private constructor(hex: string) {
        this.hex = hex;
    }

    /**
     * Creates a Code object from a buffer (sequence of bytes).
     */
    static fromBuffer(code: Buffer): Code {
        return new Code(code.toString("hex"));
    }

    /**
     * Creates a Code object by loading the bytecode from a specified URL (WASM file).
     */
    static async fromUrl(url: string): Promise<Code> {
        let response: AxiosResponse<ArrayBuffer> = await axios.get(url, {
            responseType: 'arraybuffer',
            transformResponse: [],
            headers: {
                "Accept": "application/wasm"
            }
        });

        let buffer = Buffer.from(response.data);
        return Code.fromBuffer(buffer);
    }

    /**
     * Returns the bytecode as a hex-encoded string.
     */
    toString(): string {
        return this.hex;
    }
}
