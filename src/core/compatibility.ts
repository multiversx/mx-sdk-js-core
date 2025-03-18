import { Address } from "./address";

/**
 * For internal use only.
 */
export class Compatibility {
    /**
     * For internal use only.
     */
    static guardAddressIsSetAndNonZero(address: Address | undefined, context: string, resolution: string) {
        if (!address || address.toBech32() == "") {
            console.warn(
                `${context}: address should be set; ${resolution}. In the future, this will throw an exception instead of emitting a WARN.`,
            );
        } else if (address.toBech32() == Address.Zero().toBech32()) {
            console.warn(
                `${context}: address should not be the 'zero' address (also known as the 'contracts deployment address'); ${resolution}. In the future, this will throw an exception instead of emitting a WARN.`,
            );
        }
    }
}
