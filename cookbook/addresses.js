import { Address, AddressComputer, AddressFactory, LibraryConfig } from "@multiversx/sdk-core"; // md-ignore

// ## Addresses

// Create an `Address` object from a bech32-encoded string:

// ``` js
{
    // Create an Address object from a bech32-encoded string // md-as-comment
    const address = Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");

    console.log("Address (bech32-encoded):", address.toBech32());
    console.log("Public key (hex-encoded):", address.toHex());
    console.log("Public key (hex-encoded):", Buffer.from(address.getPublicKey()).toString("hex"));
}

// ```

// Here’s how you can create an address from a hex-encoded string using the MultiversX JavaScript SDK:
// If the HRP (human-readable part) is not provided, the SDK will use the default one ("erd"). 

// ``` js
{
    // Create an address from a hex-encoded string with a specified HRP // md-as-comment
    const address = Address.newFromHex("0139472eff6886771a982f3083da5d421f24c29181e63888228dc81ca60d69e1", "erd");

    console.log("Address (bech32-encoded):", address.toBech32());
    console.log("Public key (hex-encoded):", address.toHex());
}
// ```

// #### Create an address from a raw public key

// ``` js
{
    const pubkey = Buffer.from("0139472eff6886771a982f3083da5d421f24c29181e63888228dc81ca60d69e1", "hex");
    const addressFromPubkey = new Address(pubkey, "erd");
}
// ```

// #### Using an AddressFactory to create addresses
// AddressFactory allows creating addresses with a custom HRP, ensuring consistency across your application.

// ``` js
{
    const factory = new AddressFactory("erd");

    const address1 = factory.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
    const address2 = factory.newFromHex("0139472eff6886771a982f3083da5d421f24c29181e63888228dc81ca60d69e1");
    const address3 = factory.fromPublicKey(Buffer.from("0139472eff6886771a982f3083da5d421f24c29181e63888228dc81ca60d69e1", "hex"));
}
// ```

// #### Getting the shard of an address
// ``` js

const addressComputer = new AddressComputer();
console.log("Shard:", addressComputer.getShardOfAddress(address));
// ```

// Checking if an address is a smart contract
// ``` js

const contractAddress = Address.newFromBech32("erd1qqqqqqqqqqqqqpgquzmh78klkqwt0p4rjys0qtp3la07gz4d396qn50nnm");
console.log("Is contract address:", contractAddress.isSmartContract());
// ```

// ### Changing the default hrp
// The **LibraryConfig** class manages the default **HRP** (human-readable part) for addresses, which is set to `"erd"` by default. 
// You can change the HRP when creating an address or modify it globally in **LibraryConfig**, affecting all newly created addresses.
// ``` js

console.log(LibraryConfig.defaultAddressHrp);
const defaultAddress = Address.newFromHex("0139472eff6886771a982f3083da5d421f24c29181e63888228dc81ca60d69e1");
console.log(defaultAddress.toBech32());

LibraryConfig.defaultAddressHrp = "test";
const testAddress = Address.newFromHex("0139472eff6886771a982f3083da5d421f24c29181e63888228dc81ca60d69e1");
console.log(testAddress.toBech32());

// Reset HRP back to "erd" to avoid affecting other parts of the application. // md-as-comment
LibraryConfig.defaultAddressHrp = "erd";
// ```


