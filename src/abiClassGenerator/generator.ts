import { Address } from "../address";
import { AbiRegistry } from "../smartcontracts";
import { Logger } from "../logger";
import * as fs from "fs";
import * as prettier from "prettier";

const path = require("node:path");

const SMART_CONTRACT_FACTORY = "SmartContractTransactionsFactory";
const FACTORY_CONFIG = "TransactionsFactoryConfig";
const ABI_REGISTRY = "AbiRegistry";
const PACKAGE = "multiversx/sdk-core";
const TYPESCRIPT_LANGUAGE = "ts";

export class Generator {
    private readonly plainAbi: any;
    private readonly abiRegistry: AbiRegistry;
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
        this.abiRegistry = AbiRegistry.create(this.plainAbi);
        this.contractAddress = options.contractAddress;
        this.chainID = options.chainID;
        this.targetLanguage = options.targetLanguage;
        this.outputPath = options.outputPath;
    }

    generate() {
        let tsGenerator: TypeScriptGenerator;

        if (this.targetLanguage === TYPESCRIPT_LANGUAGE) {
            tsGenerator = this.initilizeTSGenerator();
        } else {
            throw new Error(`Language "${this.targetLanguage}" not supported.`);
        }

        tsGenerator.generate();
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

class TypeScriptGenerator {
    private readonly plainAbi: any;
    private readonly abiRegistry: AbiRegistry;
    private readonly contractAddress: Address;
    private readonly chainID: string;
    private generatedClass: string;
    private outputPath: string;

    constructor(options: { abi: any; contractAddress: Address; chainID: string; outputPath: string }) {
        this.plainAbi = options.abi;
        this.abiRegistry = AbiRegistry.create(this.plainAbi);
        this.contractAddress = options.contractAddress;
        this.chainID = options.chainID;
        this.generatedClass = "";
        this.outputPath = options.outputPath;
    }

    async generate() {
        const fileName = this.prepareFileName();
        const filePath = path.join(this.outputPath, fileName);

        await this.generateClass();
        this.saveFile(filePath);
        Logger.info(`Successfully generated ${fileName} at location ${filePath}`);
    }

    async generateClass() {
        const className = this.prepareClassName();

        this.addImportDeclarations();
        this.addClassDeclarations(className);
        this.addEndClassCurlyBracket();

        await this.formatClass();
    }

    saveFile(output: string) {
        fs.writeFileSync(output, this.generatedClass);
    }

    addImportDeclarations() {
        this.generatedClass +=
            this.createImportStatement(SMART_CONTRACT_FACTORY) +
            this.createImportStatement(FACTORY_CONFIG) +
            this.createImportStatement("Address") +
            this.createImportStatement("AbiRegistry");
    }

    addClassDeclarations(className: string) {
        const classDefinition = `
        export class ${className} {
            private readonly factory: ${SMART_CONTRACT_FACTORY};
            private readonly abi: ${ABI_REGISTRY};
            private readonly contractAddress: Address;

            constructor () {
                this.abi = ${ABI_REGISTRY}.create(${JSON.stringify(this.plainAbi)});
                const config = new ${FACTORY_CONFIG}({ chainID: "${this.chainID}" });
                this.factory = new ${SMART_CONTRACT_FACTORY}({ config: config, abi: this.abi });
                this.contractAddress = Address.fromBech32("${this.contractAddress.bech32()}");
            }\n
        `;

        this.generatedClass += classDefinition;
    }

    private createImportStatement(name: string, from?: string) {
        const module = from ? from : PACKAGE;
        return `import { ${name} } from "${module}";\n`;
    }

    private prepareClassName(): string {
        let name = this.abiRegistry.name ? this.abiRegistry.name : undefined;

        if (!name) {
            Logger.warn("Can't find `name` property inside abi file. Will name class `GeneratedClass`.");
            return "GeneratedClass";
        }

        return name.charAt(0).toUpperCase() + name.slice(1);
    }

    private prepareFileName(): string {
        let name = this.abiRegistry.name ? this.abiRegistry.name : undefined;

        if (!name) {
            Logger.warn("Can't find `name` property inside abi file. Will name file `generatedFile.ts`.");
            return "generatedFile.ts";
        }

        return name.charAt(0).toLowerCase() + name.slice(1) + ".ts";
    }

    private addEndClassCurlyBracket() {
        this.generatedClass += "}\n";
    }

    private async formatClass() {
        this.generatedClass = await prettier.format(this.generatedClass, {
            parser: "typescript",
            singleQuote: false,
            trailingComma: "all",
            tabWidth: 4,
            printWidth: 120,
        });
    }
}
