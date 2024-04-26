import { Address } from "../address";
import { AbiRegistry, CustomType, EndpointDefinition, EnumType, StructType } from "../smartcontracts";
import { Logger } from "../logger";
import * as fs from "fs";
import * as prettier from "prettier";

const path = require("node:path");

const SMART_CONTRACT_FACTORY = "SmartContractTransactionsFactory";
const FACTORY_CONFIG = "TransactionsFactoryConfig";
const ABI_REGISTRY = "AbiRegistry";
const CORE_PACKAGE = "multiversx/sdk-core";
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

class TypeScriptGenerator {
    private readonly plainAbi: any;
    private readonly abiRegistry: AbiRegistry;
    private readonly contractAddress: Address;
    private readonly chainID: string;
    private generatedClass: string;
    private outputPath: string;
    private customEnums: string;
    private customStructs: string;
    private customTypes: string;

    constructor(options: { abi: any; contractAddress: Address; chainID: string; outputPath: string }) {
        this.plainAbi = options.abi;
        this.abiRegistry = AbiRegistry.create(this.plainAbi);

        // const type = <StructType>this.abiRegistry.getCustomType("ActionStatus");
        // console.log(type);
        // console.log("--------------------");

        // for (const tp of type.getFieldsDefinitions()) {
        //     console.log(tp.name);
        //     console.log(tp.type);
        // }

        this.contractAddress = options.contractAddress;
        this.chainID = options.chainID;
        this.generatedClass = "";
        this.outputPath = options.outputPath;
        this.customEnums = "";
        this.customStructs = "";
        this.customTypes = "";
    }

    async generate() {
        const fileName = this.prepareFileName();
        const filePath = path.join(this.outputPath, fileName);
        // return;
        // const endpoint = this.abiRegistry.getEndpoint("proposeTransferExecuteEsdt");
        // console.log(endpoint);
        // console.log("-----------------------");
        // console.log(endpoint.input);
        // console.log("-----------------------");
        // // console.log(endpoint.input[0].type.getTypeParameters());
        // console.log(endpoint.input[1].type.getTypeParameters());
        // // console.log(endpoint.input[2].type.getTypeParameters());
        // // console.log(endpoint.input[3].type.getTypeParameters());
        // // const res = this.prepareMethod(endpoint);
        // // for (let item of res) {
        // //     console.log(item);
        // // }
        const a = this.abiRegistry.getCustomType("ActionFullInfo");
        console.log(a);
        return;
        // return;
        await this.generateClass();
        this.saveFile(filePath, this.generatedClass);

        await this.generateCustomTypes();
        const typesPath = path.join(this.outputPath, "customTypes.ts");
        this.saveFile(typesPath, this.customTypes);

        Logger.info(`Successfully generated ${fileName} at location ${filePath}.`);
    }

    async generateCustomTypes() {
        this.createCustomTypes();
        this.customTypes = await this.formatUsingPrettier(this.customEnums + "\n" + this.customStructs);
    }

    async generateClass() {
        const className = this.prepareClassName();

        this.addImports();
        this.addClassDefinition(className);

        this.addEndClassCurlyBracket();

        this.generatedClass = await this.formatUsingPrettier(this.generatedClass);
    }

    saveFile(output: string, content: string) {
        fs.writeFileSync(output, content);
    }

    addImports() {
        this.generatedClass +=
            this.createImportStatement(SMART_CONTRACT_FACTORY) +
            this.createImportStatement(FACTORY_CONFIG) +
            this.createImportStatement("Address") +
            this.createImportStatement("AbiRegistry");
    }

