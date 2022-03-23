import * as path from "path";
import { UserAddress } from "../userAddress";
import { UserSecretKey } from "../userKeys";
import { readTestFile } from "./files";

export const DummyPassword = "password";
export const DummyMnemonic = "moral volcano peasant pass circle pen over picture flat shop clap goat never lyrics gather prepare woman film husband gravity behind test tiger improve";

export async function loadTestWallet(name: string): Promise<TestWallet> {
    let testdataPath = path.resolve(__dirname, "..", "testdata");
    let jsonFilePath = path.resolve(testdataPath, `${name}.json`);
    let pemFilePath = path.resolve(testdataPath, `${name}.pem`);

    let jsonWallet = JSON.parse(await readTestFile(jsonFilePath));
    let pemText = await readTestFile(pemFilePath);
    let pemKey = UserSecretKey.fromPem(pemText);
    let address = new UserAddress(Buffer.from(jsonWallet.address, "hex"));
    return new TestWallet(address, pemKey.hex(), jsonWallet, pemText);
}

export class TestWallet {
    readonly address: UserAddress;
    readonly secretKeyHex: string;
    readonly secretKey: Buffer;
    readonly keyFileObject: any;
    readonly pemFileText: any;

    constructor(address: UserAddress, secretKeyHex: string, keyFileObject: any, pemFileText: any) {
        this.address = address;
        this.secretKeyHex = secretKeyHex;
        this.secretKey = Buffer.from(secretKeyHex, "hex");
        this.keyFileObject = keyFileObject;
        this.pemFileText = pemFileText;
    }
}
