import * as errors from "../../errors";
import { guardValueIsSetWithMessage } from "../../utils";
import { ContractInterface } from "./contractInterface";
import { EndpointDefinition, EndpointParameterDefinition } from "./endpoint";
import { EnumType } from "./enum";
import { StructType } from "./struct";
import { TypeMapper } from "./typeMapper";
import { CustomType } from "./types";

export class AbiRegistry {
    readonly interfaces: ContractInterface[] = [];
    readonly customTypes: CustomType[] = [];

    static create(json: { name: string; endpoints: any[]; types: any }): AbiRegistry {
        let registry = new AbiRegistry().extend(json);
        let remappedRegistry = registry.remapToKnownTypes();
        return remappedRegistry;
    }

    private extend(json: { name: string; endpoints: any[]; types: any }): AbiRegistry {
        json.types = json.types || {};

        // The "endpoints" collection is interpreted by "ContractInterface".
        let iface = ContractInterface.fromJSON(json);
        this.interfaces.push(iface);

        for (const customTypeName in json.types) {
            let itemJson = json.types[customTypeName];
            let typeDiscriminant = itemJson.type;
            // Workaround: set the "name" field, as required by "fromJSON()" below.
            itemJson.name = customTypeName;
            let customType = this.createCustomType(typeDiscriminant, itemJson);
            this.customTypes.push(customType);
        }

        return this;
    }

    private createCustomType(typeDiscriminant: string, json: any): CustomType {
        if (typeDiscriminant == "struct") {
            return StructType.fromJSON(json);
        }
        if (typeDiscriminant == "enum") {
            return EnumType.fromJSON(json);
        }
        throw new errors.ErrTypingSystem(`Unknown type discriminant: ${typeDiscriminant}`);
    }

    getInterface(name: string): ContractInterface {
        let result = this.interfaces.find((e) => e.name == name);
        guardValueIsSetWithMessage(`interface [${name}] not found`, result);
        return result!;
    }

    getInterfaces(names: string[]): ContractInterface[] {
        return names.map((name) => this.getInterface(name));
    }

    getStruct(name: string): StructType {
        let result = this.customTypes.find((e) => e.getName() == name && e.hasExactClass(StructType.ClassName));
        guardValueIsSetWithMessage(`struct [${name}] not found`, result);
        return <StructType>result!;
    }

    getStructs(names: string[]): StructType[] {
        return names.map((name) => this.getStruct(name));
    }

    getEnum(name: string): EnumType {
        let result = this.customTypes.find((e) => e.getName() == name && e.hasExactClass(EnumType.ClassName));
        guardValueIsSetWithMessage(`enum [${name}] not found`, result);
        return <EnumType>result!;
    }

    getEnums(names: string[]): EnumType[] {
        return names.map((name) => this.getEnum(name));
    }

    /**
     * Right after loading ABI definitions into a registry, the endpoints and the custom types (structs, enums)
     * use raw types for their I/O parameters (in the case of endpoints), or for their fields (in the case of structs).
     *
     * A raw type is merely an instance of {@link Type}, with a given name and type parameters (if it's a generic type).
     *
     * Though, for most (development) purposes, we'd like to operate using known, specific types (e.g. {@link List}, {@link U8Type} etc.).
     * This function increases the specificity of the types used by parameter / field definitions within a registry (on best-efforts basis).
     * The result is an equivalent, more explicit ABI registry.
     */
    remapToKnownTypes(): AbiRegistry {
        let mapper = new TypeMapper([]);
        let newCustomTypes: CustomType[] = [];
        let newInterfaces: ContractInterface[] = [];

        // First, remap custom types (actually, under the hood, this will remap types of struct fields)
        for (const type of this.customTypes) {
            this.mapCustomTypeDepthFirst(type, this.customTypes, mapper, newCustomTypes);
        }

        if (this.customTypes.length != newCustomTypes.length) {
            throw new errors.ErrTypingSystem("Did not re-map all custom types");
        }

        // Then, remap types of all endpoint parameters.
        // The mapper learned all necessary types in the previous step.
        for (const iface of this.interfaces) {
            let newEndpoints: EndpointDefinition[] = [];
            for (const endpoint of iface.endpoints) {
                newEndpoints.push(mapEndpoint(endpoint, mapper));
            }
            let newConstructor = iface.constructorDefinition ? mapEndpoint(iface.constructorDefinition, mapper) : null;
            newInterfaces.push(new ContractInterface(iface.name, newConstructor, newEndpoints));
        }

        // Now return the new registry, with all types remapped to known types
        let newRegistry = new AbiRegistry();
        newRegistry.customTypes.push(...newCustomTypes);
        newRegistry.interfaces.push(...newInterfaces);

        return newRegistry;
    }

    private mapCustomTypeDepthFirst(typeToMap: CustomType, allTypesToMap: CustomType[], mapper: TypeMapper, mappedTypes: CustomType[]) {
        const hasBeenMapped = mappedTypes.findIndex(type => type.getName() == typeToMap.getName()) >= 0;
        if (hasBeenMapped) {
            return;
        }

        for (const typeName of typeToMap.getNamesOfDependencies()) {
            const dependencyType = allTypesToMap.find(type => type.getName() == typeName);
            if (!dependencyType) {
                // It's a type that we don't have to map (e.g. could be a primitive type).
                continue;
            }

            this.mapCustomTypeDepthFirst(dependencyType, allTypesToMap, mapper, mappedTypes)
        }

        const mappedType = mapper.mapType(typeToMap);
        mappedTypes.push(mappedType);
    }
}

function mapEndpoint(endpoint: EndpointDefinition, mapper: TypeMapper): EndpointDefinition {
    let newInput = endpoint.input.map(
        (e) => new EndpointParameterDefinition(e.name, e.description, mapper.mapType(e.type))
    );
    let newOutput = endpoint.output.map(
        (e) => new EndpointParameterDefinition(e.name, e.description, mapper.mapType(e.type))
    );
    return new EndpointDefinition(endpoint.name, newInput, newOutput, endpoint.modifiers);
}
