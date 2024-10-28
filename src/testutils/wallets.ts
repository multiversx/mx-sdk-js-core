import * as fs from "fs";
import * as path from "path";
import { Account } from "../account";
import { Address } from "../address";
import { IAddress } from "../interface";
import { IAccountOnNetwork } from "../interfaceOfNetwork";
import { getAxios } from "../utils";
import { UserSecretKey, UserSigner } from "./../wallet";
import { readTestFile } from "./files";
import { isOnBrowserTests } from "./utils";

export const DummyMnemonicOf12Words = "matter trumpet twenty parade fame north lift sail valve salon foster cinnamon";

interface IAccountFetcher {
    getAccount(address: IAddress): Promise<IAccountOnNetwork>;
}

export async function loadAndSyncTestWallets(provider: IAccountFetcher): Promise<Record<string, TestWallet>> {
    let wallets = await loadTestWallets();
    await syncTestWallets(wallets, provider);
    return wallets;
}

export async function syncTestWallets(wallets: Record<string, TestWallet>, provider: IAccountFetcher) {
    await Promise.all(Object.values(wallets).map(async (wallet) => wallet.sync(provider)));
}

export async function loadTestWallets(): Promise<Record<string, TestWallet>> {
    let walletNames = [
        "alice",
        "bob",
        "carol",
        "dan",
        "eve",
        "frank",
        "grace",
        "heidi",
        "ivan",
        "judy",
        "mallory",
        "mike",
    ];
    let wallets = await Promise.all(walletNames.map(async (name) => await loadTestWallet(name)));
    let walletMap: Record<string, TestWallet> = {};
    for (let i in walletNames) {
        walletMap[walletNames[i]] = wallets[i];
    }
    return walletMap;
}

export async function loadTestKeystore(file: string): Promise<any> {
    const testdataPath = path.resolve(__dirname, "..", "testdata/testwallets");
    const keystorePath = path.resolve(testdataPath, file);
    const json = await readTestFile(keystorePath);
    return JSON.parse(json);
}

export async function loadMnemonic(): Promise<string> {
    return await readTestWalletFileContents("mnemonic.txt");
}

export async function loadPassword(): Promise<string> {
    return await readTestWalletFileContents("password.txt");
}

export async function loadTestWallet(name: string): Promise<TestWallet> {
    const jsonContents = JSON.parse(await readTestWalletFileContents(name + ".json"));
    const pemContents = await readTestWalletFileContents(name + ".pem");
    const secretKey = UserSecretKey.fromPem(pemContents);
    const publicKey = secretKey.generatePublicKey().valueOf();
    return new TestWallet(new Address(publicKey), secretKey.hex(), jsonContents, pemContents);
}

async function readTestWalletFileContents(name: string): Promise<string> {
    let filePath = path.join("src", "testdata", "testwallets", name);

    if (isOnBrowserTests()) {
        return await downloadTextFile(filePath);
    }

    return await fs.promises.readFile(filePath, { encoding: "utf8" });
}

async function downloadTextFile(url: string) {
    const axios = await getAxios();
    let response = await axios.default.get(url, { responseType: "text", transformResponse: [] });
    let text = response.data.toString();
    return text;
}

export class TestWallet {
    readonly address: Address;
    readonly secretKeyHex: string;
    readonly secretKey: Buffer;
    readonly signer: UserSigner;
    readonly keyFileObject: any;
    readonly pemFileText: any;
    readonly account: Account;

    constructor(address: Address, secretKeyHex: string, keyFileObject: any, pemFileText: any) {
        this.address = address;
        this.secretKeyHex = secretKeyHex;
        this.secretKey = Buffer.from(secretKeyHex, "hex");
        this.signer = new UserSigner(UserSecretKey.fromString(secretKeyHex));
        this.keyFileObject = keyFileObject;
        this.pemFileText = pemFileText;
        this.account = new Account(this.address);
    }

    getAddress(): Address {
        return this.address;
    }

    async sync(provider: IAccountFetcher) {
        let accountOnNetwork = await provider.getAccount(this.address);
        this.account.update(accountOnNetwork);
        return this;
    }
}
