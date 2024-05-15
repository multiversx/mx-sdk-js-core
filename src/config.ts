/**
 * Global configuration of the library.
 *
 * Generally speaking, this configuration should only be altered on exotic use cases;
 * it can be seen as a collection of constants (or, to be more precise, rarely changed variables) that are used throughout the library.
 *
 * Never alter the configuration within a library!
 * Only alter the configuration (if needed) within an (end) application that uses this library.
 */
export class LibraryConfig {
    /**
     * The human-readable-part of the bech32 addresses.
     */
    public static DefaultAddressHrp: string = "erd";
}
