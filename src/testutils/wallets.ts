import { UserSecretKey, UserSigner } from "@multiversx/sdk-wallet";
import { UserSigner as UserSignerNext } from "@multiversx/sdk-wallet-next";
import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import { Account } from "../account";
import { Address } from "../address";
import { IAddress } from "../interface";
import { IAccountOnNetwork } from "../interfaceOfNetwork";
import { isOnBrowserTests } from "./utils";

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
    let walletNames = ["alice", "bob", "carol", "dan", "eve", "frank", "grace", "heidi", "ivan", "judy", "mallory", "mike"];
    let wallets = await Promise.all(walletNames.map(async name => await loadTestWallet(name)));
    let walletMap: Record<string, TestWallet> = {};
    for (let i in walletNames) {
        walletMap[walletNames[i]] = wallets[i];
    }
    return walletMap;
}

export async function loadMnemonic(): Promise<string> {
    return await readTestWalletFileContents("mnemonic.txt");
}

export async function loadPassword(): Promise<string> {
    return await readTestWalletFileContents("password.txt");
}

export async function loadTestWallet(name: string): Promise<TestWallet> {
    let jsonContents = JSON.parse(await readTestWalletFileContents(name + ".json"));
    let pemContents = await readTestWalletFileContents(name + ".pem");
    let pemKey = UserSecretKey.fromPem(pemContents);
    return new TestWallet(
        new Address(jsonContents.address),
        pemKey.hex(),
        jsonContents,
        pemContents);
}

async function readTestWalletFileContents(name: string): Promise<string> {
    let filePath = path.join("src", "testutils", "testwallets", name);

    if (isOnBrowserTests()) {
        return await downloadTextFile(filePath);
    }

    return await fs.promises.readFile(filePath, { encoding: "utf8" });
}

async function downloadTextFile(url: string) {
    let response = await axios.get(url, { responseType: "text", transformResponse: [] });
    let text = response.data.toString();
    return text;
}

export class TestWallet {
    readonly address: Address;
    readonly secretKeyHex: string;
    readonly secretKey: Buffer;
    readonly signer: UserSigner;
    readonly signerNext: UserSignerNext;
    readonly keyFileObject: any;
    readonly pemFileText: any;
    readonly account: Account;

    constructor(address: Address, secretKeyHex: string, keyFileObject: any, pemFileText: any) {
        this.address = address;
        this.secretKeyHex = secretKeyHex;
        this.secretKey = Buffer.from(secretKeyHex, "hex");
        this.signer = new UserSigner(UserSecretKey.fromString(secretKeyHex));
        this.signerNext = new UserSignerNext(UserSecretKey.fromString(secretKeyHex));
        this.keyFileObject = keyFileObject;
        this.pemFileText = pemFileText;
        this.account = new Account(this.address);
    }

    getAddress(): Address {
        return this.address;
    }

    async sync(provider: IAccountFetcher) {
        let accountOnNetwork = await provider.getAccount(this.address);
        await this.account.update(accountOnNetwork);
        return this;
    }
}
