import { Address } from "../address";
import {
    AbiRegistry,
    EndpointDefinition,
    EndpointParameterDefinition,
    EnumType,
    FieldDefinition,
    PrimitiveType,
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

type Property = {
    access?: string;
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
    private readonly outputPath: string;

    private customTypesImports: string;
    private customClasses: string;

    constructor(options: { abi: any; contractAddress: Address; chainID: string; outputPath: string }) {
        this.plainAbi = options.abi;
        this.abiRegistry = AbiRegistry.create(this.plainAbi);
        this.contractAddress = options.contractAddress;
        this.chainID = options.chainID;
        this.outputPath = options.outputPath;
        this.customTypesImports = "";
        this.customClasses = ``;
    }

    async generate() {
        const fileName = this.prepareFileName();
        const filePath = path.join(this.outputPath, fileName);
        const generatedClass = await this.generateClass();
        this.saveFile(filePath, generatedClass);
        Logger.info(`Successfully generated ${fileName} at location ${filePath}.`);

        if (this.hasAnyCustomTypesInAbi()) {
            const generatedCustomTypes = await this.generateCustomTypes();
            const typesPath = path.join(this.outputPath, CUSTOM_TYPES_FILE_NAME);
            this.saveFile(typesPath, generatedCustomTypes);
            Logger.info(`Successfully generated ${CUSTOM_TYPES_FILE_NAME} at location ${typesPath}.`);
        }
    }

    async generateCustomTypes(): Promise<string> {
        let { enums, structs } = this.createCustomTypes();

        const types = await this.formatUsingPrettier(structs + "\n" + enums + "\n" + this.customClasses);
        this.ensureImportStatementForCustomTypes(types);
        return this.customTypesImports + "\n" + types;
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
            if (endpoint.name === "upgrade") {
                continue;
            }
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

        if (this.hasAnyCustomTypesInAbi()) {
            for (let customType of this.abiRegistry.customTypes) {
                imports += this.createImportStatement(customType.getName(), `./${CUSTOM_TYPES_FILE_NAME}`);
            }
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
                const plainAbi: any = ${JSON.stringify(this.plainAbi)};
                this.abi = ${ABI_REGISTRY}.create(plainAbi);
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

    private prepareMethodBody(endpoint: EndpointDefinition, preparedArgs: Property[]): string {
        let body = `let args: any = [];\n\n`;
        const contractFunction = endpoint.name;

        if (preparedArgs.length) {
            for (const arg of preparedArgs) {
                let argName = arg.name;

                if (argName.endsWith("?")) {
                    argName = arg.name.slice(0, arg.name.length - 1);

                    body += `\nif (options.${argName}){
                        args.push(options.${argName});
                    }\n\n`;
                } else {
                    body += `args.push(options.${argName});\n`;
                }
            }
        }

        body += `\n`;

        body += `const tx = this.factory.createTransactionForExecute({
            sender: Address.empty(),
            contract: this.contractAddress,
            function: "${contractFunction}",
            gasLimit: 0n,
            arguments: args,
        });

        return tx;
        ;\n`;

        return body;
    }

    private prepareMethodDefinition(name: string, parameters: Property[], body: string) {
        const params = this.prepareMethodParameters(parameters);
        return `${name}(${params}): Transaction {
            ${body}
        }\n\n`;
    }

    private prepareMethodParameters(parameters: Property[]): string {
        let params = ``;

        for (let i = 0; i < parameters.length; i++) {
            params += `${parameters[i].name}: ${parameters[i].type};`;
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

    private prepareViewMethodDefinition(name: string, parameters: Property[], body: string) {
        const params = this.prepareMethodParameters(parameters);
        return `${name}(${params}): SmartContractQuery {
            ${body}
        }\n\n`;
    }

    private getMethodParameters(inputs: EndpointParameterDefinition[]): Property[] {
        let inputTuple: Property[] = [];
        for (const input of inputs) {
            inputTuple.push(this.getTypeMember(input));
        }
        return inputTuple;
    }

    createCustomTypes(): { enums: string; structs: string } {
        const contractTypes = this.abiRegistry.customTypes;
        let customEnums = ``;
        let customStructs = ``;

        for (const type of contractTypes) {
            if (type instanceof EnumType) {
                customEnums += this.createEnum(type);
            } else if (type instanceof StructType) {
                customStructs += this.createStruct(type);
            } else {
                throw new Error(`Custom type of type ${typeof type} not supported`);
            }
        }

        return {
            enums: customEnums,
            structs: customStructs,
        };
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

    private getFieldsAsClassProperties(fields: FieldDefinition[]): Property[] {
        let properties: Property[] = [];

        for (const field of fields) {
            const type = this.getNativeType(field.type);
            const classProperty: Property = {
                access: "readonly",
                name: field.name,
                type: type,
            };
            properties.push(classProperty);
        }

        return properties;
    }

    private prepareClassProperties(classProperties: Property[]): string {
        let classMembers = ``;

        for (const property of classProperties) {
            classMembers += `${property.access} ${property.name}: ${property.type};\n`;
        }

        return classMembers;
    }

    private prepareConstructorDefinition(classProperties: Property[]): string {
        let constructorParams = ``;

        for (const property of classProperties) {
            constructorParams += `${property.name}: ${property.type},\n`;
        }

        if (!constructorParams.length) {
            return `constructor()`;
        }

        return `constructor(options: { ${constructorParams} })`;
    }

    private prepareConstructorBody(classProperties: Property[]): string {
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
            const member = this.getTypeMember(field);
            // check to see if native type is ""; don't add as member if true
            if (!member.type) {
                continue;
            }
            items += `${member.name}: ${member.type};\n`;
        }

        return this.prepareTypeDefinition(structName, items);
    }

    private getTypeMember(field: FieldDefinition | EndpointParameterDefinition): Property {
        let fieldName: string;

        if (field.type.getName() === "Option" || field.type.getName() === "Optional") {
            fieldName = this.formatFieldName(field.name, true);
        } else {
            fieldName = this.formatFieldName(field.name);
        }

        const nativeType = this.getNativeType(field.type);
        return { name: fieldName, type: nativeType };
    }

    private getNativeType(type: Type): string {
        let nativeType = ``;

        if (type.isGenericType()) {
            let typedParamsOfType = type.getTypeParameters();

            if (typedParamsOfType.length > 1) {
                nativeType = "any";
            } else if (typedParamsOfType.length === 1) {
                const param = typedParamsOfType[0];

                if (param instanceof PrimitiveType) {
                    nativeType = this.mapClosedTypeToNativeType(param.getName());
                } else {
                    nativeType = param.getName();
                }
            }

            nativeType += this.mapOpenTypeToNativeType(type.getName());
        } else if (type instanceof EnumType || type instanceof StructType) {
            nativeType = type.getName();
        } else {
            nativeType = this.mapClosedTypeToNativeType(type.getName());

            if (nativeType === "nothing") {
                nativeType = "";
            }
        }

        return nativeType;
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
                return "[]";
            case "Option":
                return "";
            case "Optional":
                return "";
            case "Tuple":
                return "[]";
            case "Variadic":
                return "[]";
            default:
                return "";
        }
    }

    private hasAnyCustomTypesInAbi(): boolean {
        if (this.abiRegistry.customTypes.length) {
            return true;
        }

        return false;
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
