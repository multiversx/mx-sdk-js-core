import * as errors from "../../errors";
import { guardValueIsSetWithMessage } from "../../utils";
import { EndpointDefinition, EndpointParameterDefinition } from "./endpoint";
import { EnumType } from "./enum";
import { EventDefinition, EventTopicDefinition } from "./event";
import { StructType } from "./struct";
import { TypeMapper } from "./typeMapper";
import { CustomType } from "./types";

const interfaceNamePlaceholder = "?";

export class AbiRegistry {
    readonly name: string;
    readonly constructorDefinition: EndpointDefinition;
    readonly endpoints: EndpointDefinition[] = [];
    readonly customTypes: CustomType[] = [];
    readonly events: EventDefinition[] = [];

    private constructor(options: {
        name: string;
        constructorDefinition: EndpointDefinition;
        endpoints: EndpointDefinition[];
        customTypes: CustomType[],
        events?: EventDefinition[]
    }) {
        this.name = options.name;
        this.constructorDefinition = options.constructorDefinition;
        this.endpoints = options.endpoints;
        this.customTypes = options.customTypes;
        this.events = options.events || [];
    }

    static create(options: {
        name?: string;
        constructor?: any,
        endpoints?: any[];
        types?: Record<string, any>
        events?: any[]
    }): AbiRegistry {
        const name = options.name || interfaceNamePlaceholder;
        const constructor = options.constructor || {};
        const endpoints = options.endpoints || [];
        const types = options.types || {};
        const events = options.events || [];

        // Load arbitrary input parameters into properly-defined objects (e.g. EndpointDefinition and CustomType).
        const constructorDefinition = EndpointDefinition.fromJSON({ name: "constructor", ...constructor });
        const endpointDefinitions = endpoints.map(item => EndpointDefinition.fromJSON(item));
        const customTypes: CustomType[] = [];

        for (const customTypeName in types) {
            const typeDefinition = types[customTypeName];

            if (typeDefinition.type == "struct") {
                customTypes.push(StructType.fromJSON({ name: customTypeName, fields: typeDefinition.fields }));
            } else if (typeDefinition.type == "enum") {
                customTypes.push(EnumType.fromJSON({ name: customTypeName, variants: typeDefinition.variants }));
            } else {
                throw new errors.ErrTypingSystem(`Cannot handle custom type: ${customTypeName}`);
            }
        }

        const eventDefinitions = events.map(item => EventDefinition.fromJSON(item));

        const registry = new AbiRegistry({
            name: name,
            constructorDefinition: constructorDefinition,
            endpoints: endpointDefinitions,
            customTypes: customTypes,
            events: eventDefinitions
        });

        const remappedRegistry = registry.remapToKnownTypes();
        return remappedRegistry;
    }

    getCustomType(name: string): CustomType {
        const result = this.customTypes.find((e) => e.getName() == name);
        guardValueIsSetWithMessage(`custom type [${name}] not found`, result);
        return result!;
    }

    getStruct(name: string): StructType {
        const result = this.customTypes.find((e) => e.getName() == name && e.hasExactClass(StructType.ClassName));
        guardValueIsSetWithMessage(`struct [${name}] not found`, result);
        return <StructType>result!;
    }

    getStructs(names: string[]): StructType[] {
        return names.map((name) => this.getStruct(name));
    }

    getEnum(name: string): EnumType {
        const result = this.customTypes.find((e) => e.getName() == name && e.hasExactClass(EnumType.ClassName));
        guardValueIsSetWithMessage(`enum [${name}] not found`, result);
        return <EnumType>result!;
    }

    getEnums(names: string[]): EnumType[] {
        return names.map((name) => this.getEnum(name));
    }

    getEndpoints(): EndpointDefinition[] {
        return this.endpoints;
    }

    getEndpoint(name: string): EndpointDefinition {
        const result = this.endpoints.find((e) => e.name == name);
        guardValueIsSetWithMessage(`endpoint [${name}] not found`, result);
        return result!;
    }

    getEvent(name: string): EventDefinition {
        const result = this.events.find((e) => e.identifier == name);
        guardValueIsSetWithMessage(`event [${name}] not found`, result);
        return result!;
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
        const mapper = new TypeMapper([]);
        const newCustomTypes: CustomType[] = [];

        // First, remap custom types (actually, under the hood, this will remap types of struct fields)
        for (const type of this.customTypes) {
            this.mapCustomTypeDepthFirst(type, this.customTypes, mapper, newCustomTypes);
        }

        if (this.customTypes.length != newCustomTypes.length) {
            throw new errors.ErrTypingSystem("Did not re-map all custom types");
        }

        // Let's remap the constructor:
        const newConstructor = mapEndpoint(this.constructorDefinition, mapper);

        // Then, remap types of all endpoint parameters.
        // The mapper learned all necessary types in the previous step.
        const newEndpoints: EndpointDefinition[] = [];

        for (const endpoint of this.endpoints) {
            newEndpoints.push(mapEndpoint(endpoint, mapper));
        }

        const newEvents: EventDefinition[] = this.events.map((event) => mapEvent(event, mapper));

        // Now return the new registry, with all types remapped to known types
        const newRegistry = new AbiRegistry({
            name: this.name,
            constructorDefinition: newConstructor,
            endpoints: newEndpoints,
            customTypes: newCustomTypes,
            events: newEvents
        });

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
    const newInput = endpoint.input.map(
        (e) => new EndpointParameterDefinition(e.name, e.description, mapper.mapType(e.type))
    );

    const newOutput = endpoint.output.map(
        (e) => new EndpointParameterDefinition(e.name, e.description, mapper.mapType(e.type))
    );

    return new EndpointDefinition(endpoint.name, newInput, newOutput, endpoint.modifiers);
}

function mapEvent(event: EventDefinition, mapper: TypeMapper): EventDefinition {
    const newInputs = event.inputs.map(
        (e) => new EventTopicDefinition({
            name: e.name,
            type: mapper.mapType(e.type),
            indexed: e.indexed
        })
    );

    return new EventDefinition(event.identifier, newInputs);
}
