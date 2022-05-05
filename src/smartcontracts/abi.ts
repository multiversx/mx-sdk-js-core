import { guardValueIsSetWithMessage } from "../utils";
import { ContractFunction } from "./function";
import { AbiRegistry, EndpointDefinition } from "./typesystem";
import { ContractInterface } from "./typesystem/contractInterface";

export class SmartContractAbi {
    private readonly interface: ContractInterface;

    // TODO (breaking, next major version): remove second parameter (not used anymore).
    constructor(registry: AbiRegistry, _implementsInterfaces?: string[]) {
        this.interface = registry.interfaces[0];
    }
    
    getAllEndpoints(): EndpointDefinition[] {
        return this.interface.endpoints;
    }

    getEndpoint(name: string | ContractFunction): EndpointDefinition {
        if (name instanceof ContractFunction) {
            name = name.name;
        }
        let result = this.getAllEndpoints().find(item => item.name === name);
        guardValueIsSetWithMessage(`endpoint [${name}] not found`, result);
        return result!;
    }

    getConstructorDefinition(): EndpointDefinition | null {
        return this.interface.getConstructorDefinition();
    }
}
