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
const CUSTOM_TYPES_FILE_NAME = "customTypes.ts";

type ClassProperty = {
    access: string;
    name: string;
    type: string;
};

type Import = {
    name: string;
    source?: string;
};

export class TypeScriptGenerator {
    private readonly plainAbi: any;
    private readonly abiRegistry: AbiRegistry;
    private readonly contractAddress: Address;
    private readonly chainID: string;
    private outputPath: string;
    private customEnums: string;
    private customStructs: string;
    private customTypes: string;
    private customTypesImports: string;
    private customClasses: string;
    // private generatedClassImports: [string, string][];

    constructor(options: { abi: any; contractAddress: Address; chainID: string; outputPath: string }) {
        this.plainAbi = options.abi;
        this.abiRegistry = AbiRegistry.create(this.plainAbi);
        this.contractAddress = options.contractAddress;
        this.chainID = options.chainID;
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
        const generatedClass = await this.generateClass();
        this.saveFile(filePath, generatedClass);

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

        let generatedClass = this.addImports();
        generatedClass += this.addClassDefinition(className);

        for (const endpoint of this.abiRegistry.getEndpoints()) {
            generatedClass += this.addMethodDefinition(endpoint);
        }

        generatedClass += this.addEndClassCurlyBracket();

        return await this.formatUsingPrettier(generatedClass);
    }

    saveFile(output: string, content: string) {
        fs.writeFileSync(output, content);
    }

    addImports(): string {
        let imports =
            this.createImportStatement(SMART_CONTRACT_FACTORY) +
            this.createImportStatement(FACTORY_CONFIG) +
            this.createImportStatement("Address") +
            this.createImportStatement("AbiRegistry") +
            this.createImportStatement("Transaction") +
            this.createImportStatement("CodeMetadata");

        for (let customType of this.abiRegistry.customTypes) {
            imports += this.createImportStatement(customType.getName(), `./${CUSTOM_TYPES_FILE_NAME}`);
        }

        return imports;
    }

    addClassDefinition(className: string): string {
        return `
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
    }

    addMethodDefinition(endpoint: EndpointDefinition): string {
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
        const body = this.prepareMethodBody(endpoint, methodArgs);
        return this.prepareMethodDefinition(methodName, methodArgs, body);
    }

    private prepareMethodBody(endpoint: EndpointDefinition, preparedArgs: [string, string][]): string {
        let body = `let args: any = [];\n\n`;
        const contractFunction = endpoint.name;

        if (preparedArgs.length) {
            for (const arg of preparedArgs) {
                let argName = arg[0];

                if (argName.endsWith("?")) {
                    argName = arg[0].slice(0, arg[0].length - 1);

                    body += `if (options.${argName}){
                        args.push(options.${argName});
                    }\n\n`;
                    // optionalArgs.push(argName);
                } else {
                    // args.push(`options.${argName}`);
                    body += `args.push(options.${argName});\n`;
                }
            }
        }

        body += `\n`;

        body += `const tx = this.factory.createTransactionForExecute({
            address: Address.Empty(),
            contract: this.contractAddress,
            function: "${contractFunction}",
            gasLimit: 0n,
            arguments: args,
        });

        return tx;
        ;\n`;

        return body;
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

                const preparedClassProperties = this.prepareClassProperties(properties);
                const preparedConstructorDefinition = this.prepareConstructorDefinition(properties);
                const preparedConstructorBody = this.prepareConstructorBody(properties);

                enumClasses += this.prepareClassDefinitionForEnum(
                    variant.name,
                    preparedClassProperties,
                    preparedConstructorDefinition,
                    preparedConstructorBody,
                );
            } else {
                enumClasses += this.prepareClassDefinitionForEnum(variant.name, "", "constructor()", "");
            }
        }
        this.customClasses = enumClasses;

        const variantsAsString = variantsNames.join(" | ");
        return `export type ${enumName} = ${variantsAsString}; \n\n`;
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

    private prepareClassProperties(classProperties: ClassProperty[]): string {
        let classMembers = ``;

        for (const property of classProperties) {
            classMembers += `${property.access} ${property.name}: ${property.type};\n`;
        }

        return classMembers;
    }

    private prepareConstructorDefinition(classProperties: ClassProperty[]): string {
        let constructorParams = ``;

        for (const property of classProperties) {
            constructorParams += `${property.name}: ${property.type},\n`;
        }

        if (!constructorParams.length) {
            return `constructor()`;
        }

        return `constructor(options: { ${constructorParams} })`;
    }

    private prepareConstructorBody(classProperties: ClassProperty[]): string {
        let constructorBody = ``;

        for (const property of classProperties) {
            if (!isNaN(Number(property.name))) {
                constructorBody += `this[${property.name}] = options[${property.name}];\n`;
            } else {
                constructorBody += `this.${property.name} = options.${property.name};\n`;
            }
        }

        return constructorBody;
    }

    private prepareClassDefinitionForEnum(
        name: string,
        classProperties: string,
        constructorDefinition: string,
        constructorBody: string,
    ): string {
        return `export class ${name} {
            readonly name: string;
            ${classProperties}

            ${constructorDefinition} {
                this.name = "${name}"
                ${constructorBody}
            }
        }\n\n`;
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
        return "}\n";
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
