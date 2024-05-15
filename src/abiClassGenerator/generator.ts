import { Address } from "../address";
import { TypeScriptGenerator } from "./typescriptGenerator";

const TYPESCRIPT_LANGUAGE = "ts";

export class Generator {
    private readonly plainAbi: any;
    private readonly contractAddress: Address;
    private readonly chainID: string;
    private readonly targetLanguage: string;
    private readonly outputPath: string;

    constructor(options: {
        abi: any;
        contractAddress: Address;
        chainID: string;
        targetLanguage: string;
        outputPath: string;
    }) {
        this.plainAbi = options.abi;
        this.contractAddress = options.contractAddress;
        this.chainID = options.chainID;
        this.targetLanguage = options.targetLanguage;
        this.outputPath = options.outputPath;
    }

    generate() {
        let generator: TypeScriptGenerator;

        if (this.targetLanguage === TYPESCRIPT_LANGUAGE) {
            generator = this.initilizeTSGenerator();
        } else {
            throw new Error(`Language "${this.targetLanguage}" not supported.`);
        }

        generator.generate();
    }

    private initilizeTSGenerator(): TypeScriptGenerator {
        return new TypeScriptGenerator({
            abi: this.plainAbi,
            contractAddress: this.contractAddress,
            chainID: this.chainID,
            outputPath: this.outputPath,
        });
    }
}
