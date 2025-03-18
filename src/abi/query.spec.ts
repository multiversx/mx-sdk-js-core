import BigNumber from "bignumber.js";
import { assert } from "chai";
import { Address } from "../core/address";
import { ContractFunction } from "./function";
import { Query } from "./query";
import { BigUIntValue, U32Value } from "./typesystem";
import { BytesValue } from "./typesystem/bytes";

describe("test smart contract queries", () => {
    it("should getEncodedArguments()", async () => {
        let query = new Query({
            func: new ContractFunction("foo"),
            address: new Address("erd1qqqqqqqqqqqqqpgq3ytm9m8dpeud35v3us20vsafp77smqghd8ss4jtm0q"),
            args: [
                new U32Value(100),
                BytesValue.fromUTF8("!"),
                BytesValue.fromHex("abba"),
                new BigUIntValue(new BigNumber("1000000000000000000000000000000000")),
            ],
        });

        let args = query.getEncodedArguments();
        assert.lengthOf(args, 4);
        assert.equal(args[0], "64");
        assert.equal(args[1], "21");
        assert.equal(args[2], "abba");
        assert.equal(args[3], "314dc6448d9338c15b0a00000000");
    });
});
