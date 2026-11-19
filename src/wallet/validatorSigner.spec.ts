import { assert } from "chai";
import path from "path";
import { Address } from "../core/address";
import { ErrInvalidArgument, ErrSignerCannotSign } from "../core/errors";
import { getTestWalletsPath } from "../testutils";
import { ValidatorsSigners } from "../validators/validatorsSigner";
import { ValidatorPublicKey, ValidatorSecretKey } from "./validatorKeys";
import { ValidatorSigner } from "./validatorSigner";

// These tests must pass, unchanged, on any implementation of the BLS operations.
describe("test validator signer", () => {
    const walletsPath = getTestWalletsPath();
    const alice = Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");

    // The keys of "multipleValidatorKeys.pem" (the first two are the ones of "validators.pem", as well).
    // The "signatureOfAlice" is the signature of Alice's public key (32 bytes), as required when staking.
    const validators = [
        {
            secretKey: "7c19bf3a0c57cdd1fb08e4607cebaa3647d6b9261b4693f61e96e54b218d442a",
            publicKey:
                "f8910e47cf9464777c912e6390758bb39715fffcb861b184017920e4a807b42553f2f21e7f3914b81bcf58b66a72ab16d97013ae1cff807cefc977ef8cbf116258534b9e46d19528042d16ef8374404a89b184e0a4ee18c77c49e454d04eae8d",
            signatureOfHello:
                "e3709c4301b57f66f253b128d04e6a733d5176446c43a03d27656549fdb21537462882ff68b0c71184cf22a848ffbb97",
            signatureOfAlice:
                "1865870f7f69162a2dfefd33fe232a9ca984c6f22d1ee3f6a5b34a8eb8c9f7319001f29d5a2eed85c1500aca19fa4189",
        },
        {
            secretKey: "3034b1d58628a842984da0c70da0b5a251ebb2aebf51afc5b586e2839b5e5263",
            publicKey:
                "1b4e60e6d100cdf234d3427494dac55fbac49856cadc86bcb13a01b9bb05a0d9143e86c186c948e7ae9e52427c9523102efe9019a2a9c06db02993f2e3e6756576ae5a3ec7c235d548bc79de1a6990e1120ae435cb48f7fc436c9f9098b92a0d",
            signatureOfHello:
                "a43d6beac6370411ff5c59598a9b39e0c53c427903d5568e3e071248a5120709d942213e6f60739ce384283ee6438a85",
            signatureOfAlice:
                "12b309791213aac8ad9f34f0d912261e30f9ab060859e4d515e020a98b91d82a7cd334e4b504bb93d6b75347cccd6318",
        },
        {
            secretKey: "de7e1b385edbb0e1e8f9fc25d91bd8eed71a1da7caab732e6b47a48042d8523d",
            publicKey:
                "e5dc552b4b170cdec4405ff8f9af20313bf0e2756d06c35877b6fbcfa6b354a7b3e2d439ea87999befb09a8fa1b3f014e57ec747bf738c4199338fcd4a87b373dd62f5c8329f1f5f245956bbb06685596a2e83dc38befa63e4a2b5c4ce408506",
            signatureOfHello:
                "eda35a057d557e634a4684d5abb0a644f1ed01fb3c153a83e63e15c2a2ad84b7819155301d1fb79bf3803a2c9a137e05",
            signatureOfAlice:
                "b43c204e57282c5c8b9f49fc7297fa28d76bc64666ef9b1e7f9239d9534b60aeaf56c3197f943431df1254623bd0ed87",
        },
        {
            secretKey: "8ebeb07d296ad2529400b40687a741a135f8357f79f39fcb2894a6f9703a5816",
            publicKey:
                "12773304cb718250edd89770cedcbf675ccdb7fe2b30bd3185ca65ffa0d516879768ed03f92e41a6e5bc5340b78a9d02655e3b727c79730ead791fb68eaa02b84e1be92a816a9604a1ab9a6d3874b638487e2145239438a4bafac3889348d405",
            signatureOfHello:
                "c24a1be71e77ff623e3419520ffbd09922c3d0a9c125f7fb72ea79752bc9a67db041042eef0538debe198ca6a751a687",
            signatureOfAlice:
                "a607f3656c362b6c7b85c89f009a382d3e79002e4293ccf380fa7a75c9b933da45a496f328cd75bc7d0e700ea3ac9a0d",
        },
    ];

    const validatorKey00 = {
        secretKey: "7cff99bd671502db7d15bc8abc0c9a804fb925406fbdd50f1e4c17a4cd774247",
        publicKey:
            "e7beaa95b3877f47348df4dd1cb578a4f7cabf7a20bfeefe5cdd263878ff132b765e04fef6f40c93512b666c47ed7719b8902f6c922c04247989b7137e837cc81a62e54712471c97a2ddab75aa9c2f58f813ed4c0fa722bde0ab718bff382208",
        signatureOfHello:
            "84fd0a3a9d4f1ea2d4b40c6da67f9b786284a1c3895b7253fec7311597cda3f757862bb0690a92a13ce612c33889fd86",
        signatureOfAlice:
            "604882237a9845f508ad03877b5aab90569683eeb51fafcbbeb87440ba359992b3c0b837a8757c25be18132549404f88",
    };

    function toHex(bytes: Uint8Array): string {
        return Buffer.from(bytes).toString("hex");
    }

    it("should sign and provide the public key", () => {
        for (const validator of [...validators, validatorKey00]) {
            const signer = new ValidatorSigner(new ValidatorSecretKey(Buffer.from(validator.secretKey, "hex")));

            assert.instanceOf(signer.getPubkey(), ValidatorPublicKey);
            assert.equal(signer.getPubkey().hex(), validator.publicKey);
            assert.equal(toHex(signer.sign(Buffer.from("hello"))), validator.signatureOfHello);
            assert.equal(toHex(signer.sign(Uint8Array.from(Buffer.from("hello")))), validator.signatureOfHello);
            assert.equal(toHex(signer.sign(alice.getPublicKey())), validator.signatureOfAlice);
            assert.lengthOf(signer.sign(Buffer.from("hello")), 48);
        }
    });

    it("should sign the same as the secret key does", () => {
        const secretKey = new ValidatorSecretKey(Buffer.from(validatorKey00.secretKey, "hex"));
        const signer = new ValidatorSigner(secretKey);

        for (const message of ["", "a", "hello", "MultiversX", "x".repeat(1000)]) {
            assert.equal(toHex(signer.sign(Buffer.from(message))), toHex(secretKey.sign(Buffer.from(message))));
        }
    });

    it("should load from a PEM file (by default, the first key)", async () => {
        const single = await ValidatorSigner.fromPemFile(path.join(walletsPath, "validatorKey00.pem"));
        assert.equal(single.getPubkey().hex(), validatorKey00.publicKey);
        assert.equal(toHex(single.sign(Buffer.from("hello"))), validatorKey00.signatureOfHello);

        const withExtraLines = await ValidatorSigner.fromPemFile(
            path.join(walletsPath, "validatorKey00WithExtraLines.pem"),
        );
        assert.equal(withExtraLines.getPubkey().hex(), validatorKey00.publicKey);
        assert.equal(toHex(withExtraLines.sign(Buffer.from("hello"))), validatorKey00.signatureOfHello);

        const first = await ValidatorSigner.fromPemFile(path.join(walletsPath, "multipleValidatorKeys.pem"));
        assert.equal(first.getPubkey().hex(), validators[0].publicKey);

        for (const [index, validator] of validators.entries()) {
            const signer = await ValidatorSigner.fromPemFile(
                path.join(walletsPath, "multipleValidatorKeys.pem"),
                index,
            );

            assert.equal(signer.getPubkey().hex(), validator.publicKey);
            assert.equal(toHex(signer.sign(Buffer.from("hello"))), validator.signatureOfHello);
            assert.equal(toHex(signer.sign(alice.getPublicKey())), validator.signatureOfAlice);
        }
    });

    it("should not load from a PEM file that is missing, or when the index is out of range", async () => {
        const missing = await ValidatorSigner.fromPemFile(path.join(walletsPath, "missing.pem")).catch((err) => err);
        assert.instanceOf(missing, Error);

        for (const index of [4, 100, -1]) {
            const error = await ValidatorSigner.fromPemFile(
                path.join(walletsPath, "multipleValidatorKeys.pem"),
                index,
            ).catch((err) => err);

            assert.instanceOf(error, ErrInvalidArgument);
        }
    });

    it("should report signing failures as ErrSignerCannotSign", () => {
        const signer = new ValidatorSigner(new ValidatorSecretKey(Buffer.from(validatorKey00.secretKey, "hex")));

        for (const message of [undefined, null, 42, {}]) {
            assert.throws(() => signer.sign(message as any), ErrSignerCannotSign);
        }
    });

    describe("validators signers (used when staking)", () => {
        it("should load all the signers of a PEM file", async () => {
            const signers = await ValidatorsSigners.newFromPem(path.join(walletsPath, "multipleValidatorKeys.pem"));

            assert.equal(signers.getNumOfNodes(), 4);
            assert.lengthOf(signers.getSigners(), 4);
            assert.deepEqual(
                signers.getPublicKeys().map((publicKey) => publicKey.hex()),
                validators.map((validator) => validator.publicKey),
            );

            for (const [index, signer] of signers.getSigners().entries()) {
                assert.equal(signer.getPubkey().hex(), validators[index].publicKey);
                assert.equal(toHex(signer.sign(alice.getPublicKey())), validators[index].signatureOfAlice);
                assert.equal(toHex(signer.sign(Buffer.from("hello"))), validators[index].signatureOfHello);
            }
        });

        it("should load the signers of the other test files", async () => {
            const two = await ValidatorsSigners.newFromPem(path.join(walletsPath, "validators.pem"));
            assert.equal(two.getNumOfNodes(), 2);
            assert.deepEqual(
                two.getPublicKeys().map((publicKey) => publicKey.hex()),
                [validators[0].publicKey, validators[1].publicKey],
            );

            const one = await ValidatorsSigners.newFromPem(path.join(walletsPath, "validatorKey00.pem"));
            assert.equal(one.getNumOfNodes(), 1);
            assert.equal(one.getPublicKeys()[0].hex(), validatorKey00.publicKey);
            assert.equal(toHex(one.getSigners()[0].sign(alice.getPublicKey())), validatorKey00.signatureOfAlice);
        });
    });
});
