import { Address } from "./address";
import { ErrInvariantFailed } from "./errors";
import { Signature } from "./signature";

export function adaptToSignature(obj: any): Signature {
    if (!obj.hex || typeof obj.hex() !== "string") {
        throw new ErrInvariantFailed("adaptToSignature: bad or missing hex()")
    }
    
    return new Signature(obj.hex());
}

export function adaptToAddress(obj: any): Address {
    if (!obj.bech32 || typeof obj.bech32() !== "string") {
        throw new ErrInvariantFailed("adaptToSignature: bad or missing bech32()")
    }
    
    return new Address(obj.bech32());
}
