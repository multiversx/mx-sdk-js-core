import { ErrInvariantFailed } from "../errors";
import { loadAbiRegistry } from "../testutils";
import { guardValueIsSet } from "../utils";
import { ContractFunction } from "./function";
import { AbiRegistry, EndpointDefinition } from "./typesystem";
import { ContractInterface } from "./typesystem/contractInterface";

export class SmartContractAbi {
    private readonly interfaces: ContractInterface[] = [];

    constructor(registry: AbiRegistry, implementsInterfaces: string[]) {
        this.interfaces.push(...registry.getInterfaces(implementsInterfaces));
    }

    static async fromAbiPath(abiPath: string): Promise<SmartContractAbi> {
        let abiRegistry = await loadAbiRegistry([abiPath]);
        let interfaceNames = abiRegistry.interfaces.map(iface => iface.name);
        return new SmartContractAbi(abiRegistry, interfaceNames);
    }

    getAllEndpoints(): EndpointDefinition[] {
        let endpoints = [];

        for (const iface of this.interfaces) {
            endpoints.push(...iface.endpoints);
        }

        return endpoints;
    }

    getEndpoint(name: string | ContractFunction): EndpointDefinition {
        if (name instanceof ContractFunction) {
            name = name.name;
        }
        let result = this.getAllEndpoints().find(item => item.name === name);
        guardValueIsSet("result", result);
        return result!;
    }

    getConstructorDefinition(): EndpointDefinition | null {
        let constructors = [];
        for (const iface of this.interfaces) {
            let constructor_definition = iface.getConstructorDefinition();
            if (constructor_definition !== null) {
                constructors.push(constructor_definition);
            }
        }
        switch (constructors.length) {
            case 0:
                return null;
            case 1:
                return constructors[0];
            default:
                throw new ErrInvariantFailed(`Found more than 1 constructor (found ${constructors.length})`);
        }
    }
}
