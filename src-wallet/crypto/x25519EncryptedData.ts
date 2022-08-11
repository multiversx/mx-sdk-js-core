export class X25519EncryptedData {
    nonce: string;
    version: number;
    cipher: string;
    ciphertext: string;
    mac: string;

    constructor(data: Omit<X25519EncryptedData, "toJSON">) {
        this.nonce = data.nonce;
        this.version = data.version;
        this.cipher = data.cipher;
        this.ciphertext = data.ciphertext;
        this.mac = data.mac;
    }

    toJSON(): any {
        return {
            version: this.version,
            nonce: this.nonce,
            crypto: {
                ciphertext: this.ciphertext,
                cipher: this.cipher,
                mac: this.mac,
            }
        };
    }

    static fromJSON(data: any): X25519EncryptedData {
        return new X25519EncryptedData({
            nonce: data.nonce,
            version: data.version,
            ciphertext: data.crypto.ciphertext,
            cipher: data.crypto.cipher,
            mac: data.crypto.mac,
        });
    }
}