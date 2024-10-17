import { Mnemonic, UserSigner, UserWallet } from "../wallet";
import { LibraryConfig } from "./../config";

export class Account {
    signer: UserSigner;
    address: string;
    nonce: number;

    constructor(signer: UserSigner, hrp: string = LibraryConfig.DefaultAddressHrp) {
        this.signer = signer;
        this.address = signer.getAddress(hrp).bech32();
        this.nonce = 0;
    }

    static newFromPem(filePath: string, index: number = 0, hrp: string = LibraryConfig.DefaultAddressHrp): Account {
        const signer = UserSigner.fromPem(filePath, index);
        return new Account(signer, hrp);
    }

    static newFromKeystore(
        filePath: string,
        password: string,
        addressIndex: number = 0,
        hrp: string = LibraryConfig.DefaultAddressHrp,
    ): Account {
        const secretKey = UserWallet.loadSecretKey(filePath, password, addressIndex);
        const signer = new UserSigner(secretKey);
        return new Account(signer, hrp);
    }

    static newFromMnemonic(
        mnemonic: string,
        addressIndex: number = 0,
        hrp: string = LibraryConfig.DefaultAddressHrp,
    ): Account {
        const mnemonicHandler = Mnemonic.fromString(mnemonic);
        const secretKey = mnemonicHandler.deriveKey(addressIndex);
        return new Account(new UserSigner(secretKey), hrp);
    }

    sign(data: Buffer): Promise<Buffer> {
        return this.signer.sign(data);
    }

    getNonceThenIncrement(): number {
        const nonce = this.nonce;
        this.nonce += 1;
        return nonce;
    }
}
