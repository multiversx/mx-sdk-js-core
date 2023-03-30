import { Address } from "./address";
import { IAddress } from "./interface";

/**
 * For internal use only.
 */
export class Compatibility {
    static areWarningsEnabled: boolean = true;

    /**
     * For internal use only.
     */
    static guardAddressIsSetAndNonZero(address: IAddress | undefined, context: string, resolution: string) {
        if (!this.areWarningsEnabled) {
            return;
        }

        if (!address || address.bech32() == "") {
            console.warn(`${context}: address should be set; ${resolution}. In the future, this will throw an exception instead of emitting a WARN.`);
        } else if (address.bech32() == Address.Zero().bech32()) {
            console.warn(`${context}: address should not be the 'zero' address (also known as the 'contracts deployment address'); ${resolution}. In the future, this will throw an exception instead of emitting a WARN.`);
        }
    }
}
