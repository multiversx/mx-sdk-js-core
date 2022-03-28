import { Address } from "./address";
import { ErrInvariantFailed } from "./errors";
import { Signature } from "./signature";

/**
 * Adapts a signature created by other components (e.g. erdjs-walletcore, erdjs-hw-provider) to one understood by erdjs.
 */
export function adaptToSignature(obj: any): Signature {
    if (!obj.hex || typeof obj.hex() !== "string") {
        throw new ErrInvariantFailed("adaptToSignature: bad or missing hex()")
    }
    
    return new Signature(obj.hex());
}

/**
 * Adapts an address created by other components (e.g. erdjs-walletcore, erdjs-hw-provider) to one understood by erdjs.
 */
export function adaptToAddress(obj: any): Address {
    if (!obj.bech32 || typeof obj.bech32() !== "string") {
        throw new ErrInvariantFailed("adaptToSignature: bad or missing bech32()")
    }
    
    return new Address(obj.bech32());
}
