import { assert } from "chai";
import { Defaults } from "./defaults";

describe("defaults address hrp", () => {
    it("should set and get hrp", async () => {
        let defaultHrp = Defaults.getAddressHrp();
        assert.equal(defaultHrp, "erd")

        Defaults.setAddressHrp("tmx");
        assert.equal(Defaults.getAddressHrp(), "tmx");

        // Set prefix back to "erd" so that other tests will not fail
        Defaults.reset();
    });
});
