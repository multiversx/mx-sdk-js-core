export class Defaults {
    /**
    * The human-readable-part of the bech32 addresses.
    */
    private static AddressHRP = "erd";

    static setAddressHrp(hrp: string) {
        Defaults.AddressHRP = hrp;
    }

    static getAddressHrp(): string {
        return Defaults.AddressHRP;
    }

    static reset() {
        this.AddressHRP = "erd";
    }
}
