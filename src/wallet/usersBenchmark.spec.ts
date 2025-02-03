import { utils } from "@noble/ed25519";
import { assert } from "chai";
import { UserPublicKey, UserSecretKey } from "./userKeys";

describe("behchmark sign and verify", () => {
    it("should sign and verify", async function () {
        this.timeout(60000);

        const n = 1000;
        const secretKeys: UserSecretKey[] = [];
        const publicKeys: UserPublicKey[] = [];
        const messages: Buffer[] = [];
        const goodSignatures: Uint8Array[] = [];

        for (let i = 0; i < n; i++) {
            const secretKey = new UserSecretKey(Buffer.from(utils.randomBytes(32)));
            const publicKey = secretKey.generatePublicKey();
            const message = Buffer.from(utils.randomBytes(256));

            secretKeys.push(secretKey);
            publicKeys.push(publicKey);
            messages.push(message);
        }

        console.info(`N = ${n}`);

        console.time("sign");

        for (let i = 0; i < n; i++) {
            const signature = secretKeys[i].sign(messages[i]);
            goodSignatures.push(signature);
        }

        console.timeEnd("sign");

        console.time("verify (good)");

        for (let i = 0; i < n; i++) {
            const ok = await publicKeys[i].verify(messages[i], goodSignatures[i]);
            assert.isTrue(ok);
        }

        console.timeEnd("verify (good)");

        console.time("verify (bad)");

        for (let i = 0; i < n; i++) {
            const ok = await publicKeys[i].verify(messages[messages.length - i - 1], goodSignatures[i]);
            assert.isFalse(ok);
        }

        console.timeEnd("verify (bad)");
    });
});
