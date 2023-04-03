import { assert } from "chai";
import {
    TRANSACTION_OPTIONS_DEFAULT, TRANSACTION_OPTIONS_TX_GUARDED, TRANSACTION_OPTIONS_TX_HASH_SIGN, TRANSACTION_VERSION_DEFAULT, TRANSACTION_VERSION_WITH_OPTIONS
} from "./constants";
import { TransactionOptions, TransactionVersion } from "./networkParams";

describe("test transaction version", () => {
    it("constructor of TransactionVersion should work", () => {
        const expectedVersion = 37;
        const version = new TransactionVersion(expectedVersion);

        assert.equal(expectedVersion, version.valueOf());
    });

    it("should init with correct numeric values based on static constructors", () => {
        const versionDefault = TransactionVersion.withDefaultVersion();
        const versionWithOptions = TransactionVersion.withTxOptions();

        assert.equal(TRANSACTION_VERSION_DEFAULT, versionDefault.valueOf());
        assert.equal(TRANSACTION_VERSION_WITH_OPTIONS, versionWithOptions.valueOf());
    });
});

describe("test transaction options", () => {
    it("constructor of TransactionOptions should work", () => {
        let options = new TransactionOptions(37);
        assert.equal(options.valueOf(), 37);
        assert.isTrue(options.isWithHashSign());
        assert.isFalse(options.isWithGuardian());

        options = new TransactionOptions(2);
        assert.equal(options.valueOf(), 2);
        assert.isFalse(options.isWithHashSign());
        assert.isTrue(options.isWithGuardian());

        options = new TransactionOptions(3);
        assert.equal(options.valueOf(), 3);
        assert.isTrue(options.isWithHashSign());
        assert.isTrue(options.isWithGuardian());
    });

    it("should init TransactionOptions with correct numeric values based on static constructors", () => {
        const optionsDefault = TransactionOptions.withDefaultOptions();
        assert.equal(optionsDefault.valueOf(), TRANSACTION_OPTIONS_DEFAULT);
        assert.isFalse(optionsDefault.isWithHashSign());
        assert.isFalse(optionsDefault.isWithGuardian());

        const optionsWithNoFlags = TransactionOptions.withOptions({});
        assert.equal(optionsWithNoFlags.valueOf(), TRANSACTION_OPTIONS_DEFAULT);
        assert.isFalse(optionsDefault.isWithHashSign());
        assert.isFalse(optionsDefault.isWithGuardian());

        const optionsWithHashSign = TransactionOptions.withOptions({ hashSign: true });
        assert.equal(optionsWithHashSign.valueOf(), TRANSACTION_OPTIONS_TX_HASH_SIGN);
        assert.isTrue(optionsWithHashSign.isWithHashSign());
        assert.isFalse(optionsWithHashSign.isWithGuardian());

        const optionsWithGuardian = TransactionOptions.withOptions({ guarded: true });
        assert.equal(optionsWithGuardian.valueOf(), TRANSACTION_OPTIONS_TX_GUARDED);
        assert.isFalse(optionsWithGuardian.isWithHashSign());
        assert.isTrue(optionsWithGuardian.isWithGuardian());

        const optionsWithHashSignAndGuardian = TransactionOptions.withOptions({ hashSign: true, guarded: true });
        assert.equal(optionsWithHashSignAndGuardian.valueOf(), TRANSACTION_OPTIONS_TX_HASH_SIGN | TRANSACTION_OPTIONS_TX_GUARDED);
        assert.isTrue(optionsWithHashSignAndGuardian.isWithHashSign());
        assert.isTrue(optionsWithHashSignAndGuardian.isWithGuardian());
    });
});
