import { Address } from "../../core/address";
import { AddressValue } from "./address";
import { List } from "./generic";
import { TokenIdentifierValue } from "./tokenIdentifier";

export function createListOfAddresses(addresses: Address[]): List {
    let addressesTyped = addresses.map((address) => new AddressValue(address));
    let list = List.fromItems(addressesTyped);
    return list;
}

export function createListOfTokenIdentifiers(identifiers: string[]): List {
    let identifiersTyped = identifiers.map((identifier) => new TokenIdentifierValue(identifier));
    let list = List.fromItems(identifiersTyped);
    return list;
}