    addClassDefinition(className: string) {
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

    // addMethodDefinition(endpoint: EndpointDefinition) {
    //     let method = this.createDocString(endpoint);
    // }

    // private prepareMethod(endpoint: EndpointDefinition) {
    //     const methodName = endpoint.name;
    //     const inputs = endpoint.input;

    //     let inputTuple: [string, string][] = [];
    //     for (const input of inputs) {
    //         inputTuple.push([input.name, input.type.getClassName()]);
    //     }

    //     return inputTuple;
    // }

    createCustomTypes() {
        const contractTypes = this.abiRegistry.customTypes;

        for (const type of contractTypes) {
            if (type instanceof EnumType) {
                const customEnum = this.createEnum(type);
                this.customEnums += customEnum;
            } else if (type instanceof StructType) {
                const customStruct = this.createStruct(type);
                this.customStructs += customStruct;
            } else {
                throw new Error(`Custom type of type ${typeof type} not supported`);
            }
        }
    }

    createEnum(customType: EnumType): string {
        const enumName = customType.getName();
        const variants = customType.variants;

        let items: string = ``;
        for (const item of variants) {
            items += `${item.name} = ${item.discriminant},\n`;
        }

        return this.prepareEnumDefinition(enumName, items);
    }

    createStruct(customType: StructType): string {
        const structName = customType.getName();
        const fields = customType.getFieldsDefinitions();

        let items: string = ``;
        for (const field of fields) {
            if (field.type.isGenericType()) {
                const nativeType = this.mapOpenTypeToNativeType(field.type.getName());
                if (nativeType === "nothing") {
                    continue;
                }

                items += `${this.formatFieldName(field.name)}: ${nativeType};\n`;
            } else {
                items += `${this.formatFieldName(field.name)}: ${this.mapClosedTypeToNativeType(field.type.getName())};\n`;
            }
        }

        return this.prepareTypeDefinition(structName, items);
    }

    private formatFieldName(name: string): string {
        if (name.includes("_")) {
            const words = name.split("_");

            for (let i = 1; i < words.length; i++) {
                words[i] = words[i].charAt(0).toUpperCase() + words[i].slice(1);
            }

            return words.join("");
        }
        return name;
    }

    private prepareEnumDefinition(name: string, body: string): string {
        return `export enum ${name} {
            ${body}
        }\n\n`;
    }

    private prepareTypeDefinition(name: string, body: string): string {
        return `export type ${name} = {
            ${body}
        }\n\n`;
    }

    private mapClosedTypeToNativeType(closedType: string): string {
        const number = "number";
        const bigint = "bigint";

        switch (closedType) {
            case "u8":
                return number;
            case "i8":
                return number;
            case "u16":
                return number;
            case "i16":
                return number;
            case "u32":
                return number;
            case "i32":
                return number;
            case "u64":
                return bigint;
            case "i64":
                return bigint;
            case "BigUint":
                return bigint;
            case "Bigint":
                return bigint;
            case "bool":
                return "boolean";
            case "bytes":
                return "Uint8Array";
            case "Address":
                return "Address";
            case "H256":
                return "Uint8Array";
            case "utf-8 string":
                return "string";
            case "TokenIdentifier":
                return "string";
            case "EgldOrEsdtTokenIdentifier":
                return "string";
            case "CodeMetadata":
                return "CodeMetadata";
            case "nothing":
                return "nothing";
            case "AsyncCall":
                return "nothing";
            default:
                // return "any";
                throw new Error(`Invalid type "${closedType}"`);
        }
    }

    private mapOpenTypeToNativeType(openType: string): string {
        switch (openType) {
            default:
                return "any";
            // case "u8":
            //     return number;
            // case "i8":
            //     return number;
            // case "u16":
            //     return number;
            // case "i16":
            //     return number;
            // case "u32":
            //     return number;
            // case "i32":
            //     return number;
            // case "u64":
            //     return bigint;
            // case "i64":
            //     return bigint;
            // case "BigUint":
            //     return bigint;
            // case "Bigint":
            //     return bigint;
            // case "bool":
            //     return "boolean";
            // case "bytes":
            //     return "Uint8Array";
            // case "Address":
            //     return "Address";
            // case "H256":
            //     return "Uint8Array";
            // case "utf-8 string":
            //     return "string";
            // case "TokenIdentifier":
            //     return "string";
            // case "EgldOrEsdtTokenIdentifier":
            //     return "string";
            // case "CodeMetadata":
            //     return "CodeMetadata";
            // case "nothing":
            //     return "nothing";
            // case "AsyncCall":
            //     return "nothing";
            // default:
            //     throw new Error(`Invalid type "${openType}"`);
        }
    }

    private createDocString(endpoint: any): string {
        const docs: string[] = endpoint.docs;
        if (!docs.length) {
            return "";
        }

        let docString = "/**\n";

        for (const line of docs) {
            docString += `* ${line}\n`;
        }

        return docString + "*/\n";
    }

    private getAllEndpoints(): EndpointDefinition[] {
        return this.abiRegistry.getEndpoints();
    }

    private createImportStatement(name: string, from?: string): string {
        const module = from ? from : CORE_PACKAGE;
        return `import { ${name} } from "@${module}";\n`;
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

    private async formatUsingPrettier(code: string) {
        return await prettier.format(code, {
            parser: "typescript",
            singleQuote: false,
            trailingComma: "all",
            tabWidth: 4,
            printWidth: 120,
        });
    }
}
