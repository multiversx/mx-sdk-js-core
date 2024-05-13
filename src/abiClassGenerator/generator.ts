import { Address } from "../address";
import {
    AbiRegistry,
    EndpointDefinition,
    EndpointParameterDefinition,
    EnumType,
    FieldDefinition,
    StructType,
    Type,
} from "../smartcontracts";
import { Logger } from "../logger";
import * as fs from "fs";
import * as prettier from "prettier";

const path = require("node:path");

const SMART_CONTRACT_FACTORY = "SmartContractTransactionsFactory";
const FACTORY_CONFIG = "TransactionsFactoryConfig";
const ABI_REGISTRY = "AbiRegistry";
const CORE_PACKAGE = "@multiversx/sdk-core";
const TYPESCRIPT_LANGUAGE = "ts";
const CUSTOM_TYPES_FILE_NAME = "customTypes.ts";

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

type ClassProperty = {
    access: string;
    name: string;
    type: string;
};

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
    private customTypesImports: string;
    private customClasses: string;

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
        this.customTypesImports = "";
        this.customClasses = ``;
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
        // const a = this.abiRegistry.getStruct("CallActionData");
        // console.log(a);
        // console.log("-----------------");
        // console.log(a.getFieldsDefinitions()[2]);
        // return;
        // return;
        await this.generateClass();
        this.saveFile(filePath, this.generatedClass);

        await this.generateCustomTypes();
        const typesPath = path.join(this.outputPath, CUSTOM_TYPES_FILE_NAME);
        this.saveFile(typesPath, this.customTypes);

        Logger.info(`Successfully generated ${fileName} at location ${filePath}.`);
    }

    async generateCustomTypes() {
        this.createCustomTypes();
        const types = await this.formatUsingPrettier(
            this.customEnums + "\n" + this.customStructs + "\n" + this.customClasses,
        );
        this.ensureImportStatementForCustomTypes(types);
        this.customTypes = this.customTypesImports + "\n" + types;
    }

    private ensureImportStatementForCustomTypes(customTypes: string) {
        if (customTypes.includes(": Address;")) {
            this.customTypesImports += this.createImportStatement("Address");
        }

        if (customTypes.includes(": CodeMetadata;")) {
            this.customTypesImports += this.createImportStatement("CodeMetadata");
        }
    }

    async generateClass() {
        const className = this.prepareClassName();

        this.addImports();
        this.addClassDefinition(className);

        for (const endpoint of this.abiRegistry.getEndpoints()) {
            this.generatedClass += this.addMethodDefinition(endpoint);
        }

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

        for (let customType of this.abiRegistry.customTypes) {
            this.generatedClass += this.createImportStatement(customType.getName(), `./${CUSTOM_TYPES_FILE_NAME}`);
        }
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

    addMethodDefinition(endpoint: EndpointDefinition) {
        let method = this.createDocString(endpoint);
        method += this.prepareMethod(endpoint);
        return method;
    }

    private prepareMethod(endpoint: EndpointDefinition) {
        // const inputs = endpoint.input;
        const mutability = endpoint.modifiers.mutability;

        if (mutability === "readonly") {
            return this.prepareReadonlyMethod(endpoint);
        }

        const methodName = endpoint.name;
        const methodArgs = this.getMethodParameters(endpoint.input);
        const body = "test";
        return this.prepareMethodDefinition(methodName, methodArgs, body);
    }

    private prepareMethodDefinition(name: string, parameters: [string, string][], body: string) {
        const params = this.prepareMethodParameters(parameters);
        return `${name}(${params}): Transaction {
            ${body}
        }\n\n`;
    }

    private prepareMethodParameters(parameters: [string, string][]): string {
        let params = ``;

        for (let i = 0; i < parameters.length; i++) {
            params += `${parameters[i][0]}: ${parameters[i][1]};`;
        }

        if (!params.length) {
            return "";
        }
        return `options: {${params}}`;
    }

    private prepareMethodBody() {}

    // prepares vm-query
    private prepareReadonlyMethod(endpoint: EndpointDefinition) {
        const methodName = endpoint.name;
        const methodArgs = this.getMethodParameters(endpoint.input);
        const body = `// test for vm-queries`;
        return this.prepareViewMethodDefinition(methodName, methodArgs, body);
    }

    private prepareViewMethodDefinition(name: string, parameters: [string, string][], body: string) {
        const params = this.prepareMethodParameters(parameters);
        return `${name}(${params}): SmartContractQuery {
            ${body}
        }\n\n`;
    }

    private getMethodParameters(inputs: EndpointParameterDefinition[]): [string, string][] {
        let inputTuple: [string, string][] = [];
        for (const input of inputs) {
            let paramName = this.formatFieldName(input.name);
            let paramType = input.type;

            if (this.isTypeInCustomTypes(paramType)) {
                // let params = `options: {}`;
                inputTuple.push([paramName, paramType.getName()]);
            } else if (paramType.isGenericType()) {
                const nativeType = this.mapOpenTypeToNativeType(paramType.getName());

                if (paramType.getName() === "Option" || paramType.getName() === "Optional") {
                    paramName = this.formatFieldName(paramName, true);
                }

                inputTuple.push([paramName, nativeType]);
            } else {
                const nativeType = this.mapClosedTypeToNativeType(paramType.getName());

                if (nativeType === "nothing") {
                    continue;
                }

                inputTuple.push([paramName, nativeType]);
            }
        }
        return inputTuple;
    }

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

    private createEnum(customType: EnumType): string {
        if (!this.isEnumHeterogeneous(customType)) {
            return this.createNonHeterogeneousEnum(customType);
        }

        return this.createaHeterogeneousEnum(customType);
    }

    private createNonHeterogeneousEnum(customType: EnumType): string {
        const enumName = customType.getName();
        const variants = customType.variants;

        let items: string = ``;
        for (const item of variants) {
            items += `${item.name} = ${item.discriminant},\n`;
        }

        return this.prepareNonHeterogeneousEnumDefinition(enumName, items);
    }

    private createaHeterogeneousEnum(customType: EnumType) {
        const enumName = customType.getName();
        const variants = customType.variants;
        let variantsNames: string[] = [];

        let enumClasses = ``;
        for (const variant of variants) {
            variantsNames.push(variant.name);
            const fields = variant.getFieldsDefinitions();
            if (fields.length) {
                const properties = this.getFieldsAsClassProperties(fields);
                enumClasses += this.prepareClassDefinitionForEnum(variant.name, properties);
            } else {
                const properties: ClassProperty = {
                    access: "readonly",
                    name: variant.name,
                    type: "string",
                };
                enumClasses += this.prepareClassDefinitionForEnum(variant.name, [properties]);
            }
        }
        this.customClasses = enumClasses;

        const variantsAsString = variantsNames.join(" | ");
        return `export type ${enumName} = ${variantsAsString};`;
    }

    private getFieldsAsClassProperties(fields: FieldDefinition[]): ClassProperty[] {
        let properties: ClassProperty[] = [];
        let type: string;

        for (const field of fields) {
            if (field.type.isGenericType()) {
                type = this.mapOpenTypeToNativeType(field.type.getName());
            } else if (field.type instanceof EnumType) {
                type = field.type.getName();
            } else {
                type = this.mapClosedTypeToNativeType(field.type.getName());
            }
            const classProperty: ClassProperty = {
                access: "readonly",
                name: field.name,
                type: type,
            };
            properties.push(classProperty);
        }

        return properties;
    }

    private prepareClassDefinitionForEnum(name: string, classProperties: ClassProperty[]): string {
        let classMembers = ``;
        let constructorParams = ``;
        let constructorBody = ``;

        for (const property of classProperties) {
            classMembers += `${property.access} ${property.name}: ${property.type};\n`;
            constructorParams += `${property.name}: ${property.type},\n`;

            constructorBody += `this.${property.name} = options.${property.name};\n`;
        }

        const a = `export class ${name} {
            readonly name: string;
            ${classMembers}

            constructor(options: {${constructorParams}}) {
                this.name = "${name}"
                ${constructorBody}
            }
        }\n\n`;
        console.log(a);
        return a;
    }

    private isEnumHeterogeneous(customType: EnumType): boolean {
        const variants = customType.variants;

        for (const variant of variants) {
            if (variant.getFieldsDefinitions().length) {
                return true;
            }
        }
        return false;
    }

    private createStruct(customType: StructType): string {
        const structName = customType.getName();
        const fields = customType.getFieldsDefinitions();

        let items: string = ``;
        for (const field of fields) {
            if (field.type.isGenericType()) {
                const nativeType = this.mapOpenTypeToNativeType(field.type.getName());

                let fieldName: string;
                if (field.type.getName() === "Option" || field.type.getName() === "Optional") {
                    fieldName = this.formatFieldName(field.name, true);
                } else {
                    fieldName = this.formatFieldName(field.name);
                }

                items += `${fieldName}: ${nativeType};\n`;
            } else if (field.type instanceof EnumType) {
                items += `${this.formatFieldName(field.name)}: ${field.type.getName()};\n`;
            } else {
                const nativeType = this.mapClosedTypeToNativeType(field.type.getName());

                if (nativeType === "nothing") {
                    continue;
                }

                items += `${this.formatFieldName(field.name)}: ${nativeType};\n`;
            }
        }

        return this.prepareTypeDefinition(structName, items);
    }

    private isTypeInCustomTypes(type: Type): boolean {
        const customTypes = this.abiRegistry.customTypes;

        const item = customTypes.find((customType) => {
            return customType.getName() === type.getName();
        });

        return item !== undefined;
    }

    private formatFieldName(name: string, isOptional?: boolean): string {
        let formattedName = name;

        if (name.includes("_")) {
            const words = name.split("_");

            for (let i = 1; i < words.length; i++) {
                words[i] = words[i].charAt(0).toUpperCase() + words[i].slice(1);
            }

            formattedName = words.join("");
        }

        if (isOptional) {
            return formattedName + "?";
        }
        return formattedName;
    }

    private prepareNonHeterogeneousEnumDefinition(name: string, body: string): string {
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
                return "any";
        }
    }

    private mapOpenTypeToNativeType(openType: string): string {
        switch (openType) {
            case "List":
                return "any[]";
            case "Option":
                return "any";
            case "Optional":
                return "any";
            case "Tuple":
                return "any[]";
            case "Variadic":
                return "any[]";
            default:
                return "any";
        }
    }

    private createDocString(endpoint: EndpointDefinition): string {
        const result = this.plainAbi.endpoints.find((e: any) => e.name == endpoint.name);

        const docs: string[] = result?.docs || [];
        if (!docs.length) {
            return "";
        }

        let docString = "/**\n";

        if (endpoint.modifiers.mutability === "readonly") {
            docString += `* This is a view method. This will do a vm-query.\n`;
        }

        for (const line of docs) {
            docString += `* ${line}\n`;
        }

        return docString + "*/\n";
    }

    private createImportStatement(name: string, from?: string): string {
        const module = from ? from : CORE_PACKAGE;
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
