import { Address } from "../address";
import { LibraryConfig } from "../config";
import { INonce } from "../interface";
import { Mnemonic, UserSigner, UserWallet } from "../wallet";
import { IAccount } from "./interfaces";

/**
 * An abstraction representing an account (user or Smart Contract) on the Network.
 */
export class Account implements IAccount {
    /**
     * The address of the account.
     */
    readonly address: Address = Address.empty();

    /**
     * The nonce of the account (the account sequence number).
     */
    nonce: INonce = 0;

    /**
     * The signer of the account.
     */
    private signer?: UserSigner;

    /**
     * Creates an account object from an address
     */
    constructor(address: Address, signer?: UserSigner) {
        this.address = address;
        this.signer = signer;
    }

    /**
     * Increments (locally) the nonce (the account sequence number).
     */
    incrementNonce() {
        this.nonce = this.nonce.valueOf() + 1;
    }

    /**
     * Gets then increments (locally) the nonce (the account sequence number).
     */
    getNonceThenIncrement(): INonce {
        let nonce = this.nonce;
        this.nonce = this.nonce.valueOf() + 1;
        return nonce;
    }

    /**
     * Converts the account to a pretty, plain JavaScript object.
     */
    toJSON(): any {
        return {
            address: this.address.bech32(),
            nonce: this.nonce.valueOf(),
        };
    }

    sign(data: Uint8Array): Promise<Uint8Array> {
        if (!this.signer) {
            throw new Error("Signer not initialiezed, please provide the signer when account is instantiated");
        }
        return this.signer.sign(data);
    }

    static newFromPem(path: string, index: number = 0, hrp: string = LibraryConfig.DefaultAddressHrp): Account {
        const userSigner = UserSigner.fromPem(path, index);
        return new Account(userSigner.getAddress(hrp), userSigner);
    }

    static newFromMnemonic(
        mnemonic: string,
        addressIndex: number = 0,
        hrp: string = LibraryConfig.DefaultAddressHrp,
    ): Account {
        const mnemonicHandler = Mnemonic.fromString(mnemonic);
        const secretKey = mnemonicHandler.deriveKey(addressIndex);
        const userSigner = new UserSigner(secretKey);
        return new Account(userSigner.getAddress(hrp), userSigner);
    }

    static newFromKeystore(
        filePath: string,
        password: string,
        addressIndex?: number,
        hrp: string = LibraryConfig.DefaultAddressHrp,
    ): Account {
        const secretKey = UserWallet.loadSecretKey(filePath, password, addressIndex);
        const userSigner = new UserSigner(secretKey);
        return new Account(userSigner.getAddress(hrp), userSigner);
    }
}
