import * as path from "path";
import { UserAddress } from "../userAddress";
import { UserSecretKey } from "../userKeys";
import { readTestFile } from "./files";

export const DummyPassword = "password";
export const DummyMnemonic = "moral volcano peasant pass circle pen over picture flat shop clap goat never lyrics gather prepare woman film husband gravity behind test tiger improve";
export const DummyMnemonicOf12Words = "matter trumpet twenty parade fame north lift sail valve salon foster cinnamon";

export async function loadTestWallet(name: string): Promise<TestWallet> {
    const keystore = await loadTestKeystore(`${name}.json`)
    const pemText = await loadTestPemFile(`${name}.pem`)
    const pemKey = UserSecretKey.fromPem(pemText);
    const address = new UserAddress(Buffer.from(keystore.address, "hex"));

    return new TestWallet(address, pemKey.hex(), keystore, pemText);
}

export async function loadTestKeystore(file: string): Promise<any> {
    const testdataPath = path.resolve(__dirname, "..", "testdata");
    const keystorePath = path.resolve(testdataPath, file);
    const json = await readTestFile(keystorePath);
    return JSON.parse(json);
}

export async function loadTestPemFile(file: string): Promise<string> {
    const testdataPath = path.resolve(__dirname, "..", "testdata");
    const pemFilePath = path.resolve(testdataPath, file);
    return await readTestFile(pemFilePath);
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
